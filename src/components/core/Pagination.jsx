import { ArrowLeft, ArrowRight } from 'lucide-react';

// Purpose: Reusable prev/numbered/next pagination control for Spring Page<> results.
// `page`/`totalPages` are 0-indexed to match the backend's Page<> shape directly.
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageButtons = () => {
    let start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, start + 4);
    if (end - start < 4) {
      start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-[28px] bg-white px-4 py-4 shadow-sm">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      {pageButtons().map((pageIndex) => (
        <button
          key={pageIndex}
          type="button"
          onClick={() => onPageChange(pageIndex)}
          className={`h-11 min-w-[44px] rounded-2xl px-4 text-sm font-semibold transition ${
            pageIndex === page
              ? 'bg-[#0A7C6E] text-white'
              : 'border border-[#E5E7EB] bg-white text-slate-700 hover:border-[#0A7C6E]'
          }`}
        >
          {pageIndex + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page === totalPages - 1}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
