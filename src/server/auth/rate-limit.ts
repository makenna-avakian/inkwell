const WINDOW_MS = 15 * 60 * 1000;
const FREE_ATTEMPTS = 3;
const MAX_DELAY_SECONDS = 60;

export interface AttemptRecord {
  succeeded: boolean;
  attemptedAt: Date;
}

/**
 * BR-6: pure function — required delay given a failure count.
 * 0 for the first 3 failures, then exponential backoff capped at 60s.
 * Property-tested (PBT-01/PBT-03) in rate-limit.test.ts.
 */
export function computeDelaySecondsForFailureCount(
  failureCount: number,
): number {
  if (failureCount <= FREE_ATTEMPTS) {
    return 0;
  }
  const delay = 2 ** (failureCount - FREE_ATTEMPTS);
  return Math.min(delay, MAX_DELAY_SECONDS);
}

/**
 * Counts consecutive failures within the rolling window, since the last
 * success (or the start of the window, whichever is more recent).
 * Attempts must be pre-sorted newest-first by attemptedAt.
 */
export function countConsecutiveFailuresSinceLastSuccess(
  attemptsNewestFirst: AttemptRecord[],
  now: Date,
): number {
  let count = 0;
  for (const attempt of attemptsNewestFirst) {
    const withinWindow = now.getTime() - attempt.attemptedAt.getTime() <= WINDOW_MS;
    if (!withinWindow) break;
    if (attempt.succeeded) break;
    count += 1;
  }
  return count;
}

/** Convenience wrapper combining the two pure functions above. */
export function getRequiredDelaySeconds(
  attemptsNewestFirst: AttemptRecord[],
  now: Date = new Date(),
): number {
  const failureCount = countConsecutiveFailuresSinceLastSuccess(
    attemptsNewestFirst,
    now,
  );
  return computeDelaySecondsForFailureCount(failureCount);
}
