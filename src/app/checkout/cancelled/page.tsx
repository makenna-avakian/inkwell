import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export default function CheckoutCancelledPage() {
  return (
    <>
      <Navbar />
      <main data-testid="checkout-cancelled-page" className="mx-auto max-w-xl p-8 pt-32 text-center">
        <h1 className="mb-4 text-3xl font-bold">Checkout cancelled</h1>
        <p className="text-gray-600">No payment was made. You can try again any time.</p>
        <Link href="/orders" className="mt-6 inline-block underline">
          View my orders
        </Link>
      </main>
    </>
  );
}
