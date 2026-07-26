import Link from "next/link";
import Image from "next/image";
import { searchShops } from "@/server/discovery/service";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";

interface ShopSearchProps {
  query: string;
  page: number;
}

export default async function ShopSearch({ query, page }: ShopSearchProps) {
  const result = await searchShops({ query, page });

  return (
    <div data-testid="shop-search">
      <SearchBar />
      {query && result.items.length === 0 && (
        <p data-testid="shop-search-empty">No shops found for &quot;{query}&quot;.</p>
      )}
      <div className="mt-6 space-y-4">
        {result.items.map((shop) => (
          <Link
            key={shop.shopId}
            href={`/shops/${shop.shopId}`}
            data-testid={`shop-search-result-${shop.shopId}`}
            className="flex items-center gap-4"
          >
            {shop.avatarImageUrl && (
              <Image src={shop.avatarImageUrl} alt="" width={48} height={48} className="rounded-full" />
            )}
            <div>
              <p className="font-semibold">{shop.displayName}</p>
              {shop.bio && <p className="text-sm text-gray-600">{shop.bio}</p>}
            </div>
          </Link>
        ))}
      </div>
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        basePath="/search"
      />
    </div>
  );
}
