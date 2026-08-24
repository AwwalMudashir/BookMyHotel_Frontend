import { useEffect, useState } from 'react';
import { ArrowRight, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import packageApi from '../../api/packageApi';
import PublicPackageCard from '../../components/package/PublicPackageCard';

const HomePackagesSection = () => {
  const [packages, setPackages] = useState([]);
  useEffect(() => { let cancelled = false; packageApi.getFeatured().then((items) => { if (!cancelled) setPackages(items.slice(0, 3)); }).catch(() => {}); return () => { cancelled = true; }; }, []);
  if (packages.length === 0) return null;
  return <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0A7C6E]"><Leaf size={15} />Travel beyond the busiest dates</p><h2 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-slate-950">Off-season escapes</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Stay a little differently, enjoy quieter destinations and unlock packages created for lower-demand travel periods.</p></div><Link to="/packages" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7C6E]">View every package <ArrowRight size={16} /></Link></div><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{packages.map((offer) => <PublicPackageCard key={offer.id} offer={offer} compact />)}</div></section>;
};
export default HomePackagesSection;
