import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2, CalendarDays, ChevronRight, Loader2, MapPin, Search, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import searchApi from '../../api/searchApi';
import { amenityMeta } from '../../utils/amenities';
import { useCurrency } from '../../hooks/useCurrency';

const desktopSlides = [
  {
    title: 'Stay where comfort meets design.',
    description: 'Discover curated hotels with exceptional service, eco-friendly stays, and premium experiences.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Book memorable escapes in seconds.',
    description: 'Search, compare, and reserve the perfect room for your next city break or retreat.',
    image: '/hero1.jpg',
  },
  {
    title: 'Experience stays that feel personal.',
    description: 'From rooftop suites to serene villas, every reservation is styled around your journey.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Every trip deserves a thoughtful start.',
    description: 'Enjoy seamless booking, flexible pricing, and award-worthy hospitality all in one place.',
    image: '/hero2.jpg',
  },
  {
    title: 'Make every stay unforgettable.',
    description: 'Reserve beautifully designed rooms and add services that make your stay feel effortless.',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80',
  },
];

const mobileSlides = [
  {
    title: 'Stay where comfort meets design.',
    description: 'Discover curated hotels with exceptional service, eco-friendly stays, and premium experiences.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Book memorable escapes in seconds.',
    description: 'Search, compare, and reserve the perfect room for your next city break or retreat.',
    image: '/hero3.jpg',
  },
  {
    title: 'Experience stays that feel personal.',
    description: 'From rooftop suites to serene villas, every reservation is styled around your journey.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Every trip deserves a thoughtful start.',
    description: 'Enjoy seamless booking, flexible pricing, and award-worthy hospitality all in one place.',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Make every stay unforgettable.',
    description: 'Reserve beautifully designed rooms and add services that make your stay feel effortless.',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80',
  },
];

const todayString = format(new Date(), 'yyyy-MM-dd');

const HomeHero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { format: formatPrice } = useCurrency();

  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [activeAmenities, setActiveAmenities] = useState(() => new Set());

  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchBoxRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    const interval = window.setInterval(() => {
      const slides = isMobile ? mobileSlides : desktopSlides;
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearInterval(interval);
    };
  }, [isMobile]);

  const slides = isMobile ? mobileSlides : desktopSlides;
  const activeSlide = slides[activeIndex];

  const runSearch = async (amenitiesSet = activeAmenities) => {
    setSearching(true);
    setHasSearched(true);
    setShowDropdown(true);
    try {
      const params = { page: 0, size: amenitiesSet.size > 0 ? 50 : 8 };
      if (location.trim()) params.city = location.trim();
      if (checkIn) params.checkIn = checkIn;
      if (checkOut) params.checkOut = checkOut;
      const response = await searchApi.searchRooms(params);
      setResults(response.content || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Quick-search as you type/pick dates — debounced so we're not hammering the API on every keystroke.
  useEffect(() => {
    if (!location.trim() && !checkIn && !checkOut) return undefined;
    const timer = window.setTimeout(() => {
      runSearch();
    }, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, checkIn, checkOut]);

  // Close the results panel on outside click or Escape.
  useEffect(() => {
    if (!showDropdown) return undefined;
    const handleClick = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) setShowDropdown(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  const toggleAmenity = (key) => {
    const next = new Set(activeAmenities);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setActiveAmenities(next);

    if (!hasSearched) {
      runSearch(next);
    } else {
      setShowDropdown(true);
    }
  };

  // The search endpoint has no amenities filter of its own, so this refines whatever page of
  // results we already fetched — that's also why runSearch asks for a bigger page (50) once any
  // amenity filter is active, to give client-side filtering a real chance of finding matches.
  const filteredResults = activeAmenities.size === 0
    ? results
    : results.filter((room) => [...activeAmenities].every((key) => room.amenities?.[key]));

  const searchHref = () => {
    const params = new URLSearchParams();
    if (location.trim()) params.set('city', location.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    const query = params.toString();
    return `/search${query ? `?${query}` : ''}`;
  };

  const checkOutMin = checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : todayString;

  return (
    <>
      <section className="top-0 relative flex h-[70vh] min-h-125 w-full items-center overflow-hidden bg-slate-900 px-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <img
              key={slide.title}
              src={slide.image}
              alt={slide.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === activeIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/80 via-slate-950/45 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto -mt-5 flex w-full max-w-7xl items-center justify-start pt-16 sm:pt-20 lg:pt-24">
          <div className="max-w-2xl text-left text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:text-sm">
              <Sparkles size={13} />
              Premium stays, seamless booking
            </div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {activeSlide.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base lg:text-lg">
              {activeSlide.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                to="/hotels"
                className="inline-flex items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A7C6E]/90 sm:px-5"
              >
                Explore hotels
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/search"
                className="rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-5"
              >
                Search rooms
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-4 -mt-8 sm:mx-8 lg:mx-16" ref={searchBoxRef}>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="grid gap-0 md:grid-cols-[1.15fr_0.9fr_0.9fr_auto]">
            <div className="flex items-center gap-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A7C6E]/10 text-[#0A7C6E]">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="hero-location" className="block text-sm font-semibold text-slate-900">Location</label>
                <input
                  id="hero-location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  onFocus={() => { if (hasSearched) setShowDropdown(true); }}
                  placeholder="City, country, or hotel"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A7C6E]/10 text-[#0A7C6E]">
                <CalendarDays size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="hero-checkin" className="block text-sm font-semibold text-slate-900">Check-in</label>
                <input
                  id="hero-checkin"
                  type="date"
                  value={checkIn}
                  min={todayString}
                  onChange={(event) => {
                    setCheckIn(event.target.value);
                    if (checkOut && event.target.value >= checkOut) setCheckOut('');
                  }}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A7C6E]/10 text-[#0A7C6E]">
                <CalendarDays size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="hero-checkout" className="block text-sm font-semibold text-slate-900">Check-out</label>
                <input
                  id="hero-checkout"
                  type="date"
                  value={checkOut}
                  min={checkOutMin}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-center bg-[#0A7C6E] p-4">
              <button
                type="button"
                onClick={() => runSearch()}
                className="flex items-center cursor-pointer gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-slate-50"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search rooms
              </button>
            </div>
          </div>
        </div>

        {showDropdown ? (
          <div className="absolute inset-x-0 top-full z-30 mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-900">
                {searching ? 'Searching…' : `${filteredResults.length} room${filteredResults.length === 1 ? '' : 's'} found`}
              </p>
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close results"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {searching ? (
                <div className="space-y-1 p-3">
                  {[0, 1, 2].map((key) => <div key={key} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No rooms match your search. Try a different location or fewer filters.
                </div>
              ) : (
                filteredResults.map((room) => (
                  <Link
                    key={room.roomId}
                    to={`/rooms/${room.roomId}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-[#F8F9FA] last:border-b-0"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#E6F5F3] to-[#DDEEFF]">
                      <Building2 className="h-6 w-6 text-[#0A7C6E]/50" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1A1A2E]">{room.hotelName}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                        <span className="truncate">{room.roomType}</span>
                        <span className="shrink-0 text-slate-300">·</span>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{room.branchCity}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[#0A7C6E]">{formatPrice(room.pricePerNight, room.currency)}</p>
                      <p className="text-[11px] text-slate-400">/ night</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </Link>
                ))
              )}
            </div>

            {!searching && filteredResults.length > 0 ? (
              <Link
                to={searchHref()}
                onClick={() => setShowDropdown(false)}
                className="flex items-center justify-center gap-1.5 border-t border-slate-100 bg-[#F8F9FA] px-4 py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]"
              >
                See all results
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mx-4 mt-5 flex flex-wrap gap-2 pb-8 sm:mx-8 lg:mx-16 lg:mt-6">
        {Object.entries(amenityMeta).map(([key, { label, icon: Icon }]) => {
          const active = activeAmenities.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleAmenity(key)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-[#0A7C6E] bg-[#0A7C6E] text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-[#0A7C6E] hover:text-[#0A7C6E]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default HomeHero;
