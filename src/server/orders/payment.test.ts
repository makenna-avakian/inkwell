import { beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";

const mockStripeInstance = {
  accounts: { create: vi.fn(), retrieve: vi.fn() },
  accountLinks: { create: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  paymentIntents: { capture: vi.fn(), cancel: vi.fn(), retrieve: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
};

vi.mock("stripe", () => ({
  default: vi.fn(() => mockStripeInstance),
}));

import {
  cancelOrderAuthorization,
  captureAndRelease,
  computeFees,
  constructWebhookEvent,
  createCheckoutSession,
  hasPayoutsEnabled,
  onboardSeller,
  retrieveTransferId,
} from "@/server/orders/payment";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("computeFees (example-based)", () => {
  it("computes a 10% platform fee by default", () => {
    const { platformFeeCents, sellerNetCents } = computeFees(10_000);
    expect(platformFeeCents).toBe(1000);
    expect(sellerNetCents).toBe(9000);
  });
});

describe("computeFees (PBT-01: invariants)", () => {
  it("platformFeeCents + sellerNetCents always equals subtotalCents (no rounding leak)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        (subtotalCents, rate) => {
          const { platformFeeCents, sellerNetCents } = computeFees(subtotalCents, rate);
          expect(platformFeeCents + sellerNetCents).toBe(subtotalCents);
        },
      ),
    );
  });

  it("platformFeeCents is always non-negative and never exceeds subtotalCents", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        (subtotalCents, rate) => {
          const { platformFeeCents } = computeFees(subtotalCents, rate);
          expect(platformFeeCents).toBeGreaterThanOrEqual(0);
          expect(platformFeeCents).toBeLessThanOrEqual(subtotalCents);
        },
      ),
    );
  });
});

describe("onboardSeller", () => {
  it("creates a new Connect account when none exists yet", async () => {
    mockStripeInstance.accounts.create.mockResolvedValue({ id: "acct_new" });
    mockStripeInstance.accountLinks.create.mockResolvedValue({ url: "https://connect.stripe.com/setup" });

    const result = await onboardSeller("shop-1", null);

    expect(mockStripeInstance.accounts.create).toHaveBeenCalledWith(
      { type: "express" },
      expect.objectContaining({ idempotencyKey: "shop-1-onboard-account" }),
    );
    expect(result).toEqual({ accountId: "acct_new", onboardingUrl: "https://connect.stripe.com/setup" });
  });

  it("reuses an existing Connect account instead of creating a new one", async () => {
    mockStripeInstance.accountLinks.create.mockResolvedValue({ url: "https://connect.stripe.com/setup" });

    const result = await onboardSeller("shop-1", "acct_existing");

    expect(mockStripeInstance.accounts.create).not.toHaveBeenCalled();
    expect(result.accountId).toBe("acct_existing");
  });
});

describe("hasPayoutsEnabled (BR-2: live check, fails closed)", () => {
  it("returns false when the shop has no Stripe account at all", async () => {
    expect(await hasPayoutsEnabled(null)).toBe(false);
    expect(mockStripeInstance.accounts.retrieve).not.toHaveBeenCalled();
  });

  it("returns true only when Stripe reports payouts_enabled", async () => {
    mockStripeInstance.accounts.retrieve.mockResolvedValue({ payouts_enabled: true });
    expect(await hasPayoutsEnabled("acct_1")).toBe(true);
  });

  it("returns false when Stripe reports payouts not yet enabled", async () => {
    mockStripeInstance.accounts.retrieve.mockResolvedValue({ payouts_enabled: false });
    expect(await hasPayoutsEnabled("acct_1")).toBe(false);
  });
});

describe("createCheckoutSession (destination-charge pattern)", () => {
  it("passes the platform fee and connected account through to Stripe", async () => {
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: "cs_1",
      url: "https://checkout.stripe.com/cs_1",
    });

    const result = await createCheckoutSession("order-1", "acct_1", 10000, 1000, "manual");

    expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: expect.objectContaining({
          capture_method: "manual",
          application_fee_amount: 1000,
          transfer_data: { destination: "acct_1" },
        }),
      }),
      expect.objectContaining({ idempotencyKey: "order-1-checkout" }),
    );
    expect(result).toEqual({ sessionId: "cs_1", checkoutUrl: "https://checkout.stripe.com/cs_1" });
  });
});

describe("captureAndRelease / cancelOrderAuthorization", () => {
  it("captures a previously-authorized PaymentIntent", async () => {
    await captureAndRelease("pi_1", "order-1");
    expect(mockStripeInstance.paymentIntents.capture).toHaveBeenCalledWith(
      "pi_1",
      undefined,
      expect.objectContaining({ idempotencyKey: "order-1-capture" }),
    );
  });

  it("cancels (voids) an authorization without capturing (Question 2: B)", async () => {
    await cancelOrderAuthorization("pi_1", "order-1");
    expect(mockStripeInstance.paymentIntents.cancel).toHaveBeenCalledWith(
      "pi_1",
      expect.objectContaining({ idempotencyKey: "order-1-cancel" }),
    );
  });
});

describe("retrieveTransferId (best-effort)", () => {
  it("extracts the transfer id from the latest charge", async () => {
    mockStripeInstance.paymentIntents.retrieve.mockResolvedValue({
      latest_charge: { transfer: "tr_1" },
    });
    expect(await retrieveTransferId("pi_1")).toBe("tr_1");
  });

  it("returns null rather than throwing when Stripe errors", async () => {
    mockStripeInstance.paymentIntents.retrieve.mockRejectedValue(new Error("network error"));
    expect(await retrieveTransferId("pi_1")).toBeNull();
  });

  it("returns null when there is no charge/transfer yet", async () => {
    mockStripeInstance.paymentIntents.retrieve.mockResolvedValue({ latest_charge: null });
    expect(await retrieveTransferId("pi_1")).toBeNull();
  });
});

describe("constructWebhookEvent", () => {
  it("delegates signature verification to the Stripe SDK", () => {
    mockStripeInstance.webhooks.constructEvent.mockReturnValue({ id: "evt_1", type: "checkout.session.completed" });

    const event = constructWebhookEvent("raw-body", "sig_1");

    expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
      "raw-body",
      "sig_1",
      expect.any(String),
    );
    expect(event).toEqual({ id: "evt_1", type: "checkout.session.completed" });
  });
});
