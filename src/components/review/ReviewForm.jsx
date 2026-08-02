import { useState } from 'react';
import { Loader2, Star, X } from 'lucide-react';
import reviewApi from '../../api/reviewApi';
import { parseApiError } from '../../utils/parseApiError';

// Purpose: Review submission form for confirmed guests — a modal opened from a specific
// completed booking, never a free-floating action. `branchId` comes from that booking's room.
const ReviewForm = ({ branchId, branchName, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const review = await reviewApi.submitReview({
        branchId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted(review);
    } catch (err) {
      // Both come back as JSON { status, message } per the backend contract — parseApiError
      // already extracts message, we just override the copy for these two known cases.
      if (err?.response?.status === 409) {
        setError("You've already reviewed this stay.");
      } else if (err?.response?.status === 403) {
        setError('You can only review a branch after your stay is complete.');
      } else {
        setError(parseApiError(err, 'Unable to submit your review.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A2E]">Rate your stay</h2>
            {branchName ? <p className="mt-1 text-sm text-[#6B7280]">{branchName}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Your rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="cursor-pointer p-0.5"
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                >
                  <Star
                    className={`h-7 w-7 transition ${
                      value <= (hoverRating || rating) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'fill-transparent text-[#E5E7EB]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="What stood out about your stay?"
              className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            />
          </div>

          {error ? <p className="text-sm font-medium text-[#9B1E1E]">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit review
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 cursor-pointer rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
