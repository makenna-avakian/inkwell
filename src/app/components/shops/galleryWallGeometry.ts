/**
 * Pure position math for GalleryWall's drag-to-position wall, extracted so
 * it's unit-testable without simulating real pointer events (jsdom doesn't
 * support pointer/drag mechanics well — see PortfolioManager's precedent of
 * testing state-transition logic through an accessible trigger instead).
 */

export const WALL_X_MIN = 6;
export const WALL_X_MAX = 94;
export const WALL_Y_MIN = 4;
export const WALL_Y_MAX = 62;

export interface Position {
  x: number;
  y: number;
}

/** Keeps a dragged frame within the wall region, above the floor line. */
export function clampPosition(x: number, y: number): Position {
  return {
    x: Math.max(WALL_X_MIN, Math.min(WALL_X_MAX, x)),
    y: Math.max(WALL_Y_MIN, Math.min(WALL_Y_MAX, y)),
  };
}

/** Evenly spreads newly-selected pieces that don't have a saved position yet. */
export function defaultPositionFor(index: number, total: number): Position {
  return { x: ((index + 1) * 100) / (total + 1), y: 10 + (index % 2) * 12 };
}

/** Reuses each id's existing position where one exists; assigns a spread default otherwise. */
export function assignPositions(
  ids: string[],
  existing: Record<string, Position>,
): Record<string, Position> {
  const result: Record<string, Position> = {};
  ids.forEach((id, index) => {
    result[id] = existing[id] ?? defaultPositionFor(index, ids.length);
  });
  return result;
}
