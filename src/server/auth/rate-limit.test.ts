import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  computeDelaySecondsForFailureCount,
  countConsecutiveFailuresSinceLastSuccess,
  getRequiredDelaySeconds,
  type AttemptRecord,
} from "@/server/auth/rate-limit";

describe("computeDelaySecondsForFailureCount (BR-6, example-based)", () => {
  it("returns 0 for the first 3 failures", () => {
    expect(computeDelaySecondsForFailureCount(0)).toBe(0);
    expect(computeDelaySecondsForFailureCount(1)).toBe(0);
    expect(computeDelaySecondsForFailureCount(3)).toBe(0);
  });

  it("returns exponential backoff after 3 failures, capped at 60", () => {
    expect(computeDelaySecondsForFailureCount(4)).toBe(2);
    expect(computeDelaySecondsForFailureCount(5)).toBe(4);
    expect(computeDelaySecondsForFailureCount(10)).toBe(60);
    expect(computeDelaySecondsForFailureCount(100)).toBe(60);
  });
});

describe("computeDelaySecondsForFailureCount (PBT-01/PBT-03: invariants)", () => {
  it("is always between 0 and 60 inclusive", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), (failureCount) => {
        const delay = computeDelaySecondsForFailureCount(failureCount);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(60);
      }),
    );
  });

  it("is monotonically non-decreasing in failureCount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        (a, b) => {
          const [lo, hi] = a <= b ? [a, b] : [b, a];
          expect(computeDelaySecondsForFailureCount(lo)).toBeLessThanOrEqual(
            computeDelaySecondsForFailureCount(hi),
          );
        },
      ),
    );
  });
});

describe("countConsecutiveFailuresSinceLastSuccess", () => {
  const now = new Date("2026-07-26T12:00:00Z");
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

  it("counts failures newest-first until a success is hit", () => {
    const attempts: AttemptRecord[] = [
      { succeeded: false, attemptedAt: minutesAgo(1) },
      { succeeded: false, attemptedAt: minutesAgo(2) },
      { succeeded: true, attemptedAt: minutesAgo(3) },
      { succeeded: false, attemptedAt: minutesAgo(4) },
    ];
    expect(countConsecutiveFailuresSinceLastSuccess(attempts, now)).toBe(2);
  });

  it("ignores attempts outside the 15-minute window", () => {
    const attempts: AttemptRecord[] = [
      { succeeded: false, attemptedAt: minutesAgo(20) },
    ];
    expect(countConsecutiveFailuresSinceLastSuccess(attempts, now)).toBe(0);
  });

  it("resets to 0 immediately after a successful login (PBT-01: reset invariant)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 14 }), { maxLength: 20 }),
        (minutesAgoFailures) => {
          const attempts: AttemptRecord[] = [
            { succeeded: true, attemptedAt: minutesAgo(0.5) },
            ...minutesAgoFailures.map((m) => ({
              succeeded: false as const,
              attemptedAt: minutesAgo(m + 1),
            })),
          ];
          expect(countConsecutiveFailuresSinceLastSuccess(attempts, now)).toBe(0);
        },
      ),
    );
  });
});

describe("getRequiredDelaySeconds", () => {
  it("combines counting and delay calculation", () => {
    const now = new Date("2026-07-26T12:00:00Z");
    const attempts: AttemptRecord[] = Array.from({ length: 5 }, (_, i) => ({
      succeeded: false,
      attemptedAt: new Date(now.getTime() - i * 1000),
    }));
    expect(getRequiredDelaySeconds(attempts, now)).toBe(4); // failureCount=5 -> 2^(5-3)=4
  });
});
