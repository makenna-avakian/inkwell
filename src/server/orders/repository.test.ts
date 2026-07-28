import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("orders repository (integration)", () => {
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
    // shopCommissionSettings.currentVersionId FKs to commissionRuleVersions —
    // must be cleared first or the FK constraint blocks the version delete.
    await db.delete(schema.processedWebhookEvents);
    await db.delete(schema.orders);
    await db.delete(schema.commissionRequests);
    await db.delete(schema.shopCommissionSettings);
    await db.delete(schema.commissionRuleVersions);
    await db.delete(schema.shopProfiles);
    await db.delete(schema.users);
  });

  async function createTestShopAndBuyer(sellerEmail: string, buyerEmail: string) {
    const seller = await authRepo.createUser({
      email: sellerEmail,
      displayName: sellerEmail,
      passwordHash: null,
    });
    const buyer = await authRepo.createUser({
      email: buyerEmail,
      displayName: buyerEmail,
      passwordHash: null,
    });
    const shop = await shopsRepo.createShopProfile({ userId: seller.id, socialLinks: [] });
    return { seller, buyer, shop };
  }

  it("createOrderRow persists and findOrderById reads it back", async () => {
    const { seller, buyer } = await createTestShopAndBuyer(
      "order-seller@example.com",
      "order-buyer@example.com",
    );

    const created = await repo.createOrderRow({
      buyerId: buyer.id,
      sellerId: seller.id,
      subtotalCents: 10000,
      platformFeeCents: 1000,
      sellerNetCents: 9000,
      status: "accepted",
    });

    const found = await repo.findOrderById(created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.status).toBe("accepted");
  });

  it("updateOrderRow updates status and bumps updatedAt", async () => {
    const { seller, buyer } = await createTestShopAndBuyer(
      "order-seller-2@example.com",
      "order-buyer-2@example.com",
    );
    const created = await repo.createOrderRow({
      buyerId: buyer.id,
      sellerId: seller.id,
      subtotalCents: 5000,
      platformFeeCents: 500,
      sellerNetCents: 4500,
      status: "accepted",
    });

    const updated = await repo.updateOrderRow(created.id, { status: "in_progress" });
    expect(updated.status).toBe("in_progress");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it("markEventProcessed is idempotent (BR-7 — unique constraint, not just app logic)", async () => {
    await repo.markEventProcessed("evt_dup");
    await repo.markEventProcessed("evt_dup");

    const rows = await db.select().from(schema.processedWebhookEvents);
    expect(rows).toHaveLength(1);
    expect(await repo.isEventProcessed("evt_dup")).toBe(true);
    expect(await repo.isEventProcessed("evt_never_seen")).toBe(false);
  });

  it("getShopStripeAccountId / setShopStripeAccountId round-trip on shop_profiles", async () => {
    const { shop } = await createTestShopAndBuyer(
      "order-seller-3@example.com",
      "order-buyer-3@example.com",
    );
    expect(await repo.getShopStripeAccountId(shop.id)).toBeNull();

    await repo.setShopStripeAccountId(shop.id, "acct_test123");
    expect(await repo.getShopStripeAccountId(shop.id)).toBe("acct_test123");
  });
});
