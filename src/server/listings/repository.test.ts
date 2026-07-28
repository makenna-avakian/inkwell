import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("listings repository (integration)", () => {
  let db: typeof import("@/server/db/client").db;
  let schema: typeof import("@/server/db/schema");
  let authRepo: typeof import("@/server/auth/repository");
  let shopsRepo: typeof import("@/server/shops/repository");
  let repo: typeof import("./repository");

  beforeEach(async () => {
    ({ db } = await import("@/server/db/client"));
    schema = await import("@/server/db/schema");
    authRepo = await import("@/server/auth/repository");
    shopsRepo = await import("@/server/shops/repository");
    repo = await import("./repository");
  });

  afterEach(async () => {
    await db.delete(schema.listingImages);
    await db.delete(schema.listings);
    await db.delete(schema.shopCommissionSettings);
    await db.delete(schema.shopProfiles);
    await db.delete(schema.users);
  });

  async function createTestShop(email: string) {
    const user = await authRepo.createUser({ email, displayName: email, passwordHash: null });
    return shopsRepo.createShopProfile({ userId: user.id, socialLinks: [] });
  }

  it("creates a listing defaulting to available", async () => {
    const shop = await createTestShop("listings-owner@example.com");
    const listing = await repo.createListingRow({
      shopId: shop.id,
      title: "House by the Sea",
      priceCents: 5000,
    });
    expect(listing.status).toBe("available");
  });

  it("excludes non-available listings from listAvailableListingsForShop", async () => {
    const shop = await createTestShop("listings-filter@example.com");
    const available = await repo.createListingRow({
      shopId: shop.id,
      title: "Available piece",
      priceCents: 1000,
    });
    const sold = await repo.createListingRow({
      shopId: shop.id,
      title: "Sold piece",
      priceCents: 2000,
    });
    await repo.setListingStatusRow(sold.id, "sold");

    const results = await repo.listAvailableListingsForShop(shop.id);
    expect(results.map((l) => l.id)).toEqual([available.id]);
  });

  it("assigns increasing positions to listing images", async () => {
    const shop = await createTestShop("listings-images@example.com");
    const listing = await repo.createListingRow({
      shopId: shop.id,
      title: "Piece",
      priceCents: 1000,
    });
    const first = await repo.addListingImageRow(listing.id, "https://x/1.png");
    const second = await repo.addListingImageRow(listing.id, "https://x/2.png");
    expect(second.position).toBeGreaterThan(first.position);

    const images = await repo.listListingImages(listing.id);
    expect(images.map((i) => i.id)).toEqual([first.id, second.id]);
  });

  it("finds a listing by id and with its shop owner joined", async () => {
    const shop = await createTestShop("listings-find@example.com");
    const listing = await repo.createListingRow({
      shopId: shop.id,
      title: "Piece",
      priceCents: 1000,
    });

    expect((await repo.findListingById(listing.id))?.id).toBe(listing.id);

    const withOwner = await repo.findListingWithShopOwner(listing.id);
    expect(withOwner?.shopUserId).toBe(shop.userId);
  });

  it("updates a listing's fields", async () => {
    const shop = await createTestShop("listings-update@example.com");
    const listing = await repo.createListingRow({
      shopId: shop.id,
      title: "Original title",
      priceCents: 1000,
    });

    const updated = await repo.updateListingRow(listing.id, {
      title: "New title",
      priceCents: 2000,
    });

    expect(updated.title).toBe("New title");
    expect(updated.priceCents).toBe(2000);
  });
});
