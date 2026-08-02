import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import HotelCard from '../../components/hotel/HotelCard';
import hotelApi from '../../api/hotelApi';

const FeaturedHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await hotelApi.getAllHotels(1, 4);
        if (!cancelled) setHotels(data.items || []);
      } catch {
        if (!cancelled) setHotels([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!loading && hotels.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">Featured hotel chains</p>
          <h2 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E] sm:text-4xl">Stay with names you trust</h2>
        </div>
        <Link
          to="/hotels"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A7C6E] transition hover:text-[#065E52]"
        >
          View all hotels
          <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white shadow-sm">
              <div className="h-40 animate-pulse bg-slate-100" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {hotels.map((hotel) => (
            <HotelCard key={hotel?.id ?? hotel?.name} hotel={hotel} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedHotels;
