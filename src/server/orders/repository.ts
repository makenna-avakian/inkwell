import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  orders,
  processedWebhookEvents,
  shopProfiles,
  type NewOrder,
  type Order,
} from "@/server/db/schema";

export async function createOrderRow(input: NewOrder): Promise<Order> {
  const [row] = await db.insert(orders).values(input).returning();
  return row;
}

export async function findOrderById(orderId: string): Promise<Order | undefined> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return row;
}

export async function findOrderByRequestId(requestId: string): Promise<Order | undefined> {
  const [row] = await db.select().from(orders).where(eq(orders.requestId, requestId)).limit(1);
  return row;
}

export async function updateOrderRow(
  orderId: string,
  patch: Partial<
    Pick<
      NewOrder,
      "status" | "stripePaymentIntentId" | "stripeTransferId"
    >
  >,
): Promise<Order> {
  const [row] = await db
    .update(orders)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return row;
}

export async function listOrdersForBuyer(buyerId: string): Promise<Order[]> {
  return db.select().from(orders).where(eq(orders.buyerId, buyerId));
}

export async function listOrdersForSeller(sellerId: string): Promise<Order[]> {
  return db.select().from(orders).where(eq(orders.sellerId, sellerId));
}

export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(processedWebhookEvents)
    .where(eq(processedWebhookEvents.stripeEventId, stripeEventId))
    .limit(1);
  return !!row;
}

export async function markEventProcessed(stripeEventId: string): Promise<void> {
  await db
    .insert(processedWebhookEvents)
    .values({ stripeEventId })
    .onConflictDoNothing({ target: processedWebhookEvents.stripeEventId });
}

export async function getShopStripeAccountId(shopId: string): Promise<string | null> {
  const [row] = await db
    .select({ stripeConnectAccountId: shopProfiles.stripeConnectAccountId })
    .from(shopProfiles)
    .where(eq(shopProfiles.id, shopId))
    .limit(1);
  return row?.stripeConnectAccountId ?? null;
}

export async function setShopStripeAccountId(shopId: string, accountId: string): Promise<void> {
  await db
    .update(shopProfiles)
    .set({ stripeConnectAccountId: accountId })
    .where(eq(shopProfiles.id, shopId));
}
