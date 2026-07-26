import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(auth)/sign-in/actions", () => ({
  signInAction: vi.fn(async (_prevState: unknown, formData: FormData) => {
    const email = formData.get("email");
    if (email === "ratelimited@example.com") {
      return {
        formError: "Too many attempts. Try again in 4s.",
        retryAfterSeconds: 4,
      };
    }
    if (email === "wrong@example.com") {
      return { formError: "Invalid email or password." };
    }
    return {};
  }),
}));

vi.mock("@/app/(auth)/oauth-actions", () => ({
  signInWithGoogleAction: vi.fn(),
}));

import SignInForm from "./SignInForm";

describe("SignInForm", () => {
  it("renders email, password, and Google OAuth controls", () => {
    render(<SignInForm />);
    expect(screen.getByTestId("sign-in-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("oauth-google-button")).toBeInTheDocument();
  });

  it("shows a generic error for invalid credentials (enumeration-safe)", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByTestId("sign-in-email-input"), "wrong@example.com");
    await user.type(screen.getByTestId("sign-in-password-input"), "wrongpass");
    await user.click(screen.getByTestId("sign-in-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
    });
  });

  it("disables the submit button while rate-limited", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(
      screen.getByTestId("sign-in-email-input"),
      "ratelimited@example.com",
    );
    await user.type(screen.getByTestId("sign-in-password-input"), "whatever");
    await user.click(screen.getByTestId("sign-in-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-submit-button")).toBeDisabled();
    });
  });
});
