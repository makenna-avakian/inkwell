import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { getListing } from "@/server/listings/service";
import ListingEditForm from "@/app/components/listings/ListingEditForm";
import { signInUrlWithCallback } from "@/server/auth/redirect";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(signInUrlWithCallback(`/shop/listings/${id}`));

  const listing = await getListing(id);
  if (!listing) notFound();

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">Edit Listing</h1>
      <ListingEditForm
        listingId={listing.id}
        initialTitle={listing.title}
        initialDescription={listing.description ?? undefined}
        initialPriceCents={listing.priceCents}
        initialStatus={listing.status}
        initialMedium={listing.medium ?? undefined}
        initialStyleTags={listing.styleTags as string[]}
      />
    </main>
  );
}
