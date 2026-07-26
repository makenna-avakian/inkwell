import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/requests/actions", () => ({
  joinWaitlistAction: vi.fn(),
}));

import { joinWaitlistAction } from "@/app/requests/actions";
import WaitlistJoinButton from "./WaitlistJoinButton";

const mockJoin = vi.mocked(joinWaitlistAction);

describe("WaitlistJoinButton", () => {
  it("shows 'Joined waitlist' and disables the button after success", async () => {
    mockJoin.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<WaitlistJoinButton shopId="shop-1" />);

    await user.click(screen.getByTestId("waitlist-join-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("waitlist-join-submit-button")).toBeDisabled();
    });
    expect(screen.getByText("Joined waitlist")).toBeInTheDocument();
  });

  it("shows an error and stays enabled on failure", async () => {
    mockJoin.mockResolvedValue({ formError: "This shop isn't accepting waitlist signups right now." });
    const user = userEvent.setup();
    render(<WaitlistJoinButton shopId="shop-1" />);

    await user.click(screen.getByTestId("waitlist-join-submit-button"));

    await waitFor(() => {
      expect(
        screen.getByText("This shop isn't accepting waitlist signups right now."),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("waitlist-join-submit-button")).not.toBeDisabled();
  });
});
