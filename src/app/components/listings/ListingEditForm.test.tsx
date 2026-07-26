import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(seller)/shop/listings/actions", () => ({
  updateListingAction: vi.fn(async () => ({ fieldErrors: {} })),
  setListingStatusAction: vi.fn(async () => ({})),
}));

import { setListingStatusAction } from "@/app/(seller)/shop/listings/actions";
import ListingEditForm from "./ListingEditForm";

const mockSetStatus = vi.mocked(setListingStatusAction);

describe("ListingEditForm", () => {
  it("marks a listing sold", async () => {
    const user = userEvent.setup();
    render(
      <ListingEditForm
        listingId="listing-1"
        initialTitle="Piece"
        initialPriceCents={1000}
        initialStatus="available"
      />,
    );

    await user.click(screen.getByTestId("listing-edit-form-mark-sold-button"));

    expect(mockSetStatus).toHaveBeenCalledWith("listing-1", "sold");
    await waitFor(() => {
      expect(screen.getByTestId("listing-edit-form-mark-sold-button")).toBeDisabled();
    });
  });

  it("reverts optimistic status change on failure", async () => {
    mockSetStatus.mockResolvedValueOnce({ error: "You do not have permission to modify this listing." });
    const user = userEvent.setup();
    render(
      <ListingEditForm
        listingId="listing-1"
        initialTitle="Piece"
        initialPriceCents={1000}
        initialStatus="available"
      />,
    );

    await user.click(screen.getByTestId("listing-edit-form-mark-sold-button"));

    await waitFor(() => {
      expect(
        screen.getByText("You do not have permission to modify this listing."),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("listing-edit-form-mark-sold-button")).not.toBeDisabled();
  });
});
