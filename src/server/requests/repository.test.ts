import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("requests repository (integration)", () => {
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
    await db.delete(schema.requestReadReceipts);
    await db.delete(schema.messages);
    await db.delete(schema.waitlistEntries);
    await db.delete(schema.commissionRequests);
    await db.delete(schema.shopCommissionSettings);
    await db.delete(schema.commissionRuleVersions);
    await db.delete(schema.shopProfiles);
    await db.delete(schema.users);
  });

  async function createTestShopWithRules(sellerEmail: string) {
    const seller = await authRepo.createUser({
      email: sellerEmail,
      displayName: sellerEmail,
      passwordHash: null,
    });
    const shop = await shopsRepo.createShopProfile({ userId: seller.id, socialLinks: [] });
    const version = await shopsRepo.insertRuleVersion({
      shopId: shop.id,
      version: 1,
      tiers: [{ id: "t1", name: "Sketch", description: "", priceCents: 1000 }],
      addOns: [],
      rulesContent: [],
    });
    await shopsRepo.setCurrentVersion(shop.id, version.id);
    await shopsRepo.setSlotStateRow(shop.id, "open");
    return { seller, shop, version };
  }

  it("joining a waitlist twice results in exactly one row (BR-3)", async () => {
    const { shop } = await createTestShopWithRules("waitlist-owner@example.com");
    const buyer = await authRepo.createUser({
      email: "waitlist-buyer@example.com",
      displayName: "buyer",
      passwordHash: null,
    });

    await repo.joinWaitlistRow(shop.id, buyer.id);
    await repo.joinWaitlistRow(shop.id, buyer.id);

    // The table is cleared in afterEach for every test, so counting all rows
    // here is equivalent to counting rows for this (shop, buyer) pair.
    const rows = await db.select().from(schema.waitlistEntries);
    expect(rows).toHaveLength(1);
  });

  it("counts only requested-status requests as active", async () => {
    const { shop, version } = await createTestShopWithRules("count-owner@example.com");
    const buyer = await authRepo.createUser({
      email: "count-buyer@example.com",
      displayName: "buyer",
      passwordHash: null,
    });

    const req1 = await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "Piece 1",
    });
    await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "Piece 2",
    });
    await repo.setRequestStatusRow(req1.id, "accepted");

    expect(await repo.countActiveRequestsForShop(shop.id)).toBe(1);
  });

  it("finds a request by id and with its shop-owner participant joined", async () => {
    const { seller, shop, version } = await createTestShopWithRules("find-owner@example.com");
    const buyer = await authRepo.createUser({
      email: "find-buyer@example.com",
      displayName: "buyer",
      passwordHash: null,
    });
    const request = await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "Piece",
    });

    expect((await repo.findRequestById(request.id))?.id).toBe(request.id);

    const withParticipants = await repo.findRequestWithParticipants(request.id);
    expect(withParticipants?.shopOwnerId).toBe(seller.id);
  });

  it("lists requests for a shop and for a buyer, oldest first", async () => {
    const { shop, version } = await createTestShopWithRules("list-owner@example.com");
    const buyer = await authRepo.createUser({
      email: "list-buyer@example.com",
      displayName: "buyer",
      passwordHash: null,
    });
    await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "First",
    });
    await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "Second",
    });

    const forShop = await repo.listRequestsForShop(shop.id);
    expect(forShop.map((r) => r.description)).toEqual(["First", "Second"]);

    const forBuyer = await repo.listRequestsForBuyer(buyer.id);
    expect(forBuyer).toHaveLength(2);
  });

  it("creates messages, lists them in order, and tracks the latest timestamp", async () => {
    const { shop, version } = await createTestShopWithRules("message-owner@example.com");
    const buyer = await authRepo.createUser({
      email: "message-buyer@example.com",
      displayName: "buyer",
      passwordHash: null,
    });
    const request = await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "Piece",
    });

    await repo.createMessageRow(request.id, buyer.id, "Hi there", []);
    const second = await repo.createMessageRow(request.id, buyer.id, "Following up", []);

    const messages = await repo.listMessagesForRequest(request.id);
    expect(messages).toHaveLength(2);
    expect(await repo.getLatestMessageTimestamp(request.id)).toEqual(second.createdAt);
  });

  it("upserts a read receipt and reads it back", async () => {
    const { shop, version } = await createTestShopWithRules("receipt-owner@example.com");
    const buyer = await authRepo.createUser({
      email: "receipt-buyer@example.com",
      displayName: "buyer",
      passwordHash: null,
    });
    const request = await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "Piece",
    });

    await repo.upsertReadReceipt(request.id, buyer.id);
    const first = await repo.getReadReceipt(request.id, buyer.id);
    await repo.upsertReadReceipt(request.id, buyer.id);
    const second = await repo.getReadReceipt(request.id, buyer.id);

    expect(second?.lastReadAt.getTime()).toBeGreaterThanOrEqual(first!.lastReadAt.getTime());
  });

  it("finds requests involving a user as either buyer or shop owner", async () => {
    const { seller, shop, version } = await createTestShopWithRules("involved-owner@example.com");
    const buyer = await authRepo.createUser({
      email: "involved-buyer@example.com",
      displayName: "buyer",
      passwordHash: null,
    });
    await repo.createRequestRow({
      shopId: shop.id,
      buyerId: buyer.id,
      ruleVersionId: version.id,
      tierId: "t1",
      description: "Piece",
    });

    expect(await repo.findRequestsInvolvingUser(buyer.id)).toHaveLength(1);
    expect(await repo.findRequestsInvolvingUser(seller.id)).toHaveLength(1);
  });
});
