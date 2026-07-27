import Stripe from "stripe";

/**
 * Lazily initialized so merely importing this module never throws without
 * STRIPE_SECRET_KEY set — same pattern as db/client.ts's fix (Unit 2) and
 * for the same reason: unit tests import business logic without real
 * credentials, and mocks intercept these calls before they'd ever run.
 */
let cachedClient: Stripe | undefined;
function stripeClient(): Stripe {
  if (!cachedClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder";
    cachedClient = new Stripe(secretKey, {
      // NFR Design Question 1: A — SDK-native retries, not the hand-rolled
      // wrapper used elsewhere in the codebase (idempotency-key-aware).
      maxNetworkRetries: 1,
    });
  }
  return cachedClient;
}

const PLATFORM_COMMISSION_RATE_PERCENT = 10; // requirements.md placeholder, configurable

export interface FeeBreakdown {
  platformFeeCents: number;
  sellerNetCents: number;
}

/** Pure function — property-tested (PBT-01, business-rules.md). */
export function computeFees(
  subtotalCents: number,
  commissionRatePercent: number = PLATFORM_COMMISSION_RATE_PERCENT,
): FeeBreakdown {
  const platformFeeCents = Math.round((subtotalCents * commissionRatePercent) / 100);
  return { platformFeeCents, sellerNetCents: subtotalCents - platformFeeCents };
}

export async function onboardSeller(shopId: string, existingAccountId: string | null) {
  const client = stripeClient();
  const accountId =
    existingAccountId ??
    (
      await client.accounts.create(
        { type: "express" },
        { idempotencyKey: `${shopId}-onboard-account` },
      )
    ).id;

  const link = await client.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.APP_BASE_URL}/shop`,
    return_url: `${process.env.APP_BASE_URL}/shop`,
    type: "account_onboarding",
  });

  return { accountId, onboardingUrl: link.url };
}

/** BR-2 (NFR Requirements Question 2: A): live check, not cached. */
export async function hasPayoutsEnabled(stripeConnectAccountId: string | null): Promise<boolean> {
  if (!stripeConnectAccountId) return false;
  const account = await stripeClient().accounts.retrieve(stripeConnectAccountId);
  return account.payouts_enabled === true;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

/**
 * Stripe Checkout (hosted page), not a custom Elements form — see
 * business-logic-model.md's rationale. `captureMethod: 'manual'` is the
 * escrow path (authorizeEscrow); `'automatic'` is buy-now (captureDirect).
 */
export async function createCheckoutSession(
  orderId: string,
  connectedAccountId: string,
  amountCents: number,
  platformFeeCents: number,
  captureMethod: "manual" | "automatic",
): Promise<CheckoutSessionResult> {
  const client = stripeClient();
  const session = await client.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // NFR Requirements Question 1: A — USD only for Phase 1
            product_data: { name: "Inkwell order" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: captureMethod,
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: connectedAccountId },
        // Destination-charge pattern: Stripe handles the platform-fee/seller
        // split and the transfer to the connected account automatically as
        // part of this single PaymentIntent — no separate Transfer.create
        // call is needed (unlike a plain "create a transfer afterward" flow).
        metadata: { orderId },
      },
      success_url: `${process.env.APP_BASE_URL}/checkout/success?order=${orderId}`,
      cancel_url: `${process.env.APP_BASE_URL}/checkout/cancelled?order=${orderId}`,
      metadata: { orderId },
    },
    { idempotencyKey: `${orderId}-checkout` },
  );

  return { sessionId: session.id, checkoutUrl: session.url! };
}

/** Captures a previously-authorized (manual-capture) PaymentIntent — commission path, on approveDelivery. */
export async function captureAndRelease(stripePaymentIntentId: string, orderId: string) {
  await stripeClient().paymentIntents.capture(stripePaymentIntentId, undefined, {
    idempotencyKey: `${orderId}-capture`,
  });
}

/** Voids an authorization without ever capturing — cancellation, not a refund (BR-4, Question 2: B). */
export async function cancelOrderAuthorization(stripePaymentIntentId: string, orderId: string) {
  await stripeClient().paymentIntents.cancel(stripePaymentIntentId, {
    idempotencyKey: `${orderId}-cancel`,
  });
}

/** Best-effort — a failure here must never block order completion (the
 *  transfer itself already happened automatically via the destination-charge
 *  pattern; this only records the id for our own records). */
export async function retrieveTransferId(stripePaymentIntentId: string): Promise<string | null> {
  try {
    const pi = await stripeClient().paymentIntents.retrieve(stripePaymentIntentId, {
      expand: ["latest_charge.transfer"],
    });
    const charge = pi.latest_charge as Stripe.Charge | null;
    const transfer = charge?.transfer;
    return typeof transfer === "string" ? transfer : (transfer?.id ?? null);
  } catch {
    return null;
  }
}

export function constructWebhookEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
  return stripeClient().webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? "",
  );
}
