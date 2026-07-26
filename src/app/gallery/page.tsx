import Navbar from "@/app/components/Navbar";
import BrowseFeed from "@/app/components/discovery/BrowseFeed";
import { browseFeedFiltersSchema } from "@/server/discovery/service";

interface GalleryPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;

  // SECURITY-05: parsed/validated, malformed input falls back to defaults rather than reaching the query layer raw.
  const filters = browseFeedFiltersSchema.parse({
    medium: params.medium || undefined,
    priceMinCents: params.priceMin ? Math.round(Number(params.priceMin) * 100) : undefined,
    priceMaxCents: params.priceMax ? Math.round(Number(params.priceMax) * 100) : undefined,
    commissionAvailableOnly: params.commissionAvailableOnly === "true",
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl p-8 pt-32">
        <h1 className="mb-8 text-center text-4xl font-bold">Browse</h1>
        <BrowseFeed filters={filters} />
      </main>
    </>
  );
}
