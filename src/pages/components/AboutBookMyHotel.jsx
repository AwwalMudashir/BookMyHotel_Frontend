import { useEffect, useState } from 'react';
import { Landmark, MapPinned, ShieldCheck } from 'lucide-react';
import hotelApi from '../../api/hotelApi';

const AboutBookMyHotel = () => {
  const [hotelCount, setHotelCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    hotelApi
      .getAllHotels(1, 100)
      .then((data) => {
        if (!cancelled) setHotelCount(data.totalElements ?? data.items?.length ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { icon: Landmark, value: hotelCount != null ? `${hotelCount}` : '4', label: 'Hotel chains' },
    { icon: MapPinned, value: 'Asia & Europe', label: 'Where we operate' },
    { icon: ShieldCheck, value: 'Dubai, UAE', label: 'Headquartered in' },
  ];

  return (
    <section className="overflow-hidden bg-[#1A2744]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8FD9CC]">About BookMyHotel</p>
          <h2 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-white sm:text-4xl">
            One platform, four world-class hotel chains
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
            BookMyHotel is headquartered in Dubai and brings together reservations for Marriott, Hilton, Hyatt, and
            Four Seasons properties across Asia and Europe — one search, one checkout, one place to manage every stay,
            no matter which of our partner hotels you choose.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#8FD9CC]">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-[Playfair_Display] text-xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-white/50">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutBookMyHotel;
