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
        className="w-full rounded border border-gray-300 p-3"
      />
      <button type="submit" data-testid="search-bar-submit-button" className="mt-2 rounded-lg bg-black px-6 py-3 text-white">
        Search
      </button>
    </form>
  );
}
