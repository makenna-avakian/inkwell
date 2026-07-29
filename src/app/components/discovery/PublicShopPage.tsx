import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getShopPageData } from "@/server/discovery/service";
import { auth } from "@/server/auth/config";
import BlockRenderer from "./BlockRenderer";
import ListingCard from "./ListingCard";
import PortfolioGallery from "./PortfolioGallery";
import type { ContentBlock } from "@/server/shops/blocks";
import CommissionRequestForm from "@/app/components/requests/CommissionRequestForm";
import WaitlistJoinButton from "@/app/components/requests/WaitlistJoinButton";
import BuyNowButton from "@/app/components/orders/BuyNowButton";

interface PublicShopPageProps {
  shopId: string;
}

export default async function PublicShopPage({ shopId }: PublicShopPageProps) {
  const [data, session] = await Promise.all([getShopPageData(shopId), auth()]);
  if (!data) notFound();

  const { shop, portfolio, publishedRules, availableListings } = data;

  return (
    <main data-testid="public-shop-page" className="mx-auto max-w-4xl p-8 pt-32">
      {shop.bannerImageUrl && (
        <Image src={shop.bannerImageUrl} alt="" width={1200} height={300} className="w-full object-cover" />
      )}
      <div className="mt-6 flex items-center gap-4">
        {shop.avatarImageUrl && (
          <Image src={shop.avatarImageUrl} alt="" width={80} height={80} className="rounded-full" />
        )}
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">{shop.displayName}</h1>
        {publishedRules && (
          <span
            data-testid="public-shop-page-slot-state"
            className="border border-border px-3 py-1 text-xs font-medium tracking-[0.1em] text-muted uppercase"
          >
            {publishedRules.slotState}
          </span>
        )}
      </div>
      {shop.bio && <p className="mt-4 max-w-2xl text-muted">{shop.bio}</p>}

      {Array.isArray(shop.socialLinks) && shop.socialLinks.length > 0 && (
        <div data-testid="public-shop-page-social-links" className="mt-4 flex flex-wrap gap-4">
          {(shop.socialLinks as { label: string; url: string }[]).map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium tracking-[0.1em] text-foreground uppercase underline underline-offset-4 transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <h2 className="mt-12 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Portfolio
      </h2>
      <PortfolioGallery
        images={portfolio.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          title: image.title,
          caption: image.caption,
          tags: (image.tags as string[] | null) ?? [],
          listingId: image.listingId,
          featured: image.featured,
        }))}
        availableListingIds={availableListings.map((listing) => listing.id)}
      />

      <h2 className="mt-12 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Commission Rules
      </h2>
      {publishedRules ? (
        <BlockRenderer blocks={publishedRules.version.rulesContent as ContentBlock[]} />
      ) : (
        <p data-testid="public-shop-page-no-rules" className="text-muted">
          This shop hasn&apos;t published commission rules yet.
        </p>
      )}

      <h2 className="mt-12 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Request a Commission
      </h2>
      {publishedRules && publishedRules.slotState === "open" && (
        session?.user ? (
          <CommissionRequestForm
            shopId={shop.id}
            tiers={publishedRules.version.tiers as { id: string; name: string; priceCents: number }[]}
          />
        ) : (
          <p className="text-muted">
            <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-accent">
              Sign in
            </Link>{" "}
            to request a commission.
          </p>
        )
      )}
      {publishedRules && publishedRules.slotState === "waitlist" && (
        session?.user ? (
          <WaitlistJoinButton shopId={shop.id} />
        ) : (
          <p className="text-muted">
            <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-accent">
              Sign in
            </Link>{" "}
            to join the waitlist.
          </p>
        )
      )}
      {publishedRules && publishedRules.slotState === "closed" && (
        <p data-testid="public-shop-page-closed" className="text-muted">
          This shop isn&apos;t accepting commissions right now.
        </p>
      )}

      <h2 className="mt-12 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Available Now
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {availableListings.map((listing) => (
          <div key={listing.id} id={`listing-${listing.id}`}>
            <ListingCard
              listingId={listing.id}
              title={listing.title}
              priceCents={listing.priceCents}
              imageUrl={null}
              styleTags={listing.styleTags as string[]}
              shopId={shop.id}
              shopDisplayName={shop.displayName}
              shopSlotState={publishedRules?.slotState ?? "closed"}
            />
            {session?.user ? (
              <BuyNowButton listingId={listing.id} />
            ) : (
              <p className="mt-2 text-sm text-muted">
                <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-accent">
                  Sign in
                </Link>{" "}
                to buy now.
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
