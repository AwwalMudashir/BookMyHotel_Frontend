import { Star } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ReviewCard = ({ review }) => {
  const initial = (review?.reviewerName || review?.name || review?.author || 'G').charAt(0).toUpperCase();
  const rating = Number(review?.rating ?? 0) || 0;

  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6F5F3] text-sm font-semibold text-[#0A7C6E]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1A1A2E]">{review?.reviewerName || review?.name || review?.author || 'Guest'}</p>
              <div className="mt-1 flex items-center gap-1 text-[#C9A84C]">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={14} fill={index < Math.round(rating) ? '#C9A84C' : 'transparent'} className={index < Math.round(rating) ? 'text-[#C9A84C]' : 'text-[#E5E7EB]'} />
                ))}
              </div>
            </div>
            {review?.createdAt ? <p className="text-sm text-[#6B7280]">{formatDate(review.createdAt)}</p> : null}
          </div>
          <p className="mt-3 text-sm leading-7 text-[#6B7280]">{review?.comment || review?.message || 'A thoughtful review from a guest.'}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
