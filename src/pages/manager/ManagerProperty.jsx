import { useCallback, useEffect, useState } from 'react';
import { Building2, Edit2, MapPin, Plus } from 'lucide-react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import BranchFormModal from '../../components/admin/BranchFormModal';
import hotelApi from '../../api/hotelApi';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/core/Spinner';

const ManagerProperty = () => {
  const { user } = useAuth();
  const hotelId = user?.managedHotel?.id;
  const [hotel, setHotel] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined);
  const load = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try { const [hotelData, branchData] = await Promise.all([hotelApi.getHotelById(hotelId), hotelApi.getHotelBranches(hotelId)]); setHotel(hotelData); setBranches(branchData); } finally { setLoading(false); }
  }, [hotelId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  return <ManagerLayout><div className="mx-auto max-w-6xl"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Property</p><h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold">{hotel?.name || 'Your hotel'}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{hotel?.description || 'Manage the branches assigned to your hotel.'}</p></div><button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} />Add branch</button></div>{loading ? <div className="flex justify-center py-16"><Spinner /></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{branches.map((branch) => <article key={branch.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className="rounded-xl bg-[#E6F5F3] p-2 text-[#0A7C6E]"><Building2 size={19} /></span><button type="button" onClick={() => setEditing(branch)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Edit2 size={16} /></button></div><h2 className="mt-4 font-semibold">{branch.name || `${branch.city} branch`}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} />{branch.city}{branch.country ? `, ${branch.country}` : ''}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{branch.currency}</span>{branch.ecoCertified ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Eco-certified</span> : null}</div></article>)}</div>}{editing !== undefined ? <BranchFormModal hotelId={hotelId} branch={editing} onClose={(saved) => { setEditing(undefined); if (saved) load(); }} /> : null}</div></ManagerLayout>;
};
export default ManagerProperty;
