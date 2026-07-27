import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import { getShopStripeAccountId } from "@/server/orders/repository";
import { hasPayoutsEnabled } from "@/server/orders/payment";
import SellerTransactions from "@/app/components/orders/SellerTransactions";
import StripeOnboardingButton from "@/app/components/orders/StripeOnboardingButton";

export default async function ShopTransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const shop = await findShopByUserId(session.user.id);
  if (!shop) redirect("/shop/new");

  const accountId = await getShopStripeAccountId(shop.id);
  const payoutsEnabled = await hasPayoutsEnabled(accountId);

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 text-3xl font-bold">Transactions</h1>
      <StripeOnboardingButton shopId={shop.id} payoutsEnabled={payoutsEnabled} />

      <h2 className="mt-8 mb-4 text-xl font-semibold">Orders</h2>
      <SellerTransactions sellerId={session.user.id} />
    </main>
  );
}
