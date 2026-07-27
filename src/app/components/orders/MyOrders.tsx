import { getOrderHistoryForBuyer } from "@/server/orders/service";
import OrderStatusPanel from "./OrderStatusPanel";

interface MyOrdersProps {
  buyerId: string;
}

export default async function MyOrders({ buyerId }: MyOrdersProps) {
  const orders = await getOrderHistoryForBuyer(buyerId);

  if (orders.length === 0) {
    return <p data-testid="my-orders-empty">No orders yet.</p>;
  }

  return (
    <ul data-testid="my-orders" className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} data-testid={`my-orders-row-${order.id}`}>
          <OrderStatusPanel order={order} currentUserId={buyerId} />
        </li>
      ))}
    </ul>
  );
}
