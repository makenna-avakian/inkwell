import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(auth)/sign-up/actions", () => ({
  signUpAction: vi.fn(async (_prevState: unknown, formData: FormData) => {
    const email = formData.get("email");
    if (email === "taken@example.com") {
      return { fieldErrors: { email: "An account with this email already exists." } };
    }
    return { fieldErrors: {} };
  }),
}));

vi.mock("@/app/(auth)/oauth-actions", () => ({
  signInWithGoogleAction: vi.fn(),
}));

import SignUpForm from "./SignUpForm";

describe("SignUpForm", () => {
  it("renders email, password, and Google OAuth controls", () => {
    render(<SignUpForm />);
    expect(screen.getByTestId("sign-up-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("sign-up-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("oauth-google-button")).toBeInTheDocument();
  });

  it("shows a field error returned by the action", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByTestId("sign-up-email-input"), "taken@example.com");
    await user.type(screen.getByTestId("sign-up-password-input"), "password123");
    await user.click(screen.getByTestId("sign-up-submit-button"));

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists."),
      ).toBeInTheDocument();
    });
  });
});
