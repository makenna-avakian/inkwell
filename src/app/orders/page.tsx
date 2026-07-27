import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import Navbar from "@/app/components/Navbar";
import MyOrders from "@/app/components/orders/MyOrders";

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-8 pt-32">
        <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-foreground">My Orders</h1>
        <MyOrders buyerId={session.user.id} />
      </main>
    </>
  );
}
