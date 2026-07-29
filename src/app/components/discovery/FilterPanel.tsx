"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface FilterPanelProps {
  availableTags: string[];
}

export default function FilterPanel({ availableTags }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [medium, setMedium] = useState(searchParams.get("medium") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [commissionAvailableOnly, setCommissionAvailableOnly] = useState(
    searchParams.get("commissionAvailableOnly") === "true",
  );
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [tags, setTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) ?? [],
  );

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (medium) params.set("medium", medium);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (commissionAvailableOnly) params.set("commissionAvailableOnly", "true");
    if (sort !== "newest") params.set("sort", sort);
    if (tags.length > 0) params.set("tags", tags.join(","));
    router.push(`/gallery?${params.toString()}`);
  }

  return (
    <div
      data-testid="browse-feed-filter-panel"
      className="border border-border bg-surface p-5"
    >
      <div className="mb-3 text-xs font-medium tracking-[0.15em] text-muted uppercase">Filters</div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={commissionAvailableOnly}
          onChange={(e) => setCommissionAvailableOnly(e.target.checked)}
          data-testid="filter-panel-commission-available-checkbox"
          className="accent-accent"
        />
        Accepting commissions only
      </label>

      <div className="my-4 border-t border-border" />

      <div className="mb-2 text-xs font-medium tracking-[0.15em] text-muted uppercase">Sort by</div>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        data-testid="filter-panel-sort-select"
        className="w-full border border-border bg-surface p-2 text-sm text-foreground focus:border-accent focus:outline-none"
      >
        <option value="newest">Newest</option>
        <option value="popular">Popular</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>

      <div className="my-4 border-t border-border" />

      <input
        placeholder="Medium (e.g. Watercolor)"
        value={medium}
        onChange={(e) => setMedium(e.target.value)}
        data-testid="filter-panel-medium-input"
        className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          placeholder="Min price"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          data-testid="filter-panel-price-min-input"
          className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
        <input
          type="number"
          placeholder="Max price"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          data-testid="filter-panel-price-max-input"
          className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
      </div>

      {availableTags.length > 0 && (
        <>
          <div className="my-4 border-t border-border" />
          <div className="mb-2 text-xs font-medium tracking-[0.15em] text-muted uppercase">
            Style / subject
          </div>
          <div className="space-y-1">
            {availableTags.map((tag) => (
              <label key={tag} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  data-testid={`filter-panel-tag-checkbox-${tag}`}
                  className="accent-accent"
                />
                {tag}
              </label>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/gallery")}
          data-testid="filter-panel-clear-button"
          className="flex-1 border border-border px-4 py-2.5 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={applyFilters}
          data-testid="filter-panel-apply-button"
          className="flex-1 border border-foreground bg-foreground px-4 py-2.5 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
