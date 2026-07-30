"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { saveGalleryWallLayoutAction } from "@/app/shops/[shopId]/gallery/actions";
import { assignPositions, clampPosition, type Position } from "./galleryWallGeometry";

const FRAME_COLORS = [
  { id: "black", hex: "#1a1a1a" },
  { id: "walnut", hex: "#6b4a33" },
  { id: "white", hex: "#f2efe8" },
  { id: "gold", hex: "#b08d4f" },
] as const;

const FRAME_STYLES = [
  { id: "thin", label: "Thin modern", border: 6, mat: 0 },
  { id: "classic", label: "Classic mat", border: 14, mat: 14 },
  { id: "floating", label: "Floating", border: 3, mat: 24 },
] as const;

const MAX_PIECES = 5;

// Fixed, purely decorative silhouettes — matches the mockup's stubbed
// "walkers" positions/opacity/scale (the mockup itself never actually
// rendered a person graphic there).
const WALKERS = [
  { left: 8, bottom: 18, scale: 0.85, opacity: 0.35 },
  { left: 32, bottom: 10, scale: 1.05, opacity: 0.55 },
  { left: 58, bottom: 22, scale: 0.75, opacity: 0.3 },
  { left: 80, bottom: 8, scale: 1.1, opacity: 0.6 },
];

function Walker({ left, bottom, scale, opacity }: { left: number; bottom: number; scale: number; opacity: number }) {
  return (
    <svg
      viewBox="0 0 24 48"
      width={24 * scale}
      height={48 * scale}
      style={{ position: "absolute", left: `${left}%`, bottom, opacity }}
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="6" fill="#8a7f6d" />
      <path d="M6 16 Q12 12 18 16 L20 44 L14 44 L12 26 L10 44 L4 44 Z" fill="#8a7f6d" />
    </svg>
  );
}

export interface GalleryWallPoolPiece {
  id: string;
  imageUrl: string;
  title: string | null;
  listingId: string | null;
  priceCents: number | null;
}

export interface GalleryWallInitialSettings {
  frameColor: string;
  frameStyle: string;
  pieces: { portfolioImageId: string; x: number; y: number }[];
}

interface GalleryWallProps {
  shopId: string;
  shopDisplayName: string;
  pool: GalleryWallPoolPiece[];
  initialSettings: GalleryWallInitialSettings | null;
  canEdit: boolean;
}

export default function GalleryWall({
  shopId,
  shopDisplayName,
  pool,
  initialSettings,
  canEdit,
}: GalleryWallProps) {
  // Only default to a starting selection for the owner's first-ever visit —
  // a plain visitor to a shop that hasn't configured a wall yet should see
  // the "not set up" placeholder, not pieces the owner never chose.
  const defaultSelectedIds = initialSettings
    ? initialSettings.pieces.map((p) => p.portfolioImageId)
    : canEdit
      ? pool.slice(0, 3).map((p) => p.id)
      : [];
  const defaultPositions = initialSettings
    ? Object.fromEntries(initialSettings.pieces.map((p) => [p.portfolioImageId, { x: p.x, y: p.y }]))
    : assignPositions(defaultSelectedIds, {});

  const [mode, setMode] = useState<"edit" | "view">(canEdit ? "edit" : "view");
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds);
  const [positions, setPositions] = useState<Record<string, Position>>(defaultPositions);
  const [frameColor, setFrameColor] = useState(initialSettings?.frameColor ?? "black");
  const [frameStyle, setFrameStyle] = useState(initialSettings?.frameStyle ?? "classic");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const wallRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isEdit = canEdit && mode === "edit";
  const poolById = new Map(pool.map((p) => [p.id, p]));
  const frameStyleObj = FRAME_STYLES.find((f) => f.id === frameStyle) ?? FRAME_STYLES[1];
  const frameHex = FRAME_COLORS.find((c) => c.id === frameColor)?.hex ?? FRAME_COLORS[0].hex;

  async function saveLayout(overrides?: {
    selectedIds?: string[];
    positions?: Record<string, Position>;
    frameColor?: string;
    frameStyle?: string;
  }) {
    const ids = overrides?.selectedIds ?? selectedIds;
    const pos = overrides?.positions ?? positions;
    const result = await saveGalleryWallLayoutAction(shopId, {
      frameColor: overrides?.frameColor ?? frameColor,
      frameStyle: overrides?.frameStyle ?? frameStyle,
      pieces: ids.map((id) => ({
        portfolioImageId: id,
        x: pos[id]?.x ?? 50,
        y: pos[id]?.y ?? 15,
      })),
    });
    setError(result.error);
  }

  function togglePiece(id: string) {
    const alreadySelected = selectedIds.includes(id);
    if (!alreadySelected && selectedIds.length >= MAX_PIECES) return;
    const next = alreadySelected ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    const nextPositions = assignPositions(next, positions);
    setSelectedIds(next);
    setPositions(nextPositions);
    void saveLayout({ selectedIds: next, positions: nextPositions });
  }

  function handleSetFrameColor(id: string) {
    setFrameColor(id);
    void saveLayout({ frameColor: id });
  }

  function handleSetFrameStyle(id: string) {
    setFrameStyle(id);
    void saveLayout({ frameStyle: id });
  }

  function handleFrameDown(id: string, e: React.PointerEvent<HTMLDivElement>) {
    if (!isEdit) return;
    e.preventDefault();
    const rect = wallRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = positions[id] ?? { x: 50, y: 15 };
    dragOffset.current = {
      x: e.clientX - rect.left - (rect.width * pos.x) / 100,
      y: e.clientY - rect.top - (rect.height * pos.y) / 100,
    };
    setDraggingId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingId || !wallRef.current) return;
    const rect = wallRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100;
    const clamped = clampPosition(rawX, rawY);
    setPositions((prev) => ({ ...prev, [draggingId]: clamped }));
  }

  function handlePointerUp() {
    if (!draggingId) return;
    setDraggingId(null);
    void saveLayout();
  }

  const wallPieces = selectedIds
    .map((id) => poolById.get(id))
    .filter((p): p is GalleryWallPoolPiece => !!p)
    .map((p) => ({ ...p, pos: positions[p.id] ?? { x: 50, y: 15 } }));

  return (
    <main className="mx-auto max-w-6xl p-8 pt-32">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">Shop Gallery</h1>
          <p className="mt-1.5 text-sm text-muted">{shopDisplayName} — a walkthrough of featured pieces</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setMode(isEdit ? "view" : "edit")}
            data-testid="gallery-wall-mode-toggle"
            className="border border-foreground px-5 py-2.5 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
          >
            {isEdit ? "Preview Gallery" : "Edit Layout"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" data-testid="gallery-wall-error" className="mb-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        {isEdit && (
          <div className="w-full flex-none border border-border bg-surface p-5 md:w-64">
            <div className="mb-1 text-xs font-medium tracking-[0.15em] text-muted uppercase">Choose pieces</div>
            <div className="mb-3 text-xs text-muted">Pick up to {MAX_PIECES} · {selectedIds.length}/{MAX_PIECES} selected</div>

            {pool.length === 0 ? (
              <p className="text-sm text-muted">
                Add some pieces to your portfolio first, then come back here to build your gallery wall.
              </p>
            ) : (
              <div className="space-y-1">
                {pool.map((p) => {
                  const selected = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePiece(p.id)}
                      data-testid={`gallery-wall-pool-item-${p.id}`}
                      className={`flex cursor-pointer items-center gap-2.5 border p-2 ${
                        selected ? "border-accent bg-background" : "border-border"
                      } ${!selected && selectedIds.length >= MAX_PIECES ? "opacity-40" : ""}`}
                    >
                      <Image src={p.imageUrl} alt="" width={36} height={36} className="h-9 w-9 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-foreground">{p.title ?? "Untitled"}</div>
                        {p.priceCents != null && (
                          <div className="text-[11px] text-muted">${(p.priceCents / 100).toFixed(2)}</div>
                        )}
                      </div>
                      <div
                        className={`h-4 w-4 flex-none border ${selected ? "border-accent bg-accent" : "border-border bg-surface"}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="my-4 border-t border-border" />
            <div className="mb-2 text-xs font-medium tracking-[0.15em] text-muted uppercase">Frame color</div>
            <div className="mb-4 flex gap-2.5">
              {FRAME_COLORS.map((fc) => (
                <button
                  key={fc.id}
                  type="button"
                  onClick={() => handleSetFrameColor(fc.id)}
                  data-testid={`gallery-wall-frame-color-${fc.id}`}
                  style={{ backgroundColor: fc.hex }}
                  className={`h-7 w-7 border-2 ${frameColor === fc.id ? "border-accent" : "border-border"}`}
                />
              ))}
            </div>
            <div className="mb-2 text-xs font-medium tracking-[0.15em] text-muted uppercase">Frame style</div>
            <div className="flex flex-col gap-1.5">
              {FRAME_STYLES.map((fs) => (
                <button
                  key={fs.id}
                  type="button"
                  onClick={() => handleSetFrameStyle(fs.id)}
                  data-testid={`gallery-wall-frame-style-${fs.id}`}
                  className={`border px-2.5 py-2 text-left text-xs font-medium ${
                    frameStyle === fs.id ? "border-accent bg-background text-accent" : "border-border text-foreground"
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1">
          {isEdit && <p className="mb-2 text-xs text-muted">Drag pieces on the wall to arrange them.</p>}

          {wallPieces.length === 0 && !isEdit ? (
            <p className="text-muted">This shop hasn&apos;t set up a gallery wall yet.</p>
          ) : (
            <div
              ref={wallRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              data-testid="gallery-wall-canvas"
              style={{
                position: "relative",
                width: "100%",
                height: 640,
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  height: "75%",
                  background:
                    "repeating-linear-gradient(90deg, var(--surface) 0px, var(--surface) 130px, var(--border) 130px, var(--border) 132px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "75%",
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "var(--border)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(75% + 3px)",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "repeating-linear-gradient(90deg, #b8926b 0px, #b8926b 60px, #a67f5a 60px, #a67f5a 62px)",
                }}
              />

              {WALKERS.map((w, i) => (
                <Walker key={i} {...w} />
              ))}

              {wallPieces.map((p) => (
                <div
                  key={p.id}
                  onPointerDown={(e) => handleFrameDown(p.id, e)}
                  data-testid={`gallery-wall-frame-${p.id}`}
                  style={{
                    position: "absolute",
                    left: `${p.pos.x}%`,
                    top: `${p.pos.y}%`,
                    transform: "translate(-50%, 0)",
                    cursor: isEdit ? "grab" : "default",
                    touchAction: "none",
                    outline: isEdit ? "1.5px dashed var(--border)" : "none",
                    outlineOffset: 6,
                  }}
                  className="flex flex-col items-center"
                >
                  <div style={{ background: frameHex, padding: frameStyleObj.border }}>
                    <div style={{ background: "#fff", padding: frameStyleObj.mat }}>
                      <Image
                        src={p.imageUrl}
                        alt={p.title ?? ""}
                        width={110}
                        height={140}
                        style={{ width: 110, height: 140 }}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div
                    className="mt-2.5 border border-border bg-surface px-2.5 py-1.5 text-center"
                    style={{ minWidth: 130, pointerEvents: "none" }}
                  >
                    <div className="font-serif text-xs font-semibold text-foreground">{p.title ?? "Untitled"}</div>
                    <div className="mt-0.5 text-[10px] tracking-wide text-muted uppercase">
                      {shopDisplayName}
                      {p.priceCents != null ? ` · $${(p.priceCents / 100).toFixed(2)}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
