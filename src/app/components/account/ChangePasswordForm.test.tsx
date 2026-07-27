import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/account/actions", () => ({
  changePasswordAction: vi.fn(),
}));

import { changePasswordAction } from "@/app/account/actions";
import ChangePasswordForm from "./ChangePasswordForm";

const mockChange = vi.mocked(changePasswordAction);

describe("ChangePasswordForm", () => {
  it("clears the fields and shows a success message after updating", async () => {
    mockChange.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByTestId("change-password-form-current-input"), "old-password");
    await user.type(screen.getByTestId("change-password-form-new-input"), "new-password-123");
    await user.click(screen.getByTestId("change-password-form-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("change-password-form-success")).toBeInTheDocument();
    });
    expect(screen.getByTestId("change-password-form-current-input")).toHaveValue("");
    expect(screen.getByTestId("change-password-form-new-input")).toHaveValue("");
  });

  it("shows the service's error message and keeps the fields filled on failure", async () => {
    mockChange.mockResolvedValue({ formError: "Current password is incorrect." });
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByTestId("change-password-form-current-input"), "wrong-password");
    await user.type(screen.getByTestId("change-password-form-new-input"), "new-password-123");
    await user.click(screen.getByTestId("change-password-form-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("change-password-form-error")).toHaveTextContent(
        "Current password is incorrect.",
      );
    });
  });
});
