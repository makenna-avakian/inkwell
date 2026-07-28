import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  commissionRuleVersions,
  portfolioImages,
  shopCommissionSettings,
  shopProfiles,
  type CommissionRuleVersion,
  type NewCommissionRuleVersion,
  type NewShopProfile,
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

export async function addPortfolioImageRow(shopId: string, imageUrl: string) {
  const [{ value: maxPosition }] = await db
    .select({ value: max(portfolioImages.position) })
    .from(portfolioImages)
    .where(eq(portfolioImages.shopId, shopId));

  const [image] = await db
    .insert(portfolioImages)
    .values({ shopId, imageUrl, position: (maxPosition ?? 0) + 1 })
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
