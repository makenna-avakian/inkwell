import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { isUnread, isValidTierAndAddOnSelection, shouldAutoClose } from "@/server/requests/logic";

describe("isValidTierAndAddOnSelection (BR-1, PBT-01: invariant)", () => {
  it("accepts iff every referenced id exists in the rule version", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string({ minLength: 1 }) }), { minLength: 1 }),
        fc.array(fc.record({ id: fc.string({ minLength: 1 }) })),
        fc.string({ minLength: 1 }),
        fc.array(fc.string({ minLength: 1 })),
        (tiers, addOns, tierId, addOnIds) => {
          const expected =
            tiers.some((t) => t.id === tierId) &&
            addOnIds.every((id) => addOns.some((a) => a.id === id));
          expect(isValidTierAndAddOnSelection(tiers, addOns, tierId, addOnIds)).toBe(expected);
        },
      ),
    );
  });

  it("rejects a tier that doesn't exist", () => {
    expect(isValidTierAndAddOnSelection([{ id: "t1" }], [], "nonexistent", [])).toBe(false);
  });
});

describe("shouldAutoClose (BR-6, PBT-01: invariant)", () => {
  it("closes iff activeCount >= maxQueue, and never closes when maxQueue is null", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
        (activeCount, maxQueue) => {
          const expected = maxQueue !== null && activeCount >= maxQueue;
          expect(shouldAutoClose(activeCount, maxQueue)).toBe(expected);
        },
      ),
    );
  });
});

describe("isUnread (BR-7, PBT-01: invariant)", () => {
  it("is true iff lastReadAt is missing or strictly before latestActivity", () => {
    fc.assert(
      fc.property(
        fc.option(fc.date(), { nil: undefined }),
        fc.option(fc.date(), { nil: undefined }),
        (lastReadAt, latestActivity) => {
          const expected =
            latestActivity !== undefined &&
            (lastReadAt === undefined || lastReadAt.getTime() < latestActivity.getTime());
          expect(isUnread(lastReadAt, latestActivity)).toBe(expected);
        },
      ),
    );
  });

  it("is false when nothing has happened yet", () => {
    expect(isUnread(undefined, undefined)).toBe(false);
  });
});
