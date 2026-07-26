import { notFound } from "next/navigation";
import { findShopById } from "@/server/shops/repository";
import { getRequestWithMessages, markRequestSeen } from "@/server/requests/service";
import MessageThread from "./MessageThread";
import RequestActions from "./RequestActions";

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

  await markRequestSeen(requestId, callerId);

  return (
    <div data-testid="request-detail">
      <h1 className="text-2xl font-bold">{request.description}</h1>
      <p data-testid="request-detail-status" className="mt-2 text-gray-600">
        Status: {request.status}
      </p>
      {request.budgetCents && <p>Budget: ${(request.budgetCents / 100).toFixed(2)}</p>}
      {request.declineReason && <p>Decline reason: {request.declineReason}</p>}

      {isShopOwner && request.status === "requested" && (
        <RequestActions requestId={requestId} />
      )}

      <h2 className="mt-8 mb-4 text-xl font-semibold">Messages</h2>
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
