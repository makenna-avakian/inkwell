import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import ShopProfileForm from "@/app/components/shops/ShopProfileForm";
import { signInUrlWithCallback } from "@/server/auth/redirect";

export default async function NewShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(signInUrlWithCallback("/shop/new"));

  const existingShop = await findShopByUserId(session.user.id);
  if (existingShop) redirect("/shop");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 pt-32">
      <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">Open your shop</h1>
      <div className="w-full max-w-lg">
        <ShopProfileForm mode="create" />
      </div>
    </main>
  );
}
