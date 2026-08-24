import { useEffect, useMemo, useState } from 'react';
import { Gift, Search } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import Footer from '../../components/core/Footer';
import Spinner from '../../components/core/Spinner';
import PublicPackageCard from '../../components/package/PublicPackageCard';
import packageApi from '../../api/packageApi';

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  useEffect(() => { let cancelled = false; packageApi.getActive().then((items) => { if (!cancelled) setPackages(items); }).catch(() => { if (!cancelled) setPackages([]); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);
  const visible = useMemo(() => { const value = query.trim().toLowerCase(); return value ? packages.filter((offer) => [offer.name, offer.hotelName, offer.branchName, offer.summary, offer.code].filter(Boolean).some((item) => item.toLowerCase().includes(value))) : packages; }, [packages, query]);
  return <div className="min-h-screen bg-slate-50"><Navbar /><header className="bg-gradient-to-br from-[#071A2E] via-[#0B3B43] to-[#0A7C6E] px-4 pb-20 pt-28 text-white sm:px-6"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Off-Season Travel packages</p><h1 className="mt-4 max-w-3xl font-[Playfair_Display] text-4xl font-semibold leading-tight sm:text-5xl">More value in the quieter season</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">Discover packages designed around selected travel windows, minimum stays and useful inclusions, not only a generic discount code.</p><label className="relative mt-7 block max-w-xl"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search packages, hotels or destinations" className="w-full rounded-2xl border border-white/15 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-xl outline-none" /></label></div></header><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">{loading ? <div className="flex justify-center py-20"><Spinner /></div> : visible.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center"><Gift className="mx-auto h-10 w-10 text-[#0A7C6E]" /><h2 className="mt-3 font-[Playfair_Display] text-2xl font-semibold">No matching packages</h2><p className="mt-2 text-sm text-slate-500">Try another search or return when the next off-season window opens.</p></div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visible.map((offer) => <PublicPackageCard key={offer.id} offer={offer} />)}</div>}</main><Footer /></div>;
};
export default PackagesPage;
