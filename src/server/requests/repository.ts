import { and, asc, eq, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  commissionRequests,
  messages,
  requestReadReceipts,
  shopProfiles,
  waitlistEntries,
  type CommissionRequest,
  type NewCommissionRequest,
} from "@/server/db/schema";

export async function findRequestById(
  requestId: string,
): Promise<CommissionRequest | undefined> {
  const [row] = await db
    .select()
    .from(commissionRequests)
    .where(eq(commissionRequests.id, requestId))
    .limit(1);
  return row;
}

/** Joined lookup for authorization: caller must be the buyer or the shop owner. */
export async function findRequestWithParticipants(requestId: string) {
  const [row] = await db
    .select({ request: commissionRequests, shopOwnerId: shopProfiles.userId })
    .from(commissionRequests)
    .innerJoin(shopProfiles, eq(commissionRequests.shopId, shopProfiles.id))
    .where(eq(commissionRequests.id, requestId))
    .limit(1);
  return row;
}

export async function createRequestRow(
  input: NewCommissionRequest,
): Promise<CommissionRequest> {
  const [row] = await db.insert(commissionRequests).values(input).returning();
  return row;
}

export async function countActiveRequestsForShop(shopId: string): Promise<number> {
  const rows = await db
    .select({ id: commissionRequests.id })
    .from(commissionRequests)
    .where(
      and(eq(commissionRequests.shopId, shopId), eq(commissionRequests.status, "requested")),
    );
  return rows.length;
}

export async function setRequestStatusRow(
  requestId: string,
  status: "accepted" | "declined",
  declineReason?: string,
): Promise<CommissionRequest> {
  const [row] = await db
    .update(commissionRequests)
    .set({ status, declineReason: declineReason ?? null, respondedAt: new Date() })
    .where(eq(commissionRequests.id, requestId))
    .returning();
  return row;
}

export async function listRequestsForShop(shopId: string): Promise<CommissionRequest[]> {
  return db
    .select()
    .from(commissionRequests)
    .where(eq(commissionRequests.shopId, shopId))
    .orderBy(asc(commissionRequests.createdAt));
}

export async function listRequestsForBuyer(buyerId: string): Promise<CommissionRequest[]> {
  return db
    .select()
    .from(commissionRequests)
    .where(eq(commissionRequests.buyerId, buyerId))
    .orderBy(asc(commissionRequests.createdAt));
}

/** Idempotent per BR-3 — relies on the DB unique constraint, ignores the conflict. */
export async function joinWaitlistRow(shopId: string, buyerId: string): Promise<void> {
  await db
    .insert(waitlistEntries)
    .values({ shopId, buyerId })
    .onConflictDoNothing({ target: [waitlistEntries.shopId, waitlistEntries.buyerId] });
}

export async function createMessageRow(
  requestId: string,
  senderId: string,
  body: string,
  attachmentUrls: string[],
) {
  const [row] = await db
    .insert(messages)
    .values({ requestId, senderId, body, attachmentUrls })
    .returning();
  return row;
}

export async function listMessagesForRequest(requestId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.requestId, requestId))
    .orderBy(asc(messages.createdAt));
}

export async function getLatestMessageTimestamp(requestId: string): Promise<Date | undefined> {
  const rows = await listMessagesForRequest(requestId);
  return rows.at(-1)?.createdAt;
}

export async function upsertReadReceipt(requestId: string, userId: string): Promise<void> {
  await db
    .insert(requestReadReceipts)
    .values({ requestId, userId, lastReadAt: new Date() })
    .onConflictDoUpdate({
      target: [requestReadReceipts.requestId, requestReadReceipts.userId],
      set: { lastReadAt: new Date() },
    });
}

export async function getReadReceipt(requestId: string, userId: string) {
  const [row] = await db
    .select()
    .from(requestReadReceipts)
    .where(
      and(eq(requestReadReceipts.requestId, requestId), eq(requestReadReceipts.userId, userId)),
    )
    .limit(1);
  return row;
}

/** All requests where the given user is either the buyer or the shop's owner. */
export async function findRequestsInvolvingUser(userId: string) {
  return db
    .select({ request: commissionRequests, shopOwnerId: shopProfiles.userId })
    .from(commissionRequests)
    .innerJoin(shopProfiles, eq(commissionRequests.shopId, shopProfiles.id))
    .where(or(eq(commissionRequests.buyerId, userId), eq(shopProfiles.userId, userId)));
}
