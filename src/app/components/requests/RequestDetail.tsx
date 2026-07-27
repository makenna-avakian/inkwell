import { notFound } from "next/navigation";
import { findShopById } from "@/server/shops/repository";
import { getRequestWithMessages, markRequestSeen } from "@/server/requests/service";
import { findOrderByRequestId } from "@/server/orders/repository";
import MessageThread from "./MessageThread";
import RequestActions from "./RequestActions";
import OrderStatusPanel from "@/app/components/orders/OrderStatusPanel";

interface RequestDetailProps {
  requestId: string;
  callerId: string;
}

export default async function RequestDetail({ requestId, callerId }: RequestDetailProps) {
  const data = await getRequestWithMessages(requestId, callerId).catch(() => null);
  if (!data) notFound();

  const { request, messages } = data;
  const shop = await findShopById(request.shopId);
  const isShopOwner = shop?.userId === callerId;
  const order = request.status === "accepted" ? await findOrderByRequestId(requestId) : undefined;

  await markRequestSeen(requestId, callerId);

  return (
    <div data-testid="request-detail">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">{request.description}</h1>
      <p data-testid="request-detail-status" className="mt-2 text-xs font-medium tracking-[0.1em] text-muted uppercase">
        Status: <span className="text-foreground">{request.status}</span>
      </p>
      {request.budgetCents && (
        <p className="mt-1 text-muted">Budget: ${(request.budgetCents / 100).toFixed(2)}</p>
      )}
      {request.declineReason && (
        <p className="mt-1 text-muted">Decline reason: {request.declineReason}</p>
      )}

      {isShopOwner && request.status === "requested" && (
        <RequestActions requestId={requestId} />
      )}

      {order && <OrderStatusPanel order={order} currentUserId={callerId} />}

      <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
        Messages
      </h2>
      <MessageThread
        requestId={requestId}
        currentUserId={callerId}
        initialMessages={messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
