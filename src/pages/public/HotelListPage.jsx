import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import HotelCard from '../../components/hotel/HotelCard';
import hotelApi from '../../api/hotelApi';
import Footer from '../../components/core/Footer';

const HotelListPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHotels = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await hotelApi.getAllHotels();
      setHotels(data.items || []);
    } catch (err) {
      setError(err.message || 'We could not load the hotels right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] px-6 py-8 shadow-sm sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex rounded-full bg-[#E6F5F3] px-3 py-1 text-sm font-medium text-[#0A7C6E]">
                Curated stays
              </p>
              <h1 className="font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E] sm:text-4xl">
                Explore Our Hotels
              </h1>
              <p className="mt-3 text-base leading-7 text-[#6B7280]">
                Four world-class hotel chains across Asia and Europe, each offering premium stays and memorable experiences.
              </p>
            </div>

            <div className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2 text-sm font-medium text-[#0A7C6E]">
              {loading ? 'Loading hotels...' : `${hotels.length} ${hotels.length === 1 ? 'hotel' : 'hotels'}`}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm">
                <div className="h-40 animate-pulse bg-[#E5E7EB]" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="h-10 animate-pulse rounded-2xl bg-[#E6F5F3]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFFFF] px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F5F3] text-[#0A7C6E]">
              <RefreshCw size={24} />
            </div>
            <h2 className="mt-4 font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">
              We could not load the hotels
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6B7280]">
              {error}
            </p>
            <button
              type="button"
              onClick={loadHotels}
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52]"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : hotels.length === 0 ? (
          <div className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFFFF] px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">No hotels are available right now.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {hotels.map((hotel, index) => (
              <HotelCard key={hotel?.id ?? hotel?.name ?? `hotel-${index}`} hotel={hotel} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HotelListPage;
