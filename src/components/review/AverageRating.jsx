import { Star } from 'lucide-react';

// Purpose: Displays average review score and review count. Both values must come straight
// from GET /branches/{branchId}/reviews (averageRating, totalElements) — never derived from
// whatever single page of reviews happens to be loaded.
const AverageRating = ({ averageRating = 0, totalElements = 0 }) => {
  const rating = Number(averageRating) || 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-[#C9A84C]">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={18}
            fill={index < Math.round(rating) ? '#C9A84C' : 'transparent'}
            className={index < Math.round(rating) ? 'text-[#C9A84C]' : 'text-[#E5E7EB]'}
          />
        ))}
      </div>
      <span className="text-lg font-semibold text-[#1A1A2E]">{rating.toFixed(1)}</span>
      <span className="text-sm text-[#6B7280]">
        {totalElements > 0 ? `· ${totalElements} review${totalElements === 1 ? '' : 's'}` : '· No reviews yet'}
      </span>
    </div>
  );
};

export default AverageRating;
