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
        <h1 className="mb-4 text-3xl font-bold">Payment received</h1>
        <p className="text-gray-600">
          Thanks! Your order{order ? ` (${order})` : ""} is being confirmed — this usually only takes a
          moment.
        </p>
        <Link href="/orders" className="mt-6 inline-block underline">
          View my orders
        </Link>
      </main>
    </>
  );
}
