import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { deserializeBlocks, parseBlocks, serializeBlocks } from "@/server/shops/blocks";

const blockArb = fc.oneof(
  fc.record({ type: fc.constant("heading" as const), text: fc.string({ minLength: 1 }) }),
  fc.record({ type: fc.constant("paragraph" as const), text: fc.string({ minLength: 1 }) }),
  fc.record({
    type: fc.constant("bulletList" as const),
    items: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
  }),
  fc.record({
    type: fc.constant("image" as const),
    imageUrl: fc.webUrl(),
    caption: fc.option(fc.string(), { nil: undefined }),
  }),
);

describe("blocks (example-based)", () => {
  it("accepts a valid heading/paragraph/bulletList/image array", () => {
    const blocks = parseBlocks([
      { type: "heading", text: "Commission Rules" },
      { type: "paragraph", text: "I draw pet portraits." },
      { type: "bulletList", items: ["Sketch", "Full color"] },
      { type: "image", imageUrl: "https://media.inkwell.app/prod/example.png" },
    ]);
    expect(blocks).toHaveLength(4);
  });

  it("rejects an unknown block type", () => {
    expect(() => parseBlocks([{ type: "priceTable" }])).toThrow();
  });
});

describe("blocks (PBT-01/PBT-02: JSON round-trip property)", () => {
  it("deserializeBlocks(serializeBlocks(blocks)) equals the original for any valid block array", () => {
    fc.assert(
      fc.property(fc.array(blockArb, { maxLength: 20 }), (blocks) => {
        const roundTripped = deserializeBlocks(serializeBlocks(blocks));
        expect(roundTripped).toEqual(blocks);
      }),
    );
  });
});
