import type Stripe from "stripe";
import {
  cancelOrderAuthorization,
  captureAndRelease,
  computeFees,
  createCheckoutSession,
  hasPayoutsEnabled,
  onboardSeller,
  retrieveTransferId,
} from "@/server/orders/payment";
import {
  createOrderRow,
  findOrderById,
  getShopStripeAccountId,
  isEventProcessed,
  listOrdersForBuyer,
  listOrdersForSeller,
  markEventProcessed,
  setShopStripeAccountId,
  updateOrderRow,
} from "@/server/orders/repository";
import { hasExactlyOneSource, isCancellable, isValidTransition } from "@/server/orders/transitions";
import { acceptRequest, postMessage } from "@/server/requests/service";
import { getRuleVersionById, findShopById, findShopByUserId } from "@/server/shops/repository";
import { findListingById, findListingWithShopOwner, setListingStatusRow } from "@/server/listings/repository";
import type { NewOrder, Order } from "@/server/db/schema";

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export class NotOrderParticipantError extends Error {
  constructor() {
    super("You do not have permission to view or act on this order.");
    this.name = "NotOrderParticipantError";
  }
}

function assertParticipant(order: Order, callerId: string) {
  if (order.buyerId !== callerId && order.sellerId !== callerId) {
    throw new NotOrderParticipantError();
  }
}

/** BR-1: runtime-asserted, not just structurally guaranteed by the two call sites. */
async function createValidatedOrder(input: NewOrder): Promise<Order> {
  if (!hasExactlyOneSource(input.requestId, input.listingId)) {
    throw new OrderValidationError(
      "An order must have exactly one of requestId or listingId set.",
    );
  }
  return createOrderRow(input);
}

async function assertPayoutsReady(shopId: string) {
  const accountId = await getShopStripeAccountId(shopId);
  const eligible = await hasPayoutsEnabled(accountId); // BR-2: live check, fails closed
  if (!eligible) {
    throw new OrderValidationError(
      "This shop can't accept payments yet — Stripe onboarding isn't complete.",
    );
  }
  return accountId as string;
}

/**
 * CommissionLifecycleService — resolves Unit 5's forward dependency.
 * Supersedes calling Unit 5's acceptRequest directly.
 */
export async function acceptAndCreateOrder(
  requestId: string,
  callerId: string,
): Promise<{ order: Order; checkoutUrl: string }> {
  const request = await acceptRequest(requestId, callerId); // Unit 5, unmodified

  const ruleVersion = await getRuleVersionById(request.ruleVersionId);
  if (!ruleVersion) {
    throw new OrderValidationError("The commission rule version for this request is missing.");
  }
  const tiers = ruleVersion.tiers as { id: string; priceCents: number }[];
  const addOns = ruleVersion.addOns as { id: string; priceDeltaCents: number }[];
  const tier = tiers.find((t) => t.id === request.tierId);
  if (!tier) {
    throw new OrderValidationError("The selected tier no longer exists on this rule version.");
  }
  const addOnTotal = (request.addOnIds as string[]).reduce((sum, id) => {
    const addOn = addOns.find((a) => a.id === id);
    return sum + (addOn?.priceDeltaCents ?? 0);
  }, 0);
  const subtotalCents = tier.priceCents + addOnTotal;

  const shop = await findShopById(request.shopId);
  if (!shop) throw new OrderValidationError("Shop not found.");
  const connectedAccountId = await assertPayoutsReady(shop.id);

  const { platformFeeCents, sellerNetCents } = computeFees(subtotalCents);

  const order = await createValidatedOrder({
    requestId,
    buyerId: request.buyerId,
    sellerId: shop.userId,
    subtotalCents,
    platformFeeCents,
    sellerNetCents,
    status: "accepted",
  });

  const { checkoutUrl } = await createCheckoutSession(
    order.id,
    connectedAccountId,
    subtotalCents,
    platformFeeCents,
    "manual",
  );

  return { order, checkoutUrl };
}

/** CheckoutService — buy-now path. */
export async function checkout(
  listingId: string,
  buyerId: string,
): Promise<{ order: Order; checkoutUrl: string }> {
  const listing = await findListingById(listingId);
  if (!listing || listing.status !== "available") {
    throw new OrderValidationError("This listing is no longer available.");
  }

  const listingWithShop = await findListingWithShopOwner(listingId);
  if (!listingWithShop) throw new OrderValidationError("Listing not found.");
  const connectedAccountId = await assertPayoutsReady(listing.shopId);

  const { platformFeeCents, sellerNetCents } = computeFees(listing.priceCents);

  const order = await createValidatedOrder({
    listingId,
    buyerId,
    sellerId: listingWithShop.shopUserId,
    subtotalCents: listing.priceCents,
    platformFeeCents,
    sellerNetCents,
    status: "accepted",
  });

  const { checkoutUrl } = await createCheckoutSession(
    order.id,
    connectedAccountId,
    listing.priceCents,
    platformFeeCents,
    "automatic",
  );

  return { order, checkoutUrl };
}

/**
 * Regenerates the Checkout Session URL for the buyer to complete payment on
 * (the seller who accepted/listed isn't the payer, so the URL from
 * acceptAndCreateOrder/checkout can't just be redirected-to at accept time).
 * Reuses createCheckoutSession's idempotency key so this returns the same
 * underlying Stripe session within its validity window rather than creating a
 * duplicate one.
 */
export async function getCheckoutUrlForOrder(orderId: string, callerId: string): Promise<string> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  if (order.buyerId !== callerId) throw new NotOrderParticipantError();
  if (order.stripePaymentIntentId) {
    throw new OrderValidationError("This order has already been paid for.");
  }

  const shop = await findShopByUserId(order.sellerId);
  if (!shop) throw new OrderValidationError("Shop not found.");
  const connectedAccountId = await assertPayoutsReady(shop.id);

  const { checkoutUrl } = await createCheckoutSession(
    order.id,
    connectedAccountId,
    order.subtotalCents,
    order.platformFeeCents,
    order.listingId ? "automatic" : "manual",
  );
  return checkoutUrl;
}

export async function onboardSellerAction(shopId: string, callerId: string) {
  const shop = await findShopById(shopId);
  if (!shop || shop.userId !== callerId) {
    throw new NotOrderParticipantError();
  }
  const existing = await getShopStripeAccountId(shopId);
  const { accountId, onboardingUrl } = await onboardSeller(shopId, existing);
  if (!existing) {
    await setShopStripeAccountId(shopId, accountId);
  }
  return onboardingUrl;
}

async function transition(orderId: string, callerId: string, to: Order["status"]): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  assertParticipant(order, callerId);
  if (!isValidTransition(order.status, to)) {
    throw new OrderValidationError(`Cannot move an order from ${order.status} to ${to}.`);
  }
  return updateOrderRow(orderId, { status: to });
}

export async function markInProgress(orderId: string, callerId: string): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  if (order.sellerId !== callerId) throw new NotOrderParticipantError();
  return transition(orderId, callerId, "in_progress");
}

export async function submitForReview(orderId: string, callerId: string): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  if (order.sellerId !== callerId) throw new NotOrderParticipantError();
  return transition(orderId, callerId, "delivered");
}

export async function requestRevision(
  orderId: string,
  callerId: string,
  feedback: string,
): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  if (order.buyerId !== callerId) throw new NotOrderParticipantError();
  const updated = await transition(orderId, callerId, "in_progress");
  if (order.requestId) {
    await postMessage(order.requestId, callerId, feedback); // reuses Unit 5's embedded thread
  }
  return updated;
}

/** BR: only ever a direct server-to-server call; webhook independently reconciles. */
export async function approveDelivery(orderId: string, callerId: string): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  if (order.buyerId !== callerId) throw new NotOrderParticipantError();
  if (!isValidTransition(order.status, "completed")) {
    throw new OrderValidationError("This order isn't ready to be approved yet.");
  }
  if (!order.stripePaymentIntentId) {
    throw new OrderValidationError("No payment has been authorized for this order yet.");
  }

  await captureAndRelease(order.stripePaymentIntentId, order.id);
  const transferId = await retrieveTransferId(order.stripePaymentIntentId); // best-effort
  return updateOrderRow(orderId, {
    status: "completed",
    stripeTransferId: transferId ?? undefined,
  });
}

/** Question 2: B — cancellation, not a refund (nothing was ever captured). */
export async function cancelOrder(orderId: string, callerId: string): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  assertParticipant(order, callerId);
  if (!isCancellable(order.status)) {
    throw new OrderValidationError("This order can no longer be cancelled.");
  }
  if (order.stripePaymentIntentId) {
    await cancelOrderAuthorization(order.stripePaymentIntentId, order.id);
  }
  return updateOrderRow(orderId, { status: "cancelled" });
}

export async function getOrder(orderId: string, callerId: string): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderValidationError("Order not found.");
  assertParticipant(order, callerId);
  return order;
}

export async function getOrderHistoryForBuyer(buyerId: string): Promise<Order[]> {
  return listOrdersForBuyer(buyerId);
}

export async function getOrderHistoryForSeller(sellerId: string): Promise<Order[]> {
  return listOrdersForSeller(sellerId);
}

/** WebhookHandlerService — the sole path by which payment state is confirmed from Stripe. */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  if (await isEventProcessed(event.id)) return; // BR-7: idempotent replay

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (orderId && paymentIntentId) {
      const order = await findOrderById(orderId);
      if (order) {
        await updateOrderRow(orderId, { stripePaymentIntentId: paymentIntentId });
        if (order.listingId && isValidTransition(order.status, "completed")) {
          // Buy-now: automatic capture already happened as part of Checkout completing.
          await updateOrderRow(orderId, { status: "completed" });
          await setListingStatusRow(order.listingId, "sold"); // system action, not user-initiated — see Unit 5's enforceQueueLimit precedent
        }
      }
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      const order = await findOrderById(orderId);
      if (order && order.listingId && isValidTransition(order.status, "completed")) {
        await updateOrderRow(orderId, { status: "completed" }); // reconciliation for the buy-now path
      }
      // Commission path: approveDelivery already flips status synchronously —
      // this webhook confirming the same succeeded event is a no-op there.
    }
  }

  await markEventProcessed(event.id);
}
