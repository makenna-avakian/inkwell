import { z } from "zod";
import { getPublishedRuleSet } from "@/server/shops/service";
import { createPresignedUpload, validateImageUpload } from "@/server/shops/storage";
import { setSlotStateRow } from "@/server/shops/repository";
import {
  countActiveRequestsForShop,
  createMessageRow,
  createRequestRow,
  findRequestWithParticipants,
  findRequestsInvolvingUser,
  getLatestMessageTimestamp,
  getReadReceipt,
  joinWaitlistRow,
  listMessagesForRequest,
  listRequestsForBuyer,
  listRequestsForShop,
  setRequestStatusRow,
  upsertReadReceipt,
} from "@/server/requests/repository";
import { isUnread, isValidTierAndAddOnSelection, latestOf, shouldAutoClose } from "@/server/requests/logic";
import type { CommissionRequest } from "@/server/db/schema";

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

export class NotRequestParticipantError extends Error {
  constructor() {
    super("You do not have permission to view or act on this request.");
    this.name = "NotRequestParticipantError";
  }
}

export class NotShopOwnerForRequestError extends Error {
  constructor() {
    super("Only the shop owner can do this.");
    this.name = "NotShopOwnerForRequestError";
  }
}

async function assertParticipant(requestId: string, callerId: string) {
  const row = await findRequestWithParticipants(requestId);
  if (!row) throw new RequestValidationError("Request not found.");
  if (row.request.buyerId !== callerId && row.shopOwnerId !== callerId) {
    throw new NotRequestParticipantError();
  }
  return row;
}

async function assertShopOwner(requestId: string, callerId: string) {
  const row = await findRequestWithParticipants(requestId);
  if (!row) throw new RequestValidationError("Request not found.");
  if (row.shopOwnerId !== callerId) throw new NotShopOwnerForRequestError();
  return row;
}

export const submitRequestSchema = z.object({
  tierId: z.string().min(1),
  addOnIds: z.array(z.string()).default([]),
  description: z.string().min(1),
  referenceImageUrls: z.array(z.string()).default([]),
  budgetCents: z.number().int().positive().optional(),
  deadlinePreference: z.string().optional(),
});

/** BR-1: validates against the shop's currently published rule set. */
export async function submitRequest(
  buyerId: string,
  shopId: string,
  input: z.input<typeof submitRequestSchema>,
): Promise<CommissionRequest> {
  const parsed = submitRequestSchema.parse(input);

  const published = await getPublishedRuleSet(shopId);
  if (!published) {
    throw new RequestValidationError("This shop hasn't published commission rules yet.");
  }
  if (published.slotState === "closed") {
    throw new RequestValidationError("This shop isn't accepting commissions right now.");
  }
  if (published.slotState === "waitlist") {
    throw new RequestValidationError("This shop has a waitlist — join it instead of submitting a request.");
  }

  const tiers = published.version.tiers as { id: string }[];
  const addOns = published.version.addOns as { id: string }[];
  if (!isValidTierAndAddOnSelection(tiers, addOns, parsed.tierId, parsed.addOnIds)) {
    throw new RequestValidationError("Selected tier or add-ons are not offered by this shop.");
  }

  const request = await createRequestRow({
    shopId,
    buyerId,
    ruleVersionId: published.version.id,
    tierId: parsed.tierId,
    addOnIds: parsed.addOnIds,
    description: parsed.description,
    referenceImageUrls: parsed.referenceImageUrls,
    budgetCents: parsed.budgetCents ?? null,
    deadlinePreference: parsed.deadlinePreference ?? null,
  });

  await enforceQueueLimit(shopId);

  return request;
}

/** SlotManagementService — BR-6: one-directional, never reopens. */
export async function enforceQueueLimit(shopId: string): Promise<void> {
  const published = await getPublishedRuleSet(shopId);
  if (!published) return;

  const activeCount = await countActiveRequestsForShop(shopId);
  if (shouldAutoClose(activeCount, published.maxQueue)) {
    // Calls Unit 2's repository directly (not its auth-gated service wrapper)
    // because this is a system-triggered action with no user session to
    // check ownership against — SlotManagementService acts on the shop's
    // behalf, not on behalf of a signed-in caller. Idempotent even if
    // already closed (Unit 2's BR-6: no restriction on transitions).
    await setSlotStateRow(shopId, "closed");
  }
}

export async function requestReferenceImageUpload(
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  validateImageUpload(contentType, sizeBytes); // reused from Unit 2
  const extension = fileName.split(".").pop() ?? "bin";
  const objectKeyPath = `shops/requests/${crypto.randomUUID()}.${extension}`;
  return createPresignedUpload(objectKeyPath, contentType); // reused from Unit 2
}

export async function joinWaitlist(buyerId: string, shopId: string): Promise<void> {
  const published = await getPublishedRuleSet(shopId);
  if (!published || published.slotState !== "waitlist") {
    throw new RequestValidationError("This shop isn't accepting waitlist signups right now.");
  }
  await joinWaitlistRow(shopId, buyerId); // BR-3: idempotent
}

export async function acceptRequest(requestId: string, callerId: string): Promise<CommissionRequest> {
  const row = await assertShopOwner(requestId, callerId);
  if (row.request.status !== "requested") {
    throw new RequestValidationError("This request has already been responded to.");
  }
  // Forward dependency (business-logic-model.md): Unit 6 will hook into this
  // transition to create an Order and authorize escrow, once it exists.
  return setRequestStatusRow(requestId, "accepted");
}

export async function declineRequest(
  requestId: string,
  callerId: string,
  reason: string,
): Promise<CommissionRequest> {
  const row = await assertShopOwner(requestId, callerId);
  if (row.request.status !== "requested") {
    throw new RequestValidationError("This request has already been responded to.");
  }
  if (!reason.trim()) {
    throw new RequestValidationError("A reason is required to decline a request."); // BR-4
  }
  return setRequestStatusRow(requestId, "declined", reason.trim());
}

export async function postMessage(requestId: string, senderId: string, body: string) {
  await assertParticipant(requestId, senderId);
  if (!body.trim()) {
    throw new RequestValidationError("Message cannot be empty.");
  }
  return createMessageRow(requestId, senderId, body.trim(), []);
}

export async function getRequestWithMessages(requestId: string, callerId: string) {
  const { request } = await assertParticipant(requestId, callerId);
  const requestMessages = await listMessagesForRequest(requestId);
  return { request, messages: requestMessages };
}

export async function markRequestSeen(requestId: string, userId: string): Promise<void> {
  await assertParticipant(requestId, userId);
  await upsertReadReceipt(requestId, userId);
}

export async function getRequestsForShop(shopId: string) {
  return listRequestsForShop(shopId);
}

export async function getRequestsForBuyer(buyerId: string) {
  return listRequestsForBuyer(buyerId);
}

export interface UnreadSummaryEntry {
  requestId: string;
  unread: boolean;
}

/** BR-7: computed, not stored. */
export async function getUnreadSummary(userId: string): Promise<UnreadSummaryEntry[]> {
  const rows = await findRequestsInvolvingUser(userId);
  return Promise.all(
    rows.map(async ({ request }) => {
      const [latestMessageAt, receipt] = await Promise.all([
        getLatestMessageTimestamp(request.id),
        getReadReceipt(request.id, userId),
      ]);
      const latestActivity = latestOf(latestMessageAt, request.respondedAt ?? undefined);
      return { requestId: request.id, unread: isUnread(receipt?.lastReadAt, latestActivity) };
    }),
  );
}
