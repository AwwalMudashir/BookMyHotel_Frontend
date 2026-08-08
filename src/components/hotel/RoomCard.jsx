import { Link } from 'react-router-dom';
import { Building2, MapPin, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import RoomTagBadges from './RoomTagBadges';
import { listAmenities } from '../../utils/amenities';

const RoomCard = ({ room }) => {
  const { format } = useCurrency();
  const images = Array.isArray(room?.images) ? room.images : [];
  const amenities = listAmenities(room?.amenities || []);
  const visibleAmenities = amenities.slice(0, 3);
  const moreCount = amenities.length > 3 ? amenities.length - 3 : 0;

  // Price prefers explicit pricePerNight if present, fall back to price
  const priceValue = typeof room?.pricePerNight === 'number' ? room.pricePerNight : (typeof room?.price === 'number' ? room.price : null);
  const currency = room?.currency || room?.currencyCode || 'GBP';

  // Prefer the new public-facing room.roomId (random identifier). Do not use Cloudinary publicIds here.
  const roomLink = `/rooms/${room?.roomId ?? room?.id ?? room?.roomID}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#0A7C6E]/30 hover:shadow-lg">
      <div className="relative h-44 shrink-0 overflow-hidden rounded-t-[16px]">
        {images.length > 0 ? (
          <img src={images[0]} alt={room?.roomTypeName || room?.type || room?.roomType} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#E6F5F3] to-[#DDEEFF]">
            <Building2 className="h-10 w-10 text-[#0A7C6E]/40" />
          </div>
        )}

        {room?.tags?.length > 0 ? <RoomTagBadges tags={room.tags} className="absolute right-3 top-3 flex-col items-end" /> : null}

        <span className="absolute left-3 bottom-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          {room?.roomTypeName || room?.type || room?.roomType}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">{room?.roomTypeName || room?.type || room?.roomType}</h3>
          {room?.branchName ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-[#6B7280]"><MapPin className="h-4 w-4 text-[#0A7C6E]" /> <span className="truncate">{room.branchName}</span></div>
          ) : null}

          {room?.description ? (
            <p className="mt-2 text-sm leading-6 text-[#6B7280] line-clamp-3">{room.description}</p>
          ) : null}
        </div>

        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleAmenities.map(({ label, icon: Icon }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F3] px-3 py-1 text-xs font-semibold text-[#0A7C6E]">
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {label}
              </span>
            ))}
            {moreCount > 0 ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">+{moreCount} more</span> : null}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 border-t border-[#F1F2F4] pt-3">
          <div className="flex flex-col gap-4">
            <div>
              {priceValue != null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-[#0A7C6E]">{format(priceValue, currency)}</span>
                  <span className="text-sm text-[#6B7280]">/ night</span>
                </div>
              ) : (
                // Do not show 'Contact us' or any contact button when price is not numeric
                <div className="text-sm text-[#6B7280]">&nbsp;</div>
              )}
            </div>

            <Link
              to={roomLink}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#065E52] hover:shadow-lg"
            >
              Book this room
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default RoomCard;
