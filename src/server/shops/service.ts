import { z } from "zod";
import { parseBlocks, type ContentBlock } from "@/server/shops/blocks";
import { computeNextVersion } from "@/server/shops/versioning";
import { createPresignedUpload, validateImageUpload } from "@/server/shops/storage";
import {
  addPortfolioImageRow,
  createShopProfile,
  findShopById,
  findShopByUserId,
  getExistingVersionNumbers,
  getRuleVersionById,
  getShopCommissionSettings,
  insertRuleVersion,
  listPortfolioImages,
  setCurrentVersion,
  setMaxQueueRow,
  setSlotStateRow,
  updateShopProfile,
} from "@/server/shops/repository";
import type { CommissionRuleVersion, ShopCommissionSettings } from "@/server/db/schema";

export class NotShopOwnerError extends Error {
  constructor() {
    super("You do not have permission to modify this shop.");
    this.name = "NotShopOwnerError";
  }
}

export class ShopAlreadyExistsError extends Error {
  constructor() {
    super("You already have a shop.");
    this.name = "ShopAlreadyExistsError";
  }
}

export class RuleSetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleSetValidationError";
  }
}

/** BR-8: the single sanctioned way to check seller capability anywhere in
 *  the codebase. Re-exported through src/server/auth/service.ts (Step 6). */
export async function isSeller(userId: string): Promise<boolean> {
  const shop = await findShopByUserId(userId);
  return !!shop;
}

/** BR-2: object-level authorization — throws if the caller doesn't own the shop. */
async function assertOwner(shopId: string, callerId: string) {
  const shop = await findShopById(shopId);
  if (!shop || shop.userId !== callerId) {
    throw new NotShopOwnerError();
  }
  return shop;
}

const socialLinkSchema = z.object({ label: z.string().min(1), url: z.string().url() });

export const createShopSchema = z.object({
  shopName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().max(2000).optional(),
  socialLinks: z.array(socialLinkSchema).default([]),
});

export async function createShop(userId: string, input: z.infer<typeof createShopSchema>) {
  const parsed = createShopSchema.parse(input);
  const existing = await findShopByUserId(userId);
  if (existing) throw new ShopAlreadyExistsError();

  return createShopProfile({
    userId,
    shopName: parsed.shopName ?? null,
    bio: parsed.bio ?? null,
    socialLinks: parsed.socialLinks,
  });
}

export async function updateShop(
  shopId: string,
  callerId: string,
  patch: Partial<z.infer<typeof createShopSchema>>,
) {
  await assertOwner(shopId, callerId);
  return updateShopProfile(shopId, {
    shopName: patch.shopName,
    bio: patch.bio,
    socialLinks: patch.socialLinks,
  });
}

/** BR-7: validated before a presigned URL is ever issued. */
export async function requestPortfolioUploadUrl(
  shopId: string,
  callerId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  await assertOwner(shopId, callerId);
  validateImageUpload(contentType, sizeBytes);

  const extension = fileName.split(".").pop() ?? "bin";
  const objectKeyPath = `shops/${shopId}/${crypto.randomUUID()}.${extension}`;
  return createPresignedUpload(objectKeyPath, contentType);
}

export async function confirmPortfolioImage(
  shopId: string,
  callerId: string,
  imageUrl: string,
) {
  await assertOwner(shopId, callerId);
  return addPortfolioImageRow(shopId, imageUrl);
}

export async function getShopPortfolio(shopId: string) {
  return listPortfolioImages(shopId);
}

/** Shared by banner/avatar upload — same presign/validate flow as portfolio images, one object per shop rather than an appendable list. */
async function requestShopImageUploadUrl(
  shopId: string,
  callerId: string,
  kind: "banner" | "avatar",
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  await assertOwner(shopId, callerId);
  validateImageUpload(contentType, sizeBytes);

  const extension = fileName.split(".").pop() ?? "bin";
  const objectKeyPath = `shops/${shopId}/${kind}/${crypto.randomUUID()}.${extension}`;
  return createPresignedUpload(objectKeyPath, contentType);
}

export async function requestBannerUploadUrl(
  shopId: string,
  callerId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  return requestShopImageUploadUrl(shopId, callerId, "banner", fileName, contentType, sizeBytes);
}

export async function confirmBannerImage(shopId: string, callerId: string, imageUrl: string) {
  await assertOwner(shopId, callerId);
  return updateShopProfile(shopId, { bannerImageUrl: imageUrl });
}

export async function requestAvatarUploadUrl(
  shopId: string,
  callerId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  return requestShopImageUploadUrl(shopId, callerId, "avatar", fileName, contentType, sizeBytes);
}

export async function confirmAvatarImage(shopId: string, callerId: string, imageUrl: string) {
  await assertOwner(shopId, callerId);
  return updateShopProfile(shopId, { avatarImageUrl: imageUrl });
}

const tierSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().default(""),
  priceCents: z.number().int().positive(),
});
const addOnSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  priceDeltaCents: z.number().int().positive(),
});

export const publishRuleSetSchema = z.object({
  tiers: z.array(tierSchema).min(1), // BR-3: at least one tier
  addOns: z.array(addOnSchema).default([]),
  rulesContent: z.array(z.unknown()),
  maxQueue: z.number().int().positive().nullable().optional(),
});

/** BR-3, BR-4: validates then appends a new immutable version. */
export async function publishRuleSet(
  shopId: string,
  callerId: string,
  input: z.infer<typeof publishRuleSetSchema>,
): Promise<CommissionRuleVersion> {
  await assertOwner(shopId, callerId);

  let parsed: z.infer<typeof publishRuleSetSchema>;
  try {
    parsed = publishRuleSetSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new RuleSetValidationError(error.issues[0]?.message ?? "Invalid rule set.");
    }
    throw error;
  }

  let blocks: ContentBlock[];
  try {
    blocks = parseBlocks(parsed.rulesContent);
  } catch {
    throw new RuleSetValidationError("Invalid content blocks.");
  }

  const existingVersions = await getExistingVersionNumbers(shopId);
  const nextVersion = computeNextVersion(existingVersions);

  const version = await insertRuleVersion({
    shopId,
    version: nextVersion,
    tiers: parsed.tiers,
    addOns: parsed.addOns,
    rulesContent: blocks,
  });

  await setCurrentVersion(shopId, version.id);
  if (parsed.maxQueue !== undefined) {
    await setMaxQueueRow(shopId, parsed.maxQueue ?? null);
  }

  return version;
}

/** BR-6: independent of publishing — no version created, any transition allowed. */
export async function setSlotState(
  shopId: string,
  callerId: string,
  slotState: "open" | "closed" | "waitlist",
): Promise<ShopCommissionSettings> {
  await assertOwner(shopId, callerId);
  return setSlotStateRow(shopId, slotState);
}

export interface PublishedRuleSet {
  version: CommissionRuleVersion;
  slotState: ShopCommissionSettings["slotState"];
  maxQueue: ShopCommissionSettings["maxQueue"];
}

/** Read path used by Units 3/4/5 — returns null if nothing has been published yet. */
export async function getPublishedRuleSet(shopId: string): Promise<PublishedRuleSet | null> {
  const settings = await getShopCommissionSettings(shopId);
  if (!settings?.currentVersionId) return null;

  const version = await getRuleVersionById(settings.currentVersionId);
  if (!version) return null;

  return { version, slotState: settings.slotState, maxQueue: settings.maxQueue };
}
