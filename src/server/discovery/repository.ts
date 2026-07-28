import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  listingImages,
  listings,
  shopCommissionSettings,
  shopProfiles,
  users,
} from "@/server/db/schema";

export interface FeedCandidate {
  listingId: string;
  title: string;
  priceCents: number;
  medium: string | null;
  styleTags: string[];
  imageUrl: string | null;
  shopId: string;
  shopDisplayName: string;
  shopSlotState: "open" | "closed" | "waitlist";
}

/**
 * Fetches available listings narrowed by the SQL-cheap filters (medium is an
 * exact match, indexed). Style-tag overlap and commission-availability are
 * applied afterward in service.ts via filters.ts's pure predicates — see
 * that file's top comment for why.
 */
export async function findAvailableListingCandidates(
  medium?: string,
): Promise<FeedCandidate[]> {
  const rows = await db
    .select({
      listingId: listings.id,
      title: listings.title,
      priceCents: listings.priceCents,
      medium: listings.medium,
      styleTags: listings.styleTags,
      shopId: shopProfiles.id,
      shopDisplayName: sql<string>`coalesce(${shopProfiles.shopName}, ${users.displayName})`,
      shopSlotState: shopCommissionSettings.slotState,
    })
    .from(listings)
    .innerJoin(shopProfiles, eq(listings.shopId, shopProfiles.id))
    .innerJoin(users, eq(shopProfiles.userId, users.id))
    .innerJoin(shopCommissionSettings, eq(shopCommissionSettings.shopId, shopProfiles.id))
    .where(
      medium
        ? and(eq(listings.status, "available"), eq(listings.medium, medium))
        : eq(listings.status, "available"),
    );

  // First image per listing, fetched separately (simpler than a lateral join for Phase 1 scale).
  const withImages = await Promise.all(
    rows.map(async (row) => {
      const [firstImage] = await db
        .select({ imageUrl: listingImages.imageUrl })
        .from(listingImages)
        .where(eq(listingImages.listingId, row.listingId))
        .orderBy(asc(listingImages.position))
        .limit(1);
      return {
        ...row,
        styleTags: row.styleTags as string[],
        imageUrl: firstImage?.imageUrl ?? null,
      };
    }),
  );

  return withImages;
}

export interface ShopSearchRow {
  shopId: string;
  displayName: string;
  bio: string | null;
  avatarImageUrl: string | null;
  rank: number;
}

/**
 * Postgres full-text search (Functional Design Question 2: B), computed at
 * query time since the searched fields span two tables (bio on ShopProfile,
 * displayName on User) — a stored generated tsvector column can't span
 * tables, so this uses `sql` directly rather than Drizzle's query builder.
 */
export async function searchShopsQuery(query: string): Promise<ShopSearchRow[]> {
  const rows = await db.execute<{
    shop_id: string;
    display_name: string;
    bio: string | null;
    avatar_image_url: string | null;
    rank: number;
  }>(sql`
    SELECT
      ${shopProfiles.id} AS shop_id,
      coalesce(${shopProfiles.shopName}, ${users.displayName}) AS display_name,
      ${shopProfiles.bio} AS bio,
      ${shopProfiles.avatarImageUrl} AS avatar_image_url,
      ts_rank(
        to_tsvector('english', coalesce(${shopProfiles.bio}, '') || ' ' || coalesce(${shopProfiles.shopName}, '') || ' ' || coalesce(${users.displayName}, '')),
        plainto_tsquery('english', ${query})
      ) AS rank
    FROM ${shopProfiles}
    INNER JOIN ${users} ON ${shopProfiles.userId} = ${users.id}
    WHERE to_tsvector('english', coalesce(${shopProfiles.bio}, '') || ' ' || coalesce(${shopProfiles.shopName}, '') || ' ' || coalesce(${users.displayName}, ''))
      @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
  `);

  return rows.map((r) => ({
    shopId: r.shop_id,
    displayName: r.display_name,
    bio: r.bio,
    avatarImageUrl: r.avatar_image_url,
    rank: r.rank,
  }));
}

export async function findShopProfileWithOwnerName(shopId: string) {
  const [row] = await db
    .select({
      id: shopProfiles.id,
      displayName: sql<string>`coalesce(${shopProfiles.shopName}, ${users.displayName})`,
      bio: shopProfiles.bio,
      bannerImageUrl: shopProfiles.bannerImageUrl,
      avatarImageUrl: shopProfiles.avatarImageUrl,
      socialLinks: shopProfiles.socialLinks,
    })
    .from(shopProfiles)
    .innerJoin(users, eq(shopProfiles.userId, users.id))
    .where(eq(shopProfiles.id, shopId))
    .limit(1);
  return row;
}
