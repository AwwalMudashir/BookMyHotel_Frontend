import { useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import ReviewCard from './ReviewCard';
import AverageRating from '../review/AverageRating';
import reviewApi from '../../api/reviewApi';
import { parseApiError } from '../../utils/parseApiError';
import ReviewForm from '../review/ReviewForm';
import { useAuth } from '../../hooks/useAuth';

const PAGE_SIZE = 5;

// Purpose: Renders a review list with average rating summary, paginated against
// GET /branches/{branchId}/reviews. Mount with a `key={branchId}` from the parent so switching
// branches remounts fresh at page 0 instead of needing a reset effect.
const ReviewList = ({ branchId }) => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [writeOpen, setWriteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await reviewApi.getBranchReviews(branchId, { page, size: PAGE_SIZE });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err, 'Unable to load reviews right now.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [branchId, page, refreshKey]);

  const reviews = data?.reviews || [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const averageRating = data?.averageRating ?? 0;

  const handleWriteClick = () => {
    if (isAuthenticated) {
      setWriteOpen(true);
    } else {
      // Signal the global auth modal to open (Navbar listens for this event)
      window.dispatchEvent(new Event('auth:required'));
    }
  };

  const handleSubmitted = (review) => {
    setWriteOpen(false);
    // Force a reload of reviews (reset to first page and bump refresh key)
    setPage(0);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">Guest reviews</h2>
          <p className="mt-1 text-sm text-[#6B7280]">What guests said about their stay.</p>
        </div>

        <div className="flex items-center gap-3">
          {!loading && !error ? <AverageRating averageRating={averageRating} totalElements={totalElements} /> : null}
          {/* Write / Login CTA */}
          <button
            type="button"
            onClick={handleWriteClick}
            className="rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]"
          >
            {isAuthenticated ? 'Write a review' : 'Log in to write a review'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => <div key={key} className="h-24 animate-pulse rounded-[24px] bg-slate-100" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center rounded-[24px] border border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center">
          <AlertCircle className="mb-2 h-6 w-6 text-[#9B1E1E]" />
          <p className="text-sm text-[#9B1E1E]">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center text-sm text-[#6B7280]">
          <p>No reviews yet for this branch.</p>
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={handleWriteClick}
              className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]"
            >
              {isAuthenticated ? 'Be the first to write a review' : 'Log in to write a review'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-slate-600 transition hover:border-[#0A7C6E] hover:text-[#0A7C6E] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-[#6B7280]">Page {page + 1} of {totalPages}</span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-slate-600 transition hover:border-[#0A7C6E] hover:text-[#0A7C6E] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </>
      )}

      {writeOpen ? (
        <ReviewForm branchId={branchId} onClose={() => setWriteOpen(false)} onSubmitted={handleSubmitted} />
      ) : null}
    </div>
  );
};

export default ReviewList;
