import Image from "next/image";
import type { ContentBlock } from "@/server/shops/blocks";

interface BlockRendererProps {
  blocks: ContentBlock[];
}

/** Read-only counterpart to Unit 2's BlockEditor — renders published commission rules. */
export default function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div data-testid="block-renderer">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h3 key={index} className="mt-4 font-serif text-xl font-medium text-foreground">
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={index} className="mt-2">
                {block.text}
              </p>
            );
          case "bulletList":
            return (
              <ul key={index} className="mt-2 list-disc pl-6">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            );
          case "image":
            return (
              <figure key={index} className="mt-4">
                <Image src={block.imageUrl} alt={block.caption ?? ""} width={400} height={300} />
                {block.caption && <figcaption className="text-sm text-muted">{block.caption}</figcaption>}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
