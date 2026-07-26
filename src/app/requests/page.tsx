import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import Navbar from "@/app/components/Navbar";
import MyRequests from "@/app/components/requests/MyRequests";

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-8 pt-32">
        <h1 className="mb-6 text-3xl font-bold">My requests</h1>
        <MyRequests buyerId={session.user.id} />
      </main>
    </>
  );
}
