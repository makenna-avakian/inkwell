import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  listingImages,
  listings,
  shopProfiles,
  type Listing,
  type NewListing,
} from "@/server/db/schema";

export async function findListingById(listingId: string): Promise<Listing | undefined> {
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  return listing;
}

/** Joined lookup so callers can check `shop.userId` for ownership without a second query. */
export async function findListingWithShopOwner(listingId: string) {
  const [row] = await db
    .select({ listing: listings, shopUserId: shopProfiles.userId })
    .from(listings)
    .innerJoin(shopProfiles, eq(listings.shopId, shopProfiles.id))
    .where(eq(listings.id, listingId))
    .limit(1);
  return row;
}

export async function createListingRow(input: NewListing): Promise<Listing> {
  const [listing] = await db.insert(listings).values(input).returning();
  return listing;
}

export async function updateListingRow(
  listingId: string,
  patch: Partial<
    Pick<NewListing, "title" | "description" | "priceCents" | "medium" | "styleTags">
  >,
): Promise<Listing> {
  const [listing] = await db
    .update(listings)
    .set(patch)
    .where(eq(listings.id, listingId))
    .returning();
  return listing;
}

export async function setListingStatusRow(
  listingId: string,
  status: "available" | "sold" | "removed",
): Promise<Listing> {
  const [listing] = await db
    .update(listings)
    .set({ status })
    .where(eq(listings.id, listingId))
    .returning();
  return listing;
}

export async function listAvailableListingsForShop(shopId: string): Promise<Listing[]> {
  return db
    .select()
    .from(listings)
    .where(and(eq(listings.shopId, shopId), eq(listings.status, "available")));
}

export async function addListingImageRow(listingId: string, imageUrl: string) {
  const [{ value: maxPosition }] = await db
    .select({ value: max(listingImages.position) })
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId));

  const [image] = await db
    .insert(listingImages)
    .values({ listingId, imageUrl, position: (maxPosition ?? 0) + 1 })
    .returning();
  return image;
}

export async function listListingImages(listingId: string) {
  return db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId))
    .orderBy(asc(listingImages.position));
}
