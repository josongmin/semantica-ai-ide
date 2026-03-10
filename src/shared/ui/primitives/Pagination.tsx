import React, { useCallback, useMemo } from "react";

import { cn, focusRing } from "../variants";
import { Icon } from "./Icon";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Number of sibling pages shown around the current page. Defaults to 1. */
  siblingCount?: number;
  className?: string;
}

/**
 * Build the list of page numbers and ellipsis markers.
 * Returns an array of page numbers (1-based) or `null` for ellipsis.
 */
function buildRange(page: number, totalPages: number, siblingCount: number): (number | null)[] {
  const totalSlots = siblingCount * 2 + 5; // first + last + current + 2 ellipsis + siblings

  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const result: (number | null)[] = [];

  if (showLeftEllipsis) {
    result.push(1, null);
  } else {
    for (let i = 1; i < leftSibling; i++) result.push(i);
  }

  for (let i = leftSibling; i <= rightSibling; i++) result.push(i);

  if (showRightEllipsis) {
    result.push(null, totalPages);
  } else {
    for (let i = rightSibling + 1; i <= totalPages; i++) result.push(i);
  }

  return result;
}

const btnBase = [
  "inline-flex items-center justify-center",
  "h-7 min-w-[1.75rem] px-1.5 rounded text-xs",
  "transition-colors duration-fast",
  "disabled:opacity-40 disabled:cursor-not-allowed",
].join(" ");

export const Pagination = React.memo(
  React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
    { page, totalPages, onPageChange, siblingCount = 1, className },
    ref,
  ) {
    const range = useMemo(
      () => buildRange(page, totalPages, siblingCount),
      [page, totalPages, siblingCount],
    );

    const goPrev = useCallback(() => {
      if (page > 1) onPageChange(page - 1);
    }, [page, onPageChange]);

    const goNext = useCallback(() => {
      if (page < totalPages) onPageChange(page + 1);
    }, [page, totalPages, onPageChange]);

    if (totalPages <= 1) return null;

    return (
      <nav ref={ref} aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
        {/* Previous */}
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={goPrev}
          className={cn(
            btnBase,
            focusRing,
            "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-surface-2",
          )}
        >
          <Icon name="chevron-left" tokenSize="xs" />
        </button>

        {/* Page numbers */}
        {range.map((p, idx) =>
          p === null ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-xs text-vsc-text-tertiary select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                btnBase,
                focusRing,
                p === page
                  ? "bg-vsc-button text-vsc-button-fg font-medium"
                  : "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-surface-2",
              )}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={goNext}
          className={cn(
            btnBase,
            focusRing,
            "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-surface-2",
          )}
        >
          <Icon name="chevron-right" tokenSize="xs" />
        </button>
      </nav>
    );
  }),
);
