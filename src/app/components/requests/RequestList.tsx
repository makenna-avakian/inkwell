import Link from "next/link";
import StatusBadgeIndicator from "./StatusBadgeIndicator";

interface RequestListItem {
  id: string;
  description: string;
  status: "requested" | "accepted" | "declined";
  unread: boolean;
}

interface RequestListProps {
  items: RequestListItem[];
  detailBasePath: string;
  testIdPrefix: string;
}

/** Shared list rendering for RequestInbox (seller) and MyRequests (buyer). */
export default function RequestList({ items, detailBasePath, testIdPrefix }: RequestListProps) {
  if (items.length === 0) {
    return <p data-testid={`${testIdPrefix}-empty`}>No requests yet.</p>;
  }

  return (
    <ul data-testid={testIdPrefix} className="space-y-3">
      {items.map((item) => (
        <li key={item.id} data-testid={`${testIdPrefix}-row-${item.id}`}>
          <Link href={`${detailBasePath}/${item.id}`} className="flex items-center justify-between">
            <span>{item.description}</span>
            <span className="text-sm text-gray-500">
              {item.status}
              <StatusBadgeIndicator unread={item.unread} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
