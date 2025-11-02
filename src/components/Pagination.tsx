'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export default function Pagination({ page, limit, total, hasMore }: PaginationProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const totalPages = Math.ceil(total / limit);
  const hasPrevious = page > 1;
  const hasNext = hasMore;

  const createURL = (newPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (newPage > 1) params.set('page', newPage.toString());
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-4 mt-8" aria-label="Pagination">
      <Link
        href={createURL(page - 1)}
        className={`px-4 py-2 rounded-md border border-white/10 ${
          hasPrevious
            ? 'bg-white/10 hover:bg-white/20 text-slate-100'
            : 'bg-white/5 text-slate-500 cursor-not-allowed pointer-events-none'
        } transition-colors`}
        aria-disabled={!hasPrevious}
      >
        Previous
      </Link>

      <div className="flex items-center gap-2">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <Link
              key={pageNum}
              href={createURL(pageNum)}
              className={`px-3 py-1 rounded ${
                pageNum === page
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'bg-white/10 hover:bg-white/20 text-slate-100'
              } transition-colors`}
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      <span className="text-sm text-slate-400">
        Page {page} of {totalPages}
      </span>

      <Link
        href={createURL(page + 1)}
        className={`px-4 py-2 rounded-md border border-white/10 ${
          hasNext
            ? 'bg-white/10 hover:bg-white/20 text-slate-100'
            : 'bg-white/5 text-slate-500 cursor-not-allowed pointer-events-none'
        } transition-colors`}
        aria-disabled={!hasNext}
      >
        Next
      </Link>
    </nav>
  );
}

