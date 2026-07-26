import Navbar from "@/app/components/Navbar";
import PublicShopPage from "@/app/components/discovery/PublicShopPage";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;

  return (
    <>
      <Navbar />
      <PublicShopPage shopId={shopId} />
    </>
  );
}
