import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  commissionRuleVersions,
  portfolioImages,
  shopCommissionSettings,
  shopProfiles,
  type CommissionRuleVersion,
  type NewCommissionRuleVersion,
  type NewPortfolioImage,
  type NewShopProfile,
  type PortfolioImage,
  type ShopCommissionSettings,
  type ShopProfile,
} from "@/server/db/schema";

export async function findShopByUserId(userId: string): Promise<ShopProfile | undefined> {
  const [shop] = await db
    .select()
    .from(shopProfiles)
    .where(eq(shopProfiles.userId, userId))
    .limit(1);
  return shop;
}

export async function findShopById(shopId: string): Promise<ShopProfile | undefined> {
  const [shop] = await db
    .select()
    .from(shopProfiles)
    .where(eq(shopProfiles.id, shopId))
    .limit(1);
  return shop;
}

export async function createShopProfile(input: NewShopProfile) {
  const [shop] = await db.insert(shopProfiles).values(input).returning();
  await db.insert(shopCommissionSettings).values({ shopId: shop.id });
  return shop;
}

export async function updateShopProfile(
  shopId: string,
  patch: Partial<
    Pick<NewShopProfile, "shopName" | "bannerImageUrl" | "avatarImageUrl" | "bio" | "socialLinks">
  >,
) {
  const [shop] = await db
    .update(shopProfiles)
    .set(patch)
    .where(eq(shopProfiles.id, shopId))
    .returning();
  return shop;
}

export async function addPortfolioImageRow(
  shopId: string,
  imageUrl: string,
  metadata?: Pick<NewPortfolioImage, "title" | "caption" | "tags" | "listingId">,
) {
  const [{ value: maxPosition }] = await db
    .select({ value: max(portfolioImages.position) })
    .from(portfolioImages)
    .where(eq(portfolioImages.shopId, shopId));

  const [image] = await db
    .insert(portfolioImages)
    .values({ shopId, imageUrl, position: (maxPosition ?? 0) + 1, ...metadata })
    .returning();
  return image;
}

export async function listPortfolioImages(shopId: string) {
  return db
    .select()
    .from(portfolioImages)
    .where(eq(portfolioImages.shopId, shopId))
    .orderBy(asc(portfolioImages.position));
}

export async function findPortfolioImageById(imageId: string): Promise<PortfolioImage | undefined> {
  const [image] = await db
    .select()
    .from(portfolioImages)
    .where(eq(portfolioImages.id, imageId))
    .limit(1);
  return image;
}

export async function updatePortfolioImageRow(
  imageId: string,
  shopId: string,
  patch: Partial<Pick<NewPortfolioImage, "title" | "caption" | "tags" | "listingId">>,
): Promise<PortfolioImage | undefined> {
  const [image] = await db
    .update(portfolioImages)
    .set(patch)
    .where(and(eq(portfolioImages.id, imageId), eq(portfolioImages.shopId, shopId)))
    .returning();
  return image;
}

export async function deletePortfolioImageRow(imageId: string, shopId: string): Promise<void> {
  await db
    .delete(portfolioImages)
    .where(and(eq(portfolioImages.id, imageId), eq(portfolioImages.shopId, shopId)));
}

/** Applies a full reorder in one transaction — orderedImageIds must be exactly this shop's image ids. */
export async function reorderPortfolioImagesRow(
  shopId: string,
  orderedImageIds: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const [index, imageId] of orderedImageIds.entries()) {
      await tx
        .update(portfolioImages)
        .set({ position: index + 1 })
        .where(and(eq(portfolioImages.id, imageId), eq(portfolioImages.shopId, shopId)));
    }
  });
}

/** At most one featured piece per shop — unsets any previously-featured piece in the same transaction. */
export async function setFeaturedPortfolioImageRow(
  shopId: string,
  imageId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(portfolioImages)
      .set({ featured: false })
      .where(and(eq(portfolioImages.shopId, shopId), eq(portfolioImages.featured, true)));
    await tx
      .update(portfolioImages)
      .set({ featured: true })
      .where(and(eq(portfolioImages.id, imageId), eq(portfolioImages.shopId, shopId)));
  });
}

export async function getExistingVersionNumbers(shopId: string): Promise<number[]> {
  const rows = await db
    .select({ version: commissionRuleVersions.version })
    .from(commissionRuleVersions)
    .where(eq(commissionRuleVersions.shopId, shopId));
  return rows.map((r) => r.version);
}

export async function insertRuleVersion(input: NewCommissionRuleVersion) {
  const [version] = await db
    .insert(commissionRuleVersions)
    .values(input)
    .returning();
  return version;
}

export async function getRuleVersionById(
  versionId: string,
): Promise<CommissionRuleVersion | undefined> {
  const [version] = await db
    .select()
    .from(commissionRuleVersions)
    .where(eq(commissionRuleVersions.id, versionId))
    .limit(1);
  return version;
}

export async function getRuleVersionByNumber(
  shopId: string,
  version: number,
): Promise<CommissionRuleVersion | undefined> {
  const [row] = await db
    .select()
    .from(commissionRuleVersions)
    .where(
      and(
        eq(commissionRuleVersions.shopId, shopId),
        eq(commissionRuleVersions.version, version),
      ),
    )
    .limit(1);
  return row;
}

export async function getShopCommissionSettings(
  shopId: string,
): Promise<ShopCommissionSettings | undefined> {
  const [settings] = await db
    .select()
    .from(shopCommissionSettings)
    .where(eq(shopCommissionSettings.shopId, shopId))
    .limit(1);
  return settings;
}

export async function setCurrentVersion(shopId: string, versionId: string) {
  await db
    .update(shopCommissionSettings)
    .set({ currentVersionId: versionId, updatedAt: new Date() })
    .where(eq(shopCommissionSettings.shopId, shopId));
}

export async function setSlotStateRow(
  shopId: string,
  slotState: "open" | "closed" | "waitlist",
) {
  const [settings] = await db
    .update(shopCommissionSettings)
    .set({ slotState, updatedAt: new Date() })
    .where(eq(shopCommissionSettings.shopId, shopId))
    .returning();
  return settings;
}

export async function setMaxQueueRow(shopId: string, maxQueue: number | null) {
  const [settings] = await db
    .update(shopCommissionSettings)
    .set({ maxQueue, updatedAt: new Date() })
    .where(eq(shopCommissionSettings.shopId, shopId))
    .returning();
  return settings;
}
