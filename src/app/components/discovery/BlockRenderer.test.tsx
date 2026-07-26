import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BlockRenderer from "./BlockRenderer";
import type { ContentBlock } from "@/server/shops/blocks";

describe("BlockRenderer", () => {
  it("renders each block type", () => {
    const blocks: ContentBlock[] = [
      { type: "heading", text: "My Rules" },
      { type: "paragraph", text: "I draw pet portraits." },
      { type: "bulletList", items: ["Sketch", "Full color"] },
    ];
    render(<BlockRenderer blocks={blocks} />);

    expect(screen.getByText("My Rules")).toBeInTheDocument();
    expect(screen.getByText("I draw pet portraits.")).toBeInTheDocument();
    expect(screen.getByText("Sketch")).toBeInTheDocument();
    expect(screen.getByText("Full color")).toBeInTheDocument();
  });
});
