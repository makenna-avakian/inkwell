/**
 * BR-4: append-only versioning. Pure function — property-tested in
 * versioning.test.ts (PBT-01/PBT-03).
 */
export function computeNextVersion(existingVersions: number[]): number {
  if (existingVersions.length === 0) return 1;
  return Math.max(...existingVersions) + 1;
}
