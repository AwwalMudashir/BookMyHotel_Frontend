import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchResultCard from '../../components/search/SearchResultCard';
import searchApi from '../../api/searchApi';

const PopularRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Note: the backend's `rating_desc` sort currently 500s — price_asc is the reliable
        // option, so this section leads with well-priced picks rather than claiming "top rated".
        const data = await searchApi.searchRooms({ page: 0, size: 6, sort: 'price_asc' });
        if (!cancelled) setRooms(data.content || []);
      } catch {
        if (!cancelled) setRooms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!loading && rooms.length === 0) return null;

  return (
    <section className="bg-[#F8F9FA] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">Great value</p>
            <h2 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E] sm:text-4xl">Popular rooms right now</h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A7C6E] transition hover:text-[#065E52]"
          >
            Browse all rooms
            <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white shadow-sm">
                <div className="h-48 animate-pulse bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <SearchResultCard key={room.roomId} room={room} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularRooms;
