import Link from "next/link";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  basePath: string;
}

export default function Pagination({ page, pageSize, totalCount, basePath }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav
      data-testid="pagination"
      className="mt-8 flex items-center justify-center gap-4 text-xs font-medium tracking-[0.1em] uppercase"
    >
      {page > 1 && (
        <Link
          href={`${basePath}?page=${page - 1}`}
          data-testid="pagination-prev-link"
          className="text-foreground underline underline-offset-4 hover:text-accent"
        >
          Previous
        </Link>
      )}
      <span data-testid="pagination-current" className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={`${basePath}?page=${page + 1}`}
          data-testid="pagination-next-link"
          className="text-foreground underline underline-offset-4 hover:text-accent"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
