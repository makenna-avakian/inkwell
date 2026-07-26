import { z } from "zod";

/** ContentBlock schema — aidlc-docs/construction/unit-2-shops/functional-design/domain-entities.md */
export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string().min(1) }),
  z.object({ type: z.literal("paragraph"), text: z.string().min(1) }),
  z.object({
    type: z.literal("bulletList"),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("image"),
    imageUrl: z.string().url(),
    caption: z.string().optional(),
  }),
]);

export type ContentBlock = z.infer<typeof contentBlockSchema>;

export const blocksSchema = z.array(contentBlockSchema);

/** Validates and normalizes a blocks array before it's stored as jsonb. */
export function parseBlocks(input: unknown): ContentBlock[] {
  return blocksSchema.parse(input);
}

/**
 * Round-trip through JSON, mirroring how the value actually travels
 * (client -> Server Action -> jsonb column -> read back). Used by PBT-01/
 * PBT-02 to verify no information is lost. See business-rules.md.
 */
export function serializeBlocks(blocks: ContentBlock[]): string {
  return JSON.stringify(parseBlocks(blocks));
}

export function deserializeBlocks(serialized: string): ContentBlock[] {
  return parseBlocks(JSON.parse(serialized));
}
