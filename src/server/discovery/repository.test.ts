import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("discovery repository (integration)", () => {
  let db: typeof import("@/server/db/client").db;
  let schema: typeof import("@/server/db/schema");
  let authRepo: typeof import("@/server/auth/repository");
  let shopsRepo: typeof import("@/server/shops/repository");
  let listingsRepo: typeof import("@/server/listings/repository");
  let ordersRepo: typeof import("@/server/orders/repository");
  let repo: typeof import("./repository");

  beforeEach(async () => {
    ({ db } = await import("@/server/db/client"));
    schema = await import("@/server/db/schema");
    authRepo = await import("@/server/auth/repository");
    shopsRepo = await import("@/server/shops/repository");
    listingsRepo = await import("@/server/listings/repository");
    ordersRepo = await import("@/server/orders/repository");
    repo = await import("./repository");
  });

  afterEach(async () => {
    await db.delete(schema.orders);
    await db.delete(schema.listingImages);
    await db.delete(schema.listings);
    await db.delete(schema.shopCommissionSettings);
    await db.delete(schema.shopProfiles);
    await db.delete(schema.users);
  });

  async function createTestShop(email: string, bio?: string) {
    const user = await authRepo.createUser({ email, displayName: email.split("@")[0], passwordHash: null });
    return shopsRepo.createShopProfile({ userId: user.id, bio, socialLinks: [] });
  }

  it("finds available listing candidates filtered by medium", async () => {
    const shop = await createTestShop("discovery-medium@example.com");
    await listingsRepo.createListingRow({
      shopId: shop.id,
      title: "Watercolor Piece",
      priceCents: 1000,
      medium: "Watercolor",
    });
    await listingsRepo.createListingRow({
      shopId: shop.id,
      title: "Charcoal Piece",
      priceCents: 2000,
      medium: "Charcoal",
    });

    const results = await repo.findAvailableListingCandidates("Watercolor");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Watercolor Piece");
  });

  it("excludes non-available listings from candidates", async () => {
    const shop = await createTestShop("discovery-status@example.com");
    const listing = await listingsRepo.createListingRow({
      shopId: shop.id,
      title: "Sold Piece",
      priceCents: 1000,
    });
    await listingsRepo.setListingStatusRow(listing.id, "sold");

    const results = await repo.findAvailableListingCandidates();
    expect(results.find((r) => r.listingId === listing.id)).toBeUndefined();
  });

  it("full-text search finds a shop by bio content", async () => {
    await createTestShop("discovery-search@example.com", "I specialize in pet portraits");

    const results = await repo.searchShopsQuery("pet portraits");
    expect(results.length).toBeGreaterThan(0);
  });

  it("counts only completed orders, grouped by listing", async () => {
    const shop = await createTestShop("discovery-popularity@example.com");
    const buyer = await authRepo.createUser({
      email: "discovery-popularity-buyer@example.com",
      displayName: "Buyer",
      passwordHash: null,
    });
    const popular = await listingsRepo.createListingRow({
      shopId: shop.id,
      title: "Popular Piece",
      priceCents: 1000,
    });
    const unpopular = await listingsRepo.createListingRow({
      shopId: shop.id,
      title: "Unpopular Piece",
      priceCents: 1000,
    });

    async function makeOrder(listingId: string, status: "completed" | "cancelled") {
      await ordersRepo.createOrderRow({
        buyerId: buyer.id,
        sellerId: shop.userId,
        listingId,
        subtotalCents: 1000,
        platformFeeCents: 100,
        sellerNetCents: 900,
        status,
      });
    }
    await makeOrder(popular.id, "completed");
    await makeOrder(popular.id, "completed");
    await makeOrder(popular.id, "cancelled"); // shouldn't count
    await makeOrder(unpopular.id, "cancelled");

    const counts = await repo.getCompletedOrderCountsByListingId();
    expect(counts[popular.id]).toBe(2);
    expect(counts[unpopular.id]).toBeUndefined();
  });
});
