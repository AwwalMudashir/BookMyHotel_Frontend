import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import RoomTagBadges from './RoomTagBadges';

const RoomCard = ({ room }) => {
  const navigate = useNavigate();
  const { format } = useCurrency();
  const amenities = Array.isArray(room?.amenities) ? room.amenities : [];
  const visibleAmenities = amenities.slice(0, 4);
  const extraAmenities = amenities.length - visibleAmenities.length;

  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#1A1A2E]">{room?.type || room?.roomType || 'Deluxe Room'}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6B7280] line-clamp-2">{room?.description || 'Comfortable accommodation with thoughtful amenities.'}</p>
        </div>
      </div>

      {room?.tags?.length > 0 ? <RoomTagBadges tags={room.tags} className="mt-3" /> : null}

      <div className="mt-4 flex items-center gap-2 text-sm text-[#6B7280]">
        <Users size={16} className="text-[#0A7C6E]" />
        <span>Max occupancy {room?.maxOccupancy ?? room?.occupancy ?? 2}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {visibleAmenities.map((amenity, index) => (
          <span key={`${amenity}-${index}`} className="rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1 text-xs font-medium text-[#6B7280]">
            {amenity}
          </span>
        ))}
        {extraAmenities > 0 ? <span className="rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1 text-xs font-medium text-[#6B7280]">+{extraAmenities} more</span> : null}
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-[#0A7C6E]">
            {typeof room?.price === 'number' ? format(room.price, room?.currencyCode || room?.currency) : 'Contact us'}
          </p>
          <p className="text-sm text-[#6B7280]">/ night</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/rooms/${room?.id ?? room?.roomId ?? room?.roomID}`)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065E52]"
        >
          Book this room
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
