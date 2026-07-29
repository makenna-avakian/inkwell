import Link from "next/link";
import { browseFeed, type BrowseFeedFilters } from "@/server/discovery/service";
import FilterPanel from "./FilterPanel";
import ListingCard from "./ListingCard";
import Pagination from "./Pagination";

interface BrowseFeedProps {
  filters: BrowseFeedFilters;
}

export default async function BrowseFeed({ filters }: BrowseFeedProps) {
  const result = await browseFeed(filters);

  return (
    <div data-testid="browse-feed">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">Browse</h1>
        <p className="mt-1.5 text-sm text-muted">{result.totalCount} pieces</p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="md:col-span-1">
          <FilterPanel availableTags={result.availableTags} />
        </aside>
        <div className="md:col-span-3">
          {result.items.length === 0 ? (
            <div
              data-testid="browse-feed-empty"
              className="flex flex-col items-center border border-dashed border-border p-16 text-center"
            >
              <p className="font-serif text-lg font-medium text-foreground">No listings match your filters</p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                Try widening your subject tags or turning off &quot;accepting commissions only.&quot;
              </p>
              <Link
                href="/gallery"
                className="mt-6 border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {result.items.map((item) => (
                <ListingCard
                  key={item.listingId}
                  listingId={item.listingId}
                  title={item.title}
                  priceCents={item.priceCents}
                  imageUrl={item.imageUrl}
                  styleTags={item.styleTags}
                  shopId={item.shopId}
                  shopDisplayName={item.shopDisplayName}
                  shopSlotState={item.shopSlotState}
                />
              ))}
            </div>
          )}
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            basePath="/gallery"
          />
        </div>
      </div>
    </div>
  );
}
