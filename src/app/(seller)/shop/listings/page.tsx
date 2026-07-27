import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import { listAvailableListingsForShop } from "@/server/listings/repository";
import ListingManager from "@/app/components/listings/ListingManager";

export default async function ListingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const shop = await findShopByUserId(session.user.id);
  if (!shop) redirect("/shop/new");

  const listings = await listAvailableListingsForShop(shop.id);

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">Listings</h1>
      <ListingManager
        shopId={shop.id}
        initialListings={listings.map((l) => ({
          id: l.id,
          title: l.title,
          priceCents: l.priceCents,
          status: l.status,
        }))}
      />
    </main>
  );
}
