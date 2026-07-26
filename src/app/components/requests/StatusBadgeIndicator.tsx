interface StatusBadgeIndicatorProps {
  unread: boolean;
}

export default function StatusBadgeIndicator({ unread }: StatusBadgeIndicatorProps) {
  if (!unread) return null;
  return (
    <span
      data-testid="status-badge-indicator"
      className="ml-2 inline-block h-2 w-2 rounded-full bg-red-600"
      aria-label="unread"
    />
  );
}
