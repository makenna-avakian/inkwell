"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={handleSubmit} data-testid="search-bar">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search artists or shops"
        data-testid="search-bar-input"
        className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        data-testid="search-bar-submit-button"
        className="mt-2 border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
      >
        Search
      </button>
    </form>
  );
}
