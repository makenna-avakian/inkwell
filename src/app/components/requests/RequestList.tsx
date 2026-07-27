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
    return <p data-testid={`${testIdPrefix}-empty`} className="text-muted">No requests yet.</p>;
  }

  return (
    <ul data-testid={testIdPrefix} className="divide-y divide-border border-t border-border">
      {items.map((item) => (
        <li key={item.id} data-testid={`${testIdPrefix}-row-${item.id}`}>
          <Link
            href={`${detailBasePath}/${item.id}`}
            className="flex items-center justify-between py-3 text-foreground transition-colors hover:text-accent"
          >
            <span>{item.description}</span>
            <span className="text-xs font-medium tracking-[0.1em] text-muted uppercase">
              {item.status}
              <StatusBadgeIndicator unread={item.unread} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
