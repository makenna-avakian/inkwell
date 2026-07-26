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
    await db.delete(schema.commissionRuleVersions);
    await db.delete(schema.shopCommissionSettings);
    await db.delete(schema.portfolioImages);
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
  });
});
