import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/components/auth/sign-out-action", () => ({
  signOutAction: vi.fn(),
}));

import UserMenu from "./UserMenu";

describe("UserMenu", () => {
  it("is closed by default and shows an initial-letter avatar", () => {
    render(<UserMenu displayName="verify-test" isSeller={false} />);
    expect(screen.getByTestId("navbar-user-menu-button")).toHaveTextContent("V");
    expect(screen.queryByTestId("navbar-user-menu-dropdown")).not.toBeInTheDocument();
  });

  it("opens to show Account, Sign out, and an Open a Shop link (not My Shop) for a buyer", async () => {
    const user = userEvent.setup();
    render(<UserMenu displayName="verify-test" isSeller={false} />);

    await user.click(screen.getByTestId("navbar-user-menu-button"));

    expect(screen.getByTestId("navbar-user-menu-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("navbar-user-menu-account-link")).toBeInTheDocument();
    expect(screen.getByTestId("navbar-user-menu-sign-out-button")).toBeInTheDocument();
    expect(screen.queryByTestId("navbar-user-menu-shop-link")).not.toBeInTheDocument();
    expect(screen.getByTestId("navbar-user-menu-open-shop-link")).toHaveAttribute("href", "/shop/new");
  });

  it("shows My Shop instead of Open a Shop for a seller", async () => {
    const user = userEvent.setup();
    render(<UserMenu displayName="verify-test" isSeller={true} />);

    await user.click(screen.getByTestId("navbar-user-menu-button"));

    expect(screen.getByTestId("navbar-user-menu-shop-link")).toBeInTheDocument();
    expect(screen.queryByTestId("navbar-user-menu-open-shop-link")).not.toBeInTheDocument();
  });

  it("closes when clicking outside the menu", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <UserMenu displayName="verify-test" isSeller={false} />
        <div data-testid="outside">outside</div>
      </div>,
    );

    await user.click(screen.getByTestId("navbar-user-menu-button"));
    expect(screen.getByTestId("navbar-user-menu-dropdown")).toBeInTheDocument();

    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByTestId("navbar-user-menu-dropdown")).not.toBeInTheDocument();
  });
});
