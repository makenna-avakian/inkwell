"use client";

import type { ContentBlock } from "@/server/shops/blocks";

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

/** Editor for the rules "living document" content blocks (domain-entities.md's Block Schema). */
export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  function addBlock(type: ContentBlock["type"]) {
    const newBlock: ContentBlock =
      type === "heading"
        ? { type: "heading", text: "" }
        : type === "paragraph"
          ? { type: "paragraph", text: "" }
          : type === "bulletList"
            ? { type: "bulletList", items: [""] }
            : { type: "image", imageUrl: "" };
    onChange([...blocks, newBlock]);
  }

  function updateBlock(index: number, block: ContentBlock) {
    onChange(blocks.map((b, i) => (i === index ? block : b)));
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div data-testid="block-editor">
      {blocks.map((block, index) => (
        <div key={index} className="mb-3 border border-border bg-surface p-3" data-testid={`block-editor-row-${index}`}>
          <div className="mb-2 flex items-center justify-between text-xs tracking-[0.1em] text-muted uppercase">
            <span>{block.type}</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => moveBlock(index, -1)}
                data-testid="block-editor-move-up-button"
                className="text-foreground transition-colors hover:text-accent"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 1)}
                data-testid="block-editor-move-down-button"
                className="text-foreground transition-colors hover:text-accent"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeBlock(index)}
                data-testid="block-editor-remove-button"
                className="text-foreground transition-colors hover:text-accent"
              >
                Remove
              </button>
            </div>
          </div>

          {(block.type === "heading" || block.type === "paragraph") && (
            <input
              value={block.text}
              onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
              data-testid="block-editor-text-input"
              className="w-full border border-border bg-background p-2 text-foreground focus:border-accent focus:outline-none"
            />
          )}

          {block.type === "bulletList" && (
            <textarea
              value={block.items.join("\n")}
              onChange={(e) =>
                updateBlock(index, { ...block, items: e.target.value.split("\n") })
              }
              data-testid="block-editor-bullet-list-input"
              className="w-full border border-border bg-background p-2 text-foreground focus:border-accent focus:outline-none"
              placeholder="One item per line"
            />
          )}

          {block.type === "image" && (
            <input
              value={block.imageUrl}
              onChange={(e) => updateBlock(index, { ...block, imageUrl: e.target.value })}
              placeholder="Image URL (upload via the portfolio manager first)"
              data-testid="block-editor-image-url-input"
              className="w-full border border-border bg-background p-2 text-foreground focus:border-accent focus:outline-none"
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-4 text-xs font-medium tracking-[0.1em] text-foreground uppercase">
        <button
          type="button"
          onClick={() => addBlock("heading")}
          data-testid="block-editor-add-heading-button"
          className="underline underline-offset-4 transition-colors hover:text-accent"
        >
          + Heading
        </button>
        <button
          type="button"
          onClick={() => addBlock("paragraph")}
          data-testid="block-editor-add-paragraph-button"
          className="underline underline-offset-4 transition-colors hover:text-accent"
        >
          + Paragraph
        </button>
        <button
          type="button"
          onClick={() => addBlock("bulletList")}
          data-testid="block-editor-add-bullet-list-button"
          className="underline underline-offset-4 transition-colors hover:text-accent"
        >
          + Bullet List
        </button>
        <button
          type="button"
          onClick={() => addBlock("image")}
          data-testid="block-editor-add-image-button"
          className="underline underline-offset-4 transition-colors hover:text-accent"
        >
          + Image
        </button>
      </div>
    </div>
  );
}
