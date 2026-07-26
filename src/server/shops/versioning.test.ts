import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { computeNextVersion } from "@/server/shops/versioning";

describe("computeNextVersion (example-based)", () => {
  it("returns 1 for a shop with no existing versions", () => {
    expect(computeNextVersion([])).toBe(1);
  });

  it("returns max + 1 for a shop with existing versions", () => {
    expect(computeNextVersion([1, 2, 3])).toBe(4);
    expect(computeNextVersion([3, 1, 2])).toBe(4); // unordered input
  });
});

describe("computeNextVersion (PBT-01/PBT-03: invariants)", () => {
  it("is always strictly greater than every existing version", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 50 }),
        (versions) => {
          const next = computeNextVersion(versions);
          for (const v of versions) {
            expect(next).toBeGreaterThan(v);
          }
        },
      ),
    );
  });

  it("equals max(existing) + 1, or 1 if empty", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 1000 })), (versions) => {
        const expected = versions.length === 0 ? 1 : Math.max(...versions) + 1;
        expect(computeNextVersion(versions)).toBe(expected);
      }),
    );
  });
});
