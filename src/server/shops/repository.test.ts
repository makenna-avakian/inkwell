import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Integration tests against a real Postgres instance — same pattern as
 * src/server/auth/repository.test.ts. Skipped unless DATABASE_URL is set.
 */
describe.skipIf(!process.env.DATABASE_URL)("shops repository (integration)", () => {
  let db: typeof import("@/server/db/client").db;
  let schema: typeof import("@/server/db/schema");
  let authRepo: typeof import("@/server/auth/repository");
  let repo: typeof import("./repository");

  beforeEach(async () => {
    ({ db } = await import("@/server/db/client"));
    schema = await import("@/server/db/schema");
    authRepo = await import("@/server/auth/repository");
    repo = await import("./repository");
  });

  afterEach(async () => {
    // shopCommissionSettings.currentVersionId FKs to commissionRuleVersions —
    // must be cleared first or the FK constraint blocks the version delete.
    await db.delete(schema.shopCommissionSettings);
    await db.delete(schema.commissionRuleVersions);
    await db.delete(schema.portfolioImages);
    await db.delete(schema.listings);
    await db.delete(schema.shopProfiles);
    await db.delete(schema.users);
  });

  async function createTestUser(email: string) {
    return authRepo.createUser({ email, displayName: email, passwordHash: null });
  }

  it("creates a shop with an accompanying settings row defaulting to closed", async () => {
    const user = await createTestUser("shop-owner@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });

    const settings = await repo.getShopCommissionSettings(shop.id);
    expect(settings?.slotState).toBe("closed");
    expect(settings?.currentVersionId).toBeNull();
  });

  it("updateShopProfile round-trips shopName, banner/avatar URLs, and social links", async () => {
    const user = await createTestUser("branding@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });

    const socialLinks = [{ label: "Instagram", url: "https://instagram.com/jane" }];
    const updated = await repo.updateShopProfile(shop.id, {
      shopName: "Jane's Studio",
      bannerImageUrl: "https://media/banner.png",
      avatarImageUrl: "https://media/avatar.png",
      socialLinks,
    });

    expect(updated?.shopName).toBe("Jane's Studio");
    expect(updated?.bannerImageUrl).toBe("https://media/banner.png");
    expect(updated?.avatarImageUrl).toBe("https://media/avatar.png");
    expect(updated?.socialLinks).toEqual(socialLinks);
  });

  it("assigns increasing positions to portfolio images", async () => {
    const user = await createTestUser("portfolio@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });

    const first = await repo.addPortfolioImageRow(shop.id, "https://x/1.png");
    const second = await repo.addPortfolioImageRow(shop.id, "https://x/2.png");

    expect(second.position).toBeGreaterThan(first.position);
  });

  it("stores rule versions append-only and updates the current pointer", async () => {
    const user = await createTestUser("rules@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });

    const v1 = await repo.insertRuleVersion({
      shopId: shop.id,
      version: 1,
      tiers: [{ id: "t1", name: "Sketch", description: "", priceCents: 1000 }],
      addOns: [],
      rulesContent: [],
    });
    await repo.setCurrentVersion(shop.id, v1.id);

    const v2 = await repo.insertRuleVersion({
      shopId: shop.id,
      version: 2,
      tiers: [{ id: "t1", name: "Sketch", description: "", priceCents: 1500 }],
      addOns: [],
      rulesContent: [],
    });
    await repo.setCurrentVersion(shop.id, v2.id);

    const settings = await repo.getShopCommissionSettings(shop.id);
    expect(settings?.currentVersionId).toBe(v2.id);

    // v1 is still readable, unmutated (BR-4).
    const stillThere = await repo.getRuleVersionByNumber(shop.id, 1);
    expect(stillThere?.id).toBe(v1.id);

    expect((await repo.getRuleVersionById(v2.id))?.version).toBe(2);
    expect(await repo.getExistingVersionNumbers(shop.id)).toEqual(
      expect.arrayContaining([1, 2]),
    );
  });

  it("finds a shop by userId and by id", async () => {
    const user = await createTestUser("find-shop@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });

    expect((await repo.findShopByUserId(user.id))?.id).toBe(shop.id);
    expect((await repo.findShopById(shop.id))?.userId).toBe(user.id);
  });

  it("lists portfolio images in position order", async () => {
    const user = await createTestUser("portfolio-list@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });
    const first = await repo.addPortfolioImageRow(shop.id, "https://x/1.png");
    const second = await repo.addPortfolioImageRow(shop.id, "https://x/2.png");

    const images = await repo.listPortfolioImages(shop.id);
    expect(images.map((i) => i.id)).toEqual([first.id, second.id]);
  });

  it("sets the slot state and max queue on commission settings", async () => {
    const user = await createTestUser("settings@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });

    const withSlot = await repo.setSlotStateRow(shop.id, "waitlist");
    expect(withSlot.slotState).toBe("waitlist");

    const withQueue = await repo.setMaxQueueRow(shop.id, 5);
    expect(withQueue.maxQueue).toBe(5);
  });

  it("stores title/caption/tags/listingId metadata on a portfolio image", async () => {
    const user = await createTestUser("portfolio-meta@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });
    const [listing] = await db
      .insert(schema.listings)
      .values({ shopId: shop.id, title: "Piece", priceCents: 2000 })
      .returning();

    const image = await repo.addPortfolioImageRow(shop.id, "https://x/1.png", {
      title: "Autumn Study",
      caption: "Gouache on paper",
      tags: ["watercolor", "landscape"],
      listingId: listing.id,
    });

    expect(image.title).toBe("Autumn Study");
    expect(image.caption).toBe("Gouache on paper");
    expect(image.tags).toEqual(["watercolor", "landscape"]);
    expect(image.listingId).toBe(listing.id);
    expect(image.featured).toBe(false);
  });

  it("finds a portfolio image by id", async () => {
    const user = await createTestUser("portfolio-find@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });
    const image = await repo.addPortfolioImageRow(shop.id, "https://x/1.png");

    expect((await repo.findPortfolioImageById(image.id))?.id).toBe(image.id);
    expect(await repo.findPortfolioImageById("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });

  it("updates a portfolio image's metadata, scoped to its shop", async () => {
    const user = await createTestUser("portfolio-update@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });
    const otherUser = await createTestUser("portfolio-update-other@example.com");
    const otherShop = await repo.createShopProfile({ userId: otherUser.id, socialLinks: [] });
    const image = await repo.addPortfolioImageRow(shop.id, "https://x/1.png");

    const updated = await repo.updatePortfolioImageRow(image.id, shop.id, { title: "New title" });
    expect(updated?.title).toBe("New title");

    // Wrong shopId in the WHERE clause — no row matches, update is a no-op.
    const noOp = await repo.updatePortfolioImageRow(image.id, otherShop.id, { title: "Hijacked" });
    expect(noOp).toBeUndefined();
    expect((await repo.findPortfolioImageById(image.id))?.title).toBe("New title");
  });

  it("deletes a portfolio image, scoped to its shop", async () => {
    const user = await createTestUser("portfolio-delete@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });
    const otherUser = await createTestUser("portfolio-delete-other@example.com");
    const otherShop = await repo.createShopProfile({ userId: otherUser.id, socialLinks: [] });
    const image = await repo.addPortfolioImageRow(shop.id, "https://x/1.png");

    // Wrong shopId — no row matches, nothing deleted.
    await repo.deletePortfolioImageRow(image.id, otherShop.id);
    expect(await repo.findPortfolioImageById(image.id)).toBeDefined();

    await repo.deletePortfolioImageRow(image.id, shop.id);
    expect(await repo.findPortfolioImageById(image.id)).toBeUndefined();
  });

  it("reorders portfolio images to match the given id order", async () => {
    const user = await createTestUser("portfolio-reorder@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });
    const first = await repo.addPortfolioImageRow(shop.id, "https://x/1.png");
    const second = await repo.addPortfolioImageRow(shop.id, "https://x/2.png");

    await repo.reorderPortfolioImagesRow(shop.id, [second.id, first.id]);

    const images = await repo.listPortfolioImages(shop.id);
    expect(images.map((i) => i.id)).toEqual([second.id, first.id]);
  });

  it("features at most one portfolio image per shop at a time", async () => {
    const user = await createTestUser("portfolio-feature@example.com");
    const shop = await repo.createShopProfile({ userId: user.id, socialLinks: [] });
    const first = await repo.addPortfolioImageRow(shop.id, "https://x/1.png");
    const second = await repo.addPortfolioImageRow(shop.id, "https://x/2.png");

    await repo.setFeaturedPortfolioImageRow(shop.id, first.id);
    expect((await repo.findPortfolioImageById(first.id))?.featured).toBe(true);

    await repo.setFeaturedPortfolioImageRow(shop.id, second.id);
    expect((await repo.findPortfolioImageById(first.id))?.featured).toBe(false);
    expect((await repo.findPortfolioImageById(second.id))?.featured).toBe(true);
  });
});
