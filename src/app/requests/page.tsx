import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import Navbar from "@/app/components/Navbar";
import MyRequests from "@/app/components/requests/MyRequests";
import { signInUrlWithCallback } from "@/server/auth/redirect";

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(signInUrlWithCallback("/requests"));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-8 pt-32">
        <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">My Requests</h1>
        <MyRequests buyerId={session.user.id} />
      </main>
    </>
  );
}
