import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import { getShopPortfolio } from "@/server/shops/service";
import { getShopStripeAccountId } from "@/server/orders/repository";
import { hasPayoutsEnabled } from "@/server/orders/payment";
import ShopProfileForm from "@/app/components/shops/ShopProfileForm";
import PortfolioManager from "@/app/components/shops/PortfolioManager";
import StripeOnboardingButton from "@/app/components/orders/StripeOnboardingButton";

export default async function ManageShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const shop = await findShopByUserId(session.user.id);
  if (!shop) redirect("/shop/new");

  const images = await getShopPortfolio(shop.id);
  const accountId = await getShopStripeAccountId(shop.id);
  const payoutsEnabled = await hasPayoutsEnabled(accountId);

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">Manage your shop</h1>
      <ShopProfileForm mode="edit" shopId={shop.id} initialBio={shop.bio ?? undefined} />

      <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Payments
      </h2>
      <StripeOnboardingButton shopId={shop.id} payoutsEnabled={payoutsEnabled} />

      <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Portfolio
      </h2>
      <PortfolioManager
        shopId={shop.id}
        initialImages={images.map((i) => ({ id: i.id, imageUrl: i.imageUrl }))}
      />
    </main>
  );
}
