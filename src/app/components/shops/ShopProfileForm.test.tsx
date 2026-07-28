import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(seller)/shop/actions", () => ({
  createShopAction: vi.fn(),
  updateShopAction: vi.fn(),
}));

import { createShopAction, updateShopAction } from "@/app/(seller)/shop/actions";
import ShopProfileForm from "./ShopProfileForm";

const mockCreateShopAction = vi.mocked(createShopAction);
const mockUpdateShopAction = vi.mocked(updateShopAction);

describe("ShopProfileForm", () => {
  it("shows 'Create Shop' in create mode and calls createShopAction", async () => {
    mockCreateShopAction.mockResolvedValue({ fieldErrors: {} });
    render(<ShopProfileForm mode="create" />);

    expect(screen.getByText("Create Shop")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("shop-profile-form-submit-button"));

    await waitFor(() => {
      expect(mockCreateShopAction).toHaveBeenCalled();
    });
  });

  it("shows 'Save Changes' in edit mode with pre-filled values, and calls the bound updateShopAction", async () => {
    mockUpdateShopAction.mockReturnValue(
      Promise.resolve({ fieldErrors: {} }) as ReturnType<typeof updateShopAction>,
    );
    render(
      <ShopProfileForm
        mode="edit"
        shopId="shop-1"
        initialShopName="Jane's Studio"
        initialBio="Hi there"
        initialSocialLinks={[{ id: "1", label: "Instagram", url: "https://instagram.com/x" }]}
      />,
    );

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByTestId("shop-profile-form-shop-name-input")).toHaveValue("Jane's Studio");
    expect(screen.getByTestId("shop-profile-form-bio-input")).toHaveValue("Hi there");
    expect(screen.getByTestId("social-links-editor-label-input")).toHaveValue("Instagram");
  });

  it("shows a field error for shopName returned by the action", async () => {
    mockUpdateShopAction.mockReturnValue(
      Promise.resolve({ fieldErrors: { shopName: "Too long." } }) as ReturnType<
        typeof updateShopAction
      >,
    );
    const user = userEvent.setup();
    render(<ShopProfileForm mode="edit" shopId="shop-1" />);

    await user.click(screen.getByTestId("shop-profile-form-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Too long.")).toBeInTheDocument();
    });
  });

  it("adds a social link row via the editor and reflects it in the hidden field", async () => {
    mockUpdateShopAction.mockReturnValue(
      Promise.resolve({ fieldErrors: {} }) as ReturnType<typeof updateShopAction>,
    );
    const user = userEvent.setup();
    render(<ShopProfileForm mode="edit" shopId="shop-1" />);

    await user.click(screen.getByTestId("social-links-editor-add-button"));

    expect(screen.getByTestId("social-links-editor-label-input")).toBeInTheDocument();
  });
});
