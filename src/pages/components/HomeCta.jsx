import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomeCta = () => (
  <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
    <div className="relative overflow-hidden rounded-[32px] px-6 py-16 text-center sm:px-12 sm:py-20">
      <img
        src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark scrim first for text legibility, then a very light brand-teal wash on top —
          not a solid teal card anymore. */}
      <div className="absolute inset-0 bg-slate-950/60" />
      <div className="absolute inset-0 bg-[#0A7C6E]/15" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_55%)]" />

      <div className="relative">
        <h2 className="font-[Playfair_Display] text-3xl font-semibold text-white sm:text-4xl">Ready to find your perfect stay?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
          Search rooms across our hotel network, compare prices in your currency, and book in minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-slate-50"
          >
            Search rooms
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/hotels"
            className="rounded-full border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Explore hotels
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default HomeCta;
