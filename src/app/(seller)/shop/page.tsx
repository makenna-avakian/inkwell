import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import { getShopPortfolio } from "@/server/shops/service";
import ShopProfileForm from "@/app/components/shops/ShopProfileForm";
import PortfolioManager from "@/app/components/shops/PortfolioManager";

export default async function ManageShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const shop = await findShopByUserId(session.user.id);
  if (!shop) redirect("/shop/new");

  const images = await getShopPortfolio(shop.id);

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 text-3xl font-bold">Manage your shop</h1>
      <ShopProfileForm mode="edit" shopId={shop.id} initialBio={shop.bio ?? undefined} />

      <h2 className="mt-10 mb-4 text-xl font-semibold">Portfolio</h2>
      <PortfolioManager
        shopId={shop.id}
        initialImages={images.map((i) => ({ id: i.id, imageUrl: i.imageUrl }))}
      />
    </main>
  );
}
