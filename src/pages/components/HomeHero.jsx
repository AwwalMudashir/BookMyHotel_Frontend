import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const HomeHero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

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

  const chips = ['Eco-certified', '5-Star', 'Free cancellation', 'Spa', 'Business-friendly'];

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

      <div className="relative z-20 mx-4 -mt-8 sm:mx-8 lg:mx-16">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="grid gap-0 md:grid-cols-[1.15fr_0.9fr_0.9fr_auto]">
            <div className="flex items-center gap-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A7C6E]/10 text-[#0A7C6E]">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Location</p>
                <p className="text-sm text-slate-500">City, country, or hotel</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A7C6E]/10 text-[#0A7C6E]">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Check-in</p>
                <p className="text-sm text-slate-500">Select date</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A7C6E]/10 text-[#0A7C6E]">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Check-out</p>
                <p className="text-sm text-slate-500">Select date</p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-[#0A7C6E] p-4">
              <button className="flex items-center cursor-pointer gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-slate-50">
                <Search size={16} />
                Search rooms
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-5 flex flex-wrap gap-2 pb-8 sm:mx-8 lg:mx-16 lg:mt-6">
        {chips.map((chip) => (
          <span
            key={chip}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-[#0A7C6E] hover:text-[#0A7C6E]"
          >
            {chip}
          </span>
        ))}
      </div>
    </>
  );
};

export default HomeHero;
