import { Building2, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listAmenities } from '../../utils/amenities';
import { useCurrency } from '../../hooks/useCurrency';
import RoomTagBadges from '../hotel/RoomTagBadges';

// Shaped against the backend's RoomSearchResult: { roomId, hotelName, branchCity, roomType,
// pricePerNight, totalPrice, currency (ISO-4217), amenities, available } — no images/occupancy/country.
const SearchResultCard = ({ room, checkIn, checkOut }) => {
  const { format } = useCurrency();
  const amenities = listAmenities(room.amenities);
  const visibleAmenities = amenities.slice(0, 3);
  const moreCount = amenities.length > 3 ? amenities.length - 3 : 0;
  const nights = checkIn && checkOut ? Math.max(new Date(checkOut).getTime() - new Date(checkIn).getTime(), 0) / (1000 * 60 * 60 * 24) : 0;
  // Prefer the backend's own totalPrice (it accounts for variable daily rates) over a flat multiply.
  const totalPrice = typeof room.totalPrice === 'number' ? room.totalPrice : (room.pricePerNight && nights > 0 ? room.pricePerNight * nights : null);
  const available = room.available !== false;

  // Use room.roomId for the public-facing room identifier (random string).
  // Do not use cloudinary public IDs (they live in images/publicIds).
  const roomLink = `/rooms/${room?.roomId ?? room?.id ?? room?.roomID}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#0A7C6E]/30 hover:shadow-lg">
      <div className="relative h-48 shrink-0 overflow-hidden">
        {room.images && room.images.length > 0 ? (
          <img
            src={room.images[0]}
            alt={room.roomType}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#E6F5F3] to-[#DDEEFF]">
            <Building2 className="h-12 w-12 text-[#0A7C6E]/40" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

        {/* <span
          className={`absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur-sm ${
            available ? 'bg-white/90 text-[#1D6A2D]' : 'bg-white/90 text-[#9B1E1E]'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-[#1D6A2D]' : 'bg-[#9B1E1E]'}`} />
          {available ? 'Available' : 'Unavailable'}
        </span> */}

        {room.tags?.length > 0 ? (
          <RoomTagBadges tags={room.tags} className="absolute right-4 top-4 flex-col items-end" />
        ) : null}

        <span className="absolute bottom-4 left-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          {room.roomType}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">{room.hotelName?.toUpperCase()}</p>
          <h3 className="mt-1.5 font-[Playfair_Display] text-xl font-semibold leading-tight text-[#1A1A2E]">{room.roomType}</h3>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <MapPin className="h-4 w-4 shrink-0 text-[#0A7C6E]" />
          <span className="truncate">{room.branchCity}</span>
        </div>

        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleAmenities.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F3] px-3 py-1 text-xs font-semibold text-[#0A7C6E]"
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {label}
              </span>
            ))}
            {moreCount > 0 ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">+{moreCount} more</span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-4 border-t border-[#F1F2F4] pt-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-[#0A7C6E]">{format(room.pricePerNight, room.currency)}</span>
                <span className="text-sm text-[#6B7280]">/ night</span>
              </div>
              {totalPrice && nights > 0 ? (
                <div className="mt-1 text-xs text-slate-500">{format(totalPrice, room.currency)} total for {nights} night{nights === 1 ? '' : 's'}</div>
              ) : null}
            </div>
          </div>

          <Link
            to={roomLink}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] ${
              available ? '' : 'pointer-events-none opacity-60'
            }`}
          >
            Book this room
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default SearchResultCard;
