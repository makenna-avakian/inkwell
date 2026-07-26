import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlockEditor from "./BlockEditor";
import type { ContentBlock } from "@/server/shops/blocks";

describe("BlockEditor", () => {
  it("adds a heading block", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BlockEditor blocks={[]} onChange={onChange} />);

    await user.click(screen.getByTestId("block-editor-add-heading-button"));
    expect(onChange).toHaveBeenCalledWith([{ type: "heading", text: "" }]);
  });

  it("reorders blocks with move-up", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const blocks: ContentBlock[] = [
      { type: "heading", text: "A" },
      { type: "paragraph", text: "B" },
    ];
    render(<BlockEditor blocks={blocks} onChange={onChange} />);

    const moveUpButtons = screen.getAllByTestId("block-editor-move-up-button");
    await user.click(moveUpButtons[1]); // move the second block up

    expect(onChange).toHaveBeenCalledWith([
      { type: "paragraph", text: "B" },
      { type: "heading", text: "A" },
    ]);
  });

  it("removes a block", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BlockEditor blocks={[{ type: "heading", text: "A" }]} onChange={onChange} />);

    await user.click(screen.getByTestId("block-editor-remove-button"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
