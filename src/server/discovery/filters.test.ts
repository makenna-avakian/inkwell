import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  hasStyleTagOverlap,
  isCommissionAvailable,
  isWithinPriceRange,
  paginate,
} from "@/server/discovery/filters";

describe("isWithinPriceRange (example-based)", () => {
  it("matches when no bounds are given", () => {
    expect(isWithinPriceRange(500, undefined, undefined)).toBe(true);
  });

  it("excludes prices outside the given range", () => {
    expect(isWithinPriceRange(100, 200, 500)).toBe(false);
    expect(isWithinPriceRange(600, 200, 500)).toBe(false);
    expect(isWithinPriceRange(300, 200, 500)).toBe(true);
  });
});

describe("isWithinPriceRange (PBT-01: invariant)", () => {
  it("matches iff min <= price <= max, for any generated inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (price, a, b) => {
          const [min, max] = a <= b ? [a, b] : [b, a];
          const expected = price >= min && price <= max;
          expect(isWithinPriceRange(price, min, max)).toBe(expected);
        },
      ),
    );
  });
});

describe("hasStyleTagOverlap (PBT-01: invariant)", () => {
  it("returns true iff the two tag sets share at least one element", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 5 })),
        fc.array(fc.string({ minLength: 1, maxLength: 5 })),
        (listingTags, filterTags) => {
          const expectedOverlap =
            filterTags.length === 0 || listingTags.some((t) => filterTags.includes(t));
          expect(hasStyleTagOverlap(listingTags, filterTags)).toBe(expectedOverlap);
        },
      ),
    );
  });

  it("matches everything when the filter set is empty", () => {
    expect(hasStyleTagOverlap(["anything"], [])).toBe(true);
    expect(hasStyleTagOverlap([], [])).toBe(true);
  });
});

describe("isCommissionAvailable (PBT-01: invariant)", () => {
  it("is true exactly for open/waitlist, false for closed", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("open" as const, "closed" as const, "waitlist" as const),
        (state) => {
          const expected = state === "open" || state === "waitlist";
          expect(isCommissionAvailable(state)).toBe(expected);
        },
      ),
    );
  });
});

describe("paginate (PBT-01: completeness invariant)", () => {
  it("the union of all pages equals the full input array", () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { maxLength: 200 }), (items) => {
        const pageSize = 24;
        const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
        const reassembled: number[] = [];
        for (let page = 1; page <= totalPages; page++) {
          reassembled.push(...paginate(items, page).items);
        }
        expect(reassembled).toEqual(items);
      }),
    );
  });

  it("reports the correct totalCount regardless of page requested", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { maxLength: 100 }),
        fc.integer({ min: 1, max: 10 }),
        (items, page) => {
          expect(paginate(items, page).totalCount).toBe(items.length);
        },
      ),
    );
  });
});
