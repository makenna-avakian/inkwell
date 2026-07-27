import Link from "next/link";
import Navbar from "@/app/components/Navbar";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { order } = await searchParams;

  return (
    <>
      <Navbar />
      <main data-testid="checkout-success-page" className="mx-auto max-w-xl p-8 pt-32 text-center">
        <h1 className="mb-4 font-serif text-4xl font-medium tracking-tight text-foreground">Payment received</h1>
        <p className="text-muted">
          Thanks! Your order{order ? ` (${order})` : ""} is being confirmed — this usually only takes a
          moment.
        </p>
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
