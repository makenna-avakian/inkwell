import { getRequestsForShop, getUnreadSummary } from "@/server/requests/service";
import RequestList from "./RequestList";

interface RequestInboxProps {
  shopId: string;
  sellerUserId: string;
}

export default async function RequestInbox({ shopId, sellerUserId }: RequestInboxProps) {
  const [requests, unreadSummary] = await Promise.all([
    getRequestsForShop(shopId),
    getUnreadSummary(sellerUserId),
  ]);
  const unreadByRequestId = new Map(unreadSummary.map((u) => [u.requestId, u.unread]));

  return (
    <RequestList
      items={requests.map((r) => ({
        id: r.id,
        description: r.description,
        status: r.status,
        unread: unreadByRequestId.get(r.id) ?? false,
      }))}
      detailBasePath="/shop/requests"
      testIdPrefix="request-inbox"
    />
  );
}
