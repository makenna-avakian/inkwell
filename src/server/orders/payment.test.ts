import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { computeFees } from "@/server/orders/payment";

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
