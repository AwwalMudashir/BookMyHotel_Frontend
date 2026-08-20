import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Sparkles, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import hotelApi from '../../api/hotelApi';
import promotionApi from '../../api/promotionApi';

const FALLBACK_IMAGE = '/images/promo-hotel-fallback.png';

const copyTemplates = [
  ({ destination, discount, stayWindow }) => ({
    eyebrow: 'A stay worth celebrating',
    title: `Get ${discount} at ${destination}`,
    description: `Plan a little more time away and enjoy the offer ${stayWindow}.`,
  }),
  ({ destination, discount, stayWindow }) => ({
    eyebrow: 'Your next escape, for less',
    title: `${destination} is calling`,
    description: `Enjoy ${discount} on your next visit ${stayWindow}.`,
  }),
  ({ destination, discount, stayWindow }) => ({
    eyebrow: 'Limited-time hotel offer',
    title: 'More moments. Less on the bill.',
    description: `Unlock ${discount} at ${destination} for stays ${stayWindow}.`,
  }),
  ({ destination, discount, stayWindow }) => ({
    eyebrow: 'Make room for something special',
    title: `Stay beautifully at ${destination}`,
    description: `Book with this offer and receive ${discount} ${stayWindow}.`,
  }),
];

const formatDate = (value, includeYear = false) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(date);
};

const formatStayWindow = (validFrom, validTo) => {
  if (validFrom && validTo) return `from ${formatDate(validFrom)} to ${formatDate(validTo, true)}`;
  if (validFrom) return `from ${formatDate(validFrom, true)}`;
  if (validTo) return `until ${formatDate(validTo, true)}`;
  return 'on selected dates';
};

const formatFixedDiscount = (value, currency) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} off`;
  if (!currency) return `${amount.toLocaleString('en-GB')} off`;

  try {
    return `${new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)} off`;
  } catch {
    return `${amount.toLocaleString('en-GB')} ${currency} off`;
  }
};

const formatDiscount = (promotion) => {
  if (promotion.discountType === 'PERCENTAGE') {
    return `${Number(promotion.discountValue).toLocaleString('en-GB')}% off`;
  }
  return formatFixedDiscount(promotion.discountValue, 'USD');
};

const getDestination = (promotion, branch) => {
  if (!branch) return promotion.hotelName || 'your chosen hotel';

  const hotelName = promotion.hotelName || '';
  const branchName = branch.name?.trim();
  if (branchName && branchName.toLowerCase().includes(hotelName.toLowerCase())) return branchName;
  if (branch.city) return `${hotelName} ${branch.city}`.trim();
  return [hotelName, branchName].filter(Boolean).join(' ') || 'your chosen hotel';
};

const enrichPromotions = async (promotions) => {
  const hotelIds = [...new Set(promotions.map((promotion) => promotion.hotelId).filter(Boolean))];
  const branchResults = await Promise.all(
    hotelIds.map(async (hotelId) => {
      try {
        return [hotelId, await hotelApi.getHotelBranches(hotelId)];
      } catch {
        return [hotelId, []];
      }
    }),
  );
  const branchesByHotel = new Map(branchResults);

  return promotions.map((promotion) => {
    const branches = branchesByHotel.get(promotion.hotelId) || [];
    const branch = branches.length > 0 ? branches[Math.floor(Math.random() * branches.length)] : null;
    const template = copyTemplates[Math.floor(Math.random() * copyTemplates.length)];
    const destination = getDestination(promotion, branch);
    const offerCopy = template({
      destination,
      discount: formatDiscount(promotion),
      stayWindow: formatStayWindow(promotion.validFrom, promotion.validTo),
    });

    return { ...promotion, branch, destination, offerCopy };
  });
};

const HomePromotionsCarousel = () => {
  const [promotions, setPromotions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPromotions = async () => {
      try {
        const activePromotions = await promotionApi.getGlobalActivePromotions();
        const enrichedPromotions = await enrichPromotions(activePromotions);
        if (!cancelled) setPromotions(enrichedPromotions);
      } catch {
        if (!cancelled) setPromotions([]);
      }
    };

    loadPromotions();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (promotions.length < 2 || isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promotions.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [isPaused, promotions.length]);

  if (promotions.length === 0) return null;

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + promotions.length) % promotions.length);
  };
  const showNext = () => {
    setActiveIndex((current) => (current + 1) % promotions.length);
  };

  return (
    <section
      className="w-full px-4 pb-8 pt-14 sm:px-8 sm:pt-16 lg:px-8"
      aria-label="Featured hotel offers"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') showPrevious();
        if (event.key === 'ArrowRight') showNext();
      }}
    >
      <div className="mb-5 flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0A7C6E]">
            <Sparkles size={15} aria-hidden="true" />
            Curated for your next stay
          </div>
          <h2 className="mt-2 font-[Playfair_Display] text-2xl font-semibold text-slate-950 sm:text-3xl">
            Offers worth checking in for
          </h2>
        </div>

        {promotions.length > 1 ? (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={showPrevious}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-[#0A7C6E] hover:text-[#0A7C6E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A7C6E]"
              aria-label="Previous promotion"
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-[#0A7C6E] hover:text-[#0A7C6E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A7C6E]"
              aria-label="Next promotion"
            >
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative h-105 w-full overflow-hidden rounded-4xl bg-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:h-110 lg:h-120">
        {promotions.map((promotion, index) => {
          const isActive = index === activeIndex;
          const location = [promotion.branch?.city, promotion.branch?.country].filter(Boolean).join(', ');

          return (
            <article
              key={promotion.id ?? `${promotion.hotelId}-${promotion.code}`}
              className={`absolute inset-0 transition duration-700 motion-reduce:transition-none ${
                isActive ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-[1.015] opacity-0'
              }`}
              aria-hidden={!isActive}
              aria-label={`Promotion ${index + 1} of ${promotions.length}`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[6500ms] ease-linear motion-reduce:transition-none"
                style={{
                  backgroundImage: promotion.hotelLongImage
                    ? `url("${promotion.hotelLongImage}"), url("${FALLBACK_IMAGE}")`
                    : `url("${FALLBACK_IMAGE}")`,
                  transform: isActive ? 'scale(1.035)' : 'scale(1)',
                }}
              />
              <div className="absolute inset-0 bg-slate-950/25" />
              <div className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-950/70 to-slate-950/5" />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/50 via-transparent to-transparent" />

              <div className="relative z-10 flex h-full max-w-3xl flex-col justify-center px-6 py-12 text-white sm:px-10 lg:px-14">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  <Sparkles size={14} aria-hidden="true" />
                  {promotion.offerCopy.eyebrow}
                </p>
                <h3 className="mt-4 max-w-2xl font-[Playfair_Display] text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                  {promotion.offerCopy.title}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                  {promotion.offerCopy.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-200 sm:text-sm">
                  {location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-emerald-300" aria-hidden="true" />
                      {location}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-emerald-300" aria-hidden="true" />
                    {formatStayWindow(promotion.validFrom, promotion.validTo)}
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/hotels/${promotion.hotelId}${promotion.branch?.id ? `?branchId=${promotion.branch.id}` : ''}`}
                    tabIndex={isActive ? 0 : -1}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-[#08685d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    View this stay
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  {promotion.code ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur-md">
                      <Tag size={14} className="text-emerald-300" aria-hidden="true" />
                      Use <strong className="tracking-wide">{promotion.code}</strong>
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {promotions.length > 1 ? (
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 sm:bottom-7 sm:right-7">
            {promotions.map((promotion, index) => (
              <button
                key={promotion.id ?? index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 cursor-pointer rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
                }`}
                aria-label={`Show promotion ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default HomePromotionsCarousel;
