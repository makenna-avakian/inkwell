/** Pure business logic — the executable specification for BR-1, BR-6, BR-7. */

interface Tier {
  id: string;
}
interface AddOn {
  id: string;
}

/** BR-1: every referenced id must exist in the published rule version. */
export function isValidTierAndAddOnSelection(
  tiers: Tier[],
  addOns: AddOn[],
  tierId: string,
  addOnIds: string[],
): boolean {
  const tierExists = tiers.some((t) => t.id === tierId);
  const allAddOnsExist = addOnIds.every((id) => addOns.some((a) => a.id === id));
  return tierExists && allAddOnsExist;
}

/** BR-6: one-directional — this function only ever says whether to close, never to reopen. */
export function shouldAutoClose(activeCount: number, maxQueue: number | null): boolean {
  if (maxQueue === null) return false;
  return activeCount >= maxQueue;
}

/** BR-7: unread iff never read, or read strictly before the latest activity. */
export function isUnread(lastReadAt: Date | undefined, latestActivity: Date | undefined): boolean {
  if (!latestActivity) return false; // nothing has happened yet
  if (!lastReadAt) return true;
  return lastReadAt.getTime() < latestActivity.getTime();
}

export function latestOf(...dates: (Date | undefined)[]): Date | undefined {
  const defined = dates.filter((d): d is Date => d !== undefined);
  if (defined.length === 0) return undefined;
  return new Date(Math.max(...defined.map((d) => d.getTime())));
}
