import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { hasExactlyOneSource, isCancellable, isValidTransition, type OrderStatus } from "@/server/orders/transitions";

const STATUSES: OrderStatus[] = ["accepted", "in_progress", "delivered", "completed", "cancelled"];

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  accepted: ["in_progress", "completed", "cancelled"],
  in_progress: ["delivered", "cancelled"],
  delivered: ["in_progress", "completed"],
  completed: [],
  cancelled: [],
};

describe("isValidTransition (PBT-01: exhaustive invariant)", () => {
  it("matches the documented allowed-edges table exhaustively", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        expect(isValidTransition(from, to)).toBe(ALLOWED[from].includes(to));
      }
    }
  });

  it("completed and cancelled are terminal — no transitions out", () => {
    for (const to of STATUSES) {
      expect(isValidTransition("completed", to)).toBe(false);
      expect(isValidTransition("cancelled", to)).toBe(false);
    }
  });
});

describe("hasExactlyOneSource (BR-1, PBT-01: invariant)", () => {
  it("accepts iff exactly one of requestId/listingId is present, for any generated inputs", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1 }), { nil: null }),
        fc.option(fc.string({ minLength: 1 }), { nil: null }),
        (requestId, listingId) => {
          const expected = Boolean(requestId) !== Boolean(listingId);
          expect(hasExactlyOneSource(requestId, listingId)).toBe(expected);
        },
      ),
    );
  });

  it("rejects both set and neither set", () => {
    expect(hasExactlyOneSource("r1", "l1")).toBe(false);
    expect(hasExactlyOneSource(null, null)).toBe(false);
    expect(hasExactlyOneSource("r1", null)).toBe(true);
    expect(hasExactlyOneSource(null, "l1")).toBe(true);
  });
});

describe("isCancellable (BR-4)", () => {
  it("is true only for accepted/in_progress", () => {
    expect(isCancellable("accepted")).toBe(true);
    expect(isCancellable("in_progress")).toBe(true);
    expect(isCancellable("delivered")).toBe(false);
    expect(isCancellable("completed")).toBe(false);
    expect(isCancellable("cancelled")).toBe(false);
  });
});
