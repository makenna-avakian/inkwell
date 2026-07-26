import { getRequestsForBuyer, getUnreadSummary } from "@/server/requests/service";
import RequestList from "./RequestList";

interface MyRequestsProps {
  buyerId: string;
}

export default async function MyRequests({ buyerId }: MyRequestsProps) {
  const [requests, unreadSummary] = await Promise.all([
    getRequestsForBuyer(buyerId),
    getUnreadSummary(buyerId),
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
      detailBasePath="/requests"
      testIdPrefix="my-requests"
    />
  );
}
