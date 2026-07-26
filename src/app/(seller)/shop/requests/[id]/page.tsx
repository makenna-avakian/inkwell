import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import RequestDetail from "@/app/components/requests/RequestDetail";

export default async function ShopRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;

  return (
    <main className="mx-auto max-w-2xl p-8 pt-32">
      <RequestDetail requestId={id} callerId={session.user.id} />
    </main>
  );
}
