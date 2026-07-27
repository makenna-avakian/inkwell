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
    <div data-testid="browse-feed" className="grid grid-cols-1 gap-8 md:grid-cols-4">
      <aside className="md:col-span-1">
        <FilterPanel />
      </aside>
      <div className="md:col-span-3">
        {result.items.length === 0 ? (
          <p data-testid="browse-feed-empty" className="text-muted">No listings match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((item) => (
              <ListingCard
                key={item.listingId}
                listingId={item.listingId}
                title={item.title}
                priceCents={item.priceCents}
                imageUrl={item.imageUrl}
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
  );
}
