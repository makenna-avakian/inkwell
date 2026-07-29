import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import RequestInbox from "@/app/components/requests/RequestInbox";
import { signInUrlWithCallback } from "@/server/auth/redirect";

export default async function ShopRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(signInUrlWithCallback("/shop/requests"));

  const shop = await findShopByUserId(session.user.id);
  if (!shop) redirect("/shop/new");

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">Commission Requests</h1>
      <RequestInbox shopId={shop.id} sellerUserId={session.user.id} />
    </main>
  );
}
