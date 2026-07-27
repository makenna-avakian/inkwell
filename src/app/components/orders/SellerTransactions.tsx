import { getOrderHistoryForSeller } from "@/server/orders/service";
import OrderStatusPanel from "./OrderStatusPanel";

interface SellerTransactionsProps {
  sellerId: string;
}

export default async function SellerTransactions({ sellerId }: SellerTransactionsProps) {
  const orders = await getOrderHistoryForSeller(sellerId);

  if (orders.length === 0) {
    return <p data-testid="seller-transactions-empty">No transactions yet.</p>;
  }

  return (
    <ul data-testid="seller-transactions" className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} data-testid={`seller-transactions-row-${order.id}`}>
          <p className="text-sm text-gray-500">
            Seller net: ${(order.sellerNetCents / 100).toFixed(2)}
          </p>
          <OrderStatusPanel order={order} currentUserId={sellerId} />
        </li>
      ))}
    </ul>
  );
}
