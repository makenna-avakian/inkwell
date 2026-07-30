import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findShopByUserId } from "@/server/shops/repository";
import { getShopPortfolio } from "@/server/shops/service";
import { getShopStripeAccountId } from "@/server/orders/repository";
import { hasPayoutsEnabled } from "@/server/orders/payment";
import { listAvailableListingsForShop } from "@/server/listings/repository";
import Link from "next/link";
import ShopProfileForm from "@/app/components/shops/ShopProfileForm";
import PortfolioManager from "@/app/components/shops/PortfolioManager";
import ShopImageUploader from "@/app/components/shops/ShopImageUploader";
import StripeOnboardingButton from "@/app/components/orders/StripeOnboardingButton";
import {
  confirmAvatarImageAction,
  confirmBannerImageAction,
  requestAvatarUploadUrlAction,
  requestBannerUploadUrlAction,
} from "@/app/(seller)/shop/actions";
import type { SocialLink } from "@/app/components/shops/SocialLinksEditor";
import { signInUrlWithCallback } from "@/server/auth/redirect";

export default async function ManageShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(signInUrlWithCallback("/shop"));

  const shop = await findShopByUserId(session.user.id);
  if (!shop) redirect("/shop/new");

  const [images, listings, accountId] = await Promise.all([
    getShopPortfolio(shop.id),
    listAvailableListingsForShop(shop.id),
    getShopStripeAccountId(shop.id),
  ]);
  const payoutsEnabled = await hasPayoutsEnabled(accountId);

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">Manage your shop</h1>
      <ShopProfileForm
        mode="edit"
        shopId={shop.id}
        initialShopName={shop.shopName ?? undefined}
        initialBio={shop.bio ?? undefined}
        initialSocialLinks={(shop.socialLinks as SocialLink[] | null) ?? []}
      />

      <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Branding
      </h2>
      <div className="space-y-6">
        <ShopImageUploader
          shopId={shop.id}
          label="Background image"
          helpText="Shown at the top of your shop page. Recommended: wide, at least 1200px."
          initialImageUrl={shop.bannerImageUrl}
          previewClassName="h-32 w-full object-cover"
          testIdPrefix="shop-banner-uploader"
          requestUploadUrlAction={requestBannerUploadUrlAction}
          confirmImageAction={confirmBannerImageAction}
        />
        <ShopImageUploader
          shopId={shop.id}
          label="Avatar"
          initialImageUrl={shop.avatarImageUrl}
          previewClassName="h-20 w-20 rounded-full object-cover"
          testIdPrefix="shop-avatar-uploader"
          requestUploadUrlAction={requestAvatarUploadUrlAction}
          confirmImageAction={confirmAvatarImageAction}
        />
      </div>

      <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Payments
      </h2>
      <StripeOnboardingButton shopId={shop.id} payoutsEnabled={payoutsEnabled} />

      <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Portfolio
      </h2>
      <PortfolioManager
        shopId={shop.id}
        initialImages={images.map((i) => ({
          id: i.id,
          imageUrl: i.imageUrl,
          title: i.title,
          caption: i.caption,
          tags: (i.tags as string[] | null) ?? [],
          listingId: i.listingId,
          featured: i.featured,
        }))}
        listingOptions={listings.map((l) => ({ id: l.id, title: l.title }))}
      />

      <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Gallery Wall
      </h2>
      <p className="mb-3 text-sm text-muted">
        Arrange a few of your portfolio pieces on an illustrated gallery wall visitors can walk through.
      </p>
      <Link
        href={`/shops/${shop.id}/gallery`}
        data-testid="manage-shop-gallery-wall-link"
        className="inline-block border border-foreground px-5 py-2.5 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
      >
        Open Gallery Wall
      </Link>
    </main>
  );
}
