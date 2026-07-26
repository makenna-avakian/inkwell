import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(seller)/shop/rules/actions", () => ({
  publishRuleSetAction: vi.fn(),
}));

import { publishRuleSetAction } from "@/app/(seller)/shop/rules/actions";
import CommissionRulesEditor from "./CommissionRulesEditor";

const mockPublish = vi.mocked(publishRuleSetAction);

describe("CommissionRulesEditor", () => {
  it("publishes with the current tiers/add-ons/blocks/maxQueue", async () => {
    mockPublish.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <CommissionRulesEditor
        shopId="shop-1"
        initialTiers={[{ id: "t1", name: "Sketch", description: "", priceCents: 1000 }]}
      />,
    );

    await user.click(screen.getByTestId("commission-rules-editor-publish-button"));

    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith(
        "shop-1",
        expect.objectContaining({
          tiers: [{ id: "t1", name: "Sketch", description: "", priceCents: 1000 }],
        }),
      );
    });
  });

  it("surfaces a validation error from the server action", async () => {
    mockPublish.mockResolvedValue({ formError: "At least one tier is required." });
    const user = userEvent.setup();
    render(<CommissionRulesEditor shopId="shop-1" />);

    await user.click(screen.getByTestId("commission-rules-editor-publish-button"));

    await waitFor(() => {
      expect(screen.getByText("At least one tier is required.")).toBeInTheDocument();
    });
  });
});
