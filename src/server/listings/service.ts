import { z } from "zod";
import { createPresignedUpload, validateImageUpload } from "@/server/shops/storage";
import {
  addListingImageRow,
  createListingRow,
  findListingById,
  findListingWithShopOwner,
  listListingImages,
  setListingStatusRow,
  updateListingRow,
} from "@/server/listings/repository";
import type { Listing } from "@/server/db/schema";

export class NotListingOwnerError extends Error {
  constructor() {
    super("You do not have permission to modify this listing.");
    this.name = "NotListingOwnerError";
  }
}

export class ListingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListingValidationError";
  }
}

/** BR-2: object-level authorization, mirroring Unit 2's assertOwner pattern
 *  but resolved via the listing's shop rather than the shop directly. */
async function assertListingOwner(listingId: string, callerId: string): Promise<Listing> {
  const row = await findListingWithShopOwner(listingId);
  if (!row || row.shopUserId !== callerId) {
    throw new NotListingOwnerError();
  }
  return row.listing;
}

export const createListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(), // BR-1: non-negative, zero allowed
});

export async function createListing(
  shopId: string,
  input: z.infer<typeof createListingSchema>,
): Promise<Listing> {
  let parsed: z.infer<typeof createListingSchema>;
  try {
    parsed = createListingSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ListingValidationError(error.issues[0]?.message ?? "Invalid listing.");
    }
    throw error;
  }
  return createListingRow({
    shopId,
    title: parsed.title,
    description: parsed.description ?? null,
    priceCents: parsed.priceCents,
  });
}

export async function updateListing(
  listingId: string,
  callerId: string,
  patch: Partial<z.infer<typeof createListingSchema>>,
): Promise<Listing> {
  await assertListingOwner(listingId, callerId);
  if (patch.priceCents !== undefined && patch.priceCents < 0) {
    throw new ListingValidationError("Price must not be negative.");
  }
  return updateListingRow(listingId, patch);
}

export async function addListingImage(
  listingId: string,
  callerId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  await assertListingOwner(listingId, callerId);
  validateImageUpload(contentType, sizeBytes); // BR-5: reused from Unit 2, not reimplemented

  const extension = fileName.split(".").pop() ?? "bin";
  const objectKeyPath = `shops/listings/${listingId}/${crypto.randomUUID()}.${extension}`;
  return createPresignedUpload(objectKeyPath, contentType); // reused from Unit 2
}

export async function confirmListingImage(
  listingId: string,
  callerId: string,
  imageUrl: string,
) {
  await assertListingOwner(listingId, callerId);
  return addListingImageRow(listingId, imageUrl);
}

export async function getListingImages(listingId: string) {
  return listListingImages(listingId);
}

/** BR-4: no rigid state machine — any transition among the three states is allowed. */
export async function setListingStatus(
  listingId: string,
  callerId: string,
  status: "available" | "sold" | "removed",
): Promise<Listing> {
  await assertListingOwner(listingId, callerId);
  return setListingStatusRow(listingId, status);
}

/** Read path used by Units 4/6 — returns regardless of status (Unit 6 needs `sold` listings too). */
export async function getListing(listingId: string): Promise<Listing | undefined> {
  return findListingById(listingId);
}
