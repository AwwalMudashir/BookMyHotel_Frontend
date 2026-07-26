import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Star, Tag } from 'lucide-react';

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    return `£${value}`;
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return `£${numericValue}`;
  }

  return value;
};

const getCheapestRoomPrice = (hotel) => {
  const candidates = [];

  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (!value || typeof value !== 'object') {
      return;
    }

    if (typeof value.price === 'number') candidates.push(value.price);
    if (typeof value.roomPrice === 'number') candidates.push(value.roomPrice);
    if (typeof value.amount === 'number') candidates.push(value.amount);
    if (typeof value.rate === 'number') candidates.push(value.rate);

    if (Array.isArray(value.rooms)) {
      value.rooms.forEach(visit);
    }

    if (Array.isArray(value.branches)) {
      value.branches.forEach(visit);
    }
  };

  visit(hotel?.rooms);
  visit(hotel?.branches);

  if (candidates.length === 0) {
    return null;
  }

  return Math.min(...candidates);
};

const HotelCard = ({ hotel }) => {
  const navigate = useNavigate();
  const hotelId = hotel?.id ?? hotel?.hotelId ?? hotel?.hotelID ?? hotel?.hotel_id ?? hotel?.slug ?? '';
  const imageUrl = hotel?.logoUrl || (Array.isArray(hotel?.images) ? hotel.images.find(Boolean) : hotel?.image ?? '');
  const branchCount = Array.isArray(hotel?.branches) ? hotel.branches.length : 0;
  const price = getCheapestRoomPrice(hotel);
  const rating = Number(hotel?.starRating ?? hotel?.rating ?? 0) || 0;
  const branchLabel = branchCount > 0 ? `${branchCount} ${branchCount === 1 ? 'branch' : 'branches'} across Asia & Europe` : 'Branches available';

  const handleNavigate = () => {
    if (hotelId) {
      navigate(`/hotels/${hotelId}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleNavigate();
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-40 overflow-hidden bg-[#E6F5F3]">
        {imageUrl ? (
          <img src={imageUrl} alt={hotel?.name || 'Hotel'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 size={36} className="text-[#0A7C6E]" />
          </div>
        )}
      </div>

      <div className="h-1 w-full bg-[#0A7C6E]" />

      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">
            {hotel?.name || 'Luxury Hotel'}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
            <div className="flex items-center gap-1 text-[#C9A84C]">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={14}
                  fill={index < Math.round(rating) ? '#C9A84C' : 'transparent'}
                  className={index < Math.round(rating) ? 'text-[#C9A84C]' : 'text-[#E5E7EB]'}
                />
              ))}
            </div>
            <span className="font-medium text-[#1A1A2E]">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <MapPin size={16} className="text-[#0A7C6E]" />
          <span>{branchLabel}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Tag size={16} className="text-[#0A7C6E]" />
          <span>{price ? `from ${formatCurrency(price)} / night` : 'View rooms for pricing'}</span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleNavigate();
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52]"
        >
          Explore Hotel
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default HotelCard;
