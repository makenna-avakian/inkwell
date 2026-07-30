import { describe, expect, it } from "vitest";
import {
  assignPositions,
  clampPosition,
  defaultPositionFor,
  WALL_X_MAX,
  WALL_X_MIN,
  WALL_Y_MAX,
  WALL_Y_MIN,
} from "./galleryWallGeometry";

describe("clampPosition", () => {
  it("passes through a position already within range", () => {
    expect(clampPosition(50, 30)).toEqual({ x: 50, y: 30 });
  });

  it("clamps x to the wall's horizontal range", () => {
    expect(clampPosition(-10, 30).x).toBe(WALL_X_MIN);
    expect(clampPosition(500, 30).x).toBe(WALL_X_MAX);
  });

  it("clamps y to stay above the floor line", () => {
    expect(clampPosition(50, -10).y).toBe(WALL_Y_MIN);
    expect(clampPosition(50, 500).y).toBe(WALL_Y_MAX);
  });
});

describe("defaultPositionFor", () => {
  it("spreads pieces evenly across the wall width", () => {
    expect(defaultPositionFor(0, 3).x).toBeCloseTo(25);
    expect(defaultPositionFor(1, 3).x).toBeCloseTo(50);
    expect(defaultPositionFor(2, 3).x).toBeCloseTo(75);
  });

  it("alternates vertical offset for visual variety", () => {
    expect(defaultPositionFor(0, 2).y).toBe(10);
    expect(defaultPositionFor(1, 2).y).toBe(22);
  });
});

describe("assignPositions", () => {
  it("reuses an existing position for an id that already has one", () => {
    const existing = { "piece-1": { x: 40, y: 20 } };
    const result = assignPositions(["piece-1"], existing);
    expect(result["piece-1"]).toEqual({ x: 40, y: 20 });
  });

  it("assigns a spread default for an id with no existing position", () => {
    const result = assignPositions(["piece-1", "piece-2"], {});
    expect(result["piece-1"]).toEqual(defaultPositionFor(0, 2));
    expect(result["piece-2"]).toEqual(defaultPositionFor(1, 2));
  });

  it("mixes reused and newly-assigned positions in the same call", () => {
    const existing = { "piece-1": { x: 40, y: 20 } };
    const result = assignPositions(["piece-1", "piece-2"], existing);
    expect(result["piece-1"]).toEqual({ x: 40, y: 20 });
    expect(result["piece-2"]).toEqual(defaultPositionFor(1, 2));
  });
});
