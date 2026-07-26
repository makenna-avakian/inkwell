import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TierListEditor from "./TierListEditor";

describe("TierListEditor", () => {
  it("adds a new tier row", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TierListEditor tiers={[]} onChange={onChange} />);

    await user.click(screen.getByTestId("tier-list-editor-add-button"));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: "", priceCents: 0 }),
    ]);
  });

  it("removes a tier row", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TierListEditor
        tiers={[{ id: "t1", name: "Sketch", description: "", priceCents: 1000 }]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTestId("tier-list-editor-remove-button"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
