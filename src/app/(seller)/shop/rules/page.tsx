import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import { getPublishedRuleSet } from "@/server/shops/service";
import CommissionRulesEditor from "@/app/components/shops/CommissionRulesEditor";
import SlotStateSelector from "@/app/components/shops/SlotStateSelector";

export default async function ShopRulesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const shop = await findShopByUserId(session.user.id);
  if (!shop) redirect("/shop/new");

  const published = await getPublishedRuleSet(shop.id);

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 text-3xl font-bold">Commission rules</h1>

      <h2 className="mb-2 font-semibold">Slot status</h2>
      <SlotStateSelector shopId={shop.id} currentState={published?.slotState ?? "closed"} />

      <div className="mt-10">
        <CommissionRulesEditor
          shopId={shop.id}
          initialTiers={published?.version.tiers as never}
          initialAddOns={published?.version.addOns as never}
          initialBlocks={published?.version.rulesContent as never}
          initialMaxQueue={published?.maxQueue}
        />
      </div>
    </main>
  );
}
