import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/account/actions", () => ({
  updateDisplayNameAction: vi.fn(),
}));

import { updateDisplayNameAction } from "@/app/account/actions";
import DisplayNameForm from "./DisplayNameForm";

const mockUpdate = vi.mocked(updateDisplayNameAction);

describe("DisplayNameForm", () => {
  it("shows a success message after saving", async () => {
    mockUpdate.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<DisplayNameForm initialDisplayName="Old Name" />);

    await user.click(screen.getByTestId("display-name-form-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("display-name-form-success")).toBeInTheDocument();
    });
  });

  it("shows an error on failure", async () => {
    mockUpdate.mockResolvedValue({ formError: "Something went wrong. Please try again." });
    const user = userEvent.setup();
    render(<DisplayNameForm initialDisplayName="Old Name" />);

    await user.click(screen.getByTestId("display-name-form-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("display-name-form-error")).toHaveTextContent(
        "Something went wrong. Please try again.",
      );
    });
  });
});
