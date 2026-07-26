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
        <div key={index} className="mb-3 rounded border border-gray-300 p-3" data-testid={`block-editor-row-${index}`}>
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>{block.type}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => moveBlock(index, -1)} data-testid="block-editor-move-up-button">
                ↑
              </button>
              <button type="button" onClick={() => moveBlock(index, 1)} data-testid="block-editor-move-down-button">
                ↓
              </button>
              <button type="button" onClick={() => removeBlock(index)} data-testid="block-editor-remove-button">
                Remove
              </button>
            </div>
          </div>

          {(block.type === "heading" || block.type === "paragraph") && (
            <input
              value={block.text}
              onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
              data-testid="block-editor-text-input"
              className="w-full rounded border border-gray-300 p-2"
            />
          )}

          {block.type === "bulletList" && (
            <textarea
              value={block.items.join("\n")}
              onChange={(e) =>
                updateBlock(index, { ...block, items: e.target.value.split("\n") })
              }
              data-testid="block-editor-bullet-list-input"
              className="w-full rounded border border-gray-300 p-2"
              placeholder="One item per line"
            />
          )}

          {block.type === "image" && (
            <input
              value={block.imageUrl}
              onChange={(e) => updateBlock(index, { ...block, imageUrl: e.target.value })}
              placeholder="Image URL (upload via the portfolio manager first)"
              data-testid="block-editor-image-url-input"
              className="w-full rounded border border-gray-300 p-2"
            />
          )}
        </div>
      ))}

      <div className="flex gap-2 text-sm">
        <button type="button" onClick={() => addBlock("heading")} data-testid="block-editor-add-heading-button">
          + Heading
        </button>
        <button type="button" onClick={() => addBlock("paragraph")} data-testid="block-editor-add-paragraph-button">
          + Paragraph
        </button>
        <button type="button" onClick={() => addBlock("bulletList")} data-testid="block-editor-add-bullet-list-button">
          + Bullet list
        </button>
        <button type="button" onClick={() => addBlock("image")} data-testid="block-editor-add-image-button">
          + Image
        </button>
      </div>
    </div>
  );
}
