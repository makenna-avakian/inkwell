import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export default function CheckoutCancelledPage() {
  return (
    <>
      <Navbar />
      <main data-testid="checkout-cancelled-page" className="mx-auto max-w-xl p-8 pt-32 text-center">
        <h1 className="mb-4 font-serif text-4xl font-medium tracking-tight text-foreground">Checkout cancelled</h1>
        <p className="text-muted">No payment was made. You can try again any time.</p>
        <Link
          href="/orders"
          className="mt-6 inline-block text-foreground underline underline-offset-4 hover:text-accent"
        >
          View my orders
        </Link>
      </main>
    </>
  );
}
