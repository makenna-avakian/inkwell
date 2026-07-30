import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { auth } from "@/server/auth/config";
import { getShopPageData } from "@/server/discovery/service";
import GalleryWall from "@/app/components/shops/GalleryWall";

interface ShopGalleryPageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopGalleryPage({ params }: ShopGalleryPageProps) {
  const { shopId } = await params;
  const [data, session] = await Promise.all([getShopPageData(shopId), auth()]);
  if (!data) notFound();

  const { shop, portfolio, availableListings, galleryWallSettings } = data;
  const canEdit = session?.user?.id === shop.userId;

  const priceCentsByListingId = new Map(
    availableListings.map((listing) => [listing.id, listing.priceCents]),
  );

  const pool = portfolio.map((image) => ({
    id: image.id,
    imageUrl: image.imageUrl,
    title: image.title,
    listingId: image.listingId,
    priceCents: image.listingId ? (priceCentsByListingId.get(image.listingId) ?? null) : null,
  }));

  return (
    <>
      <Navbar />
      <GalleryWall
        shopId={shop.id}
        shopDisplayName={shop.displayName}
        pool={pool}
        initialSettings={
          galleryWallSettings
            ? {
                frameColor: galleryWallSettings.frameColor,
                frameStyle: galleryWallSettings.frameStyle,
                pieces: galleryWallSettings.pieces as { portfolioImageId: string; x: number; y: number }[],
              }
            : null
        }
        canEdit={canEdit}
      />
    </>
  );
}
