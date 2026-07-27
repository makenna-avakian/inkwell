"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [medium, setMedium] = useState(searchParams.get("medium") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [commissionAvailableOnly, setCommissionAvailableOnly] = useState(
    searchParams.get("commissionAvailableOnly") === "true",
  );

  function applyFilters() {
    const params = new URLSearchParams();
    if (medium) params.set("medium", medium);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (commissionAvailableOnly) params.set("commissionAvailableOnly", "true");
    router.push(`/gallery?${params.toString()}`);
  }

  return (
    <div data-testid="browse-feed-filter-panel" className="space-y-4">
      <input
        placeholder="Medium (e.g. Watercolor)"
        value={medium}
        onChange={(e) => setMedium(e.target.value)}
        data-testid="filter-panel-medium-input"
        className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
      />
      <div className="flex gap-2">
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
      <button
        type="button"
        onClick={applyFilters}
        data-testid="filter-panel-apply-button"
        className="border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
      >
        Apply Filters
      </button>
    </div>
  );
}
