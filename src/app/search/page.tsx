import Navbar from "@/app/components/Navbar";
import ShopSearch from "@/app/components/discovery/ShopSearch";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-8 pt-32">
        <h1 className="mb-8 text-center text-4xl font-bold">Find an artist</h1>
        <ShopSearch query={params.q ?? ""} page={params.page ? Number(params.page) : 1} />
      </main>
    </>
  );
}
