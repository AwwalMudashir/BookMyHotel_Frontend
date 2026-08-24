import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, Eye, EyeOff, Gift, MapPin, Percent, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import hotelApi from '../../api/hotelApi';
import packageApi from '../../api/packageApi';
import { parseApiError } from '../../utils/parseApiError';
import Spinner from '../core/Spinner';
import OffSeasonPackageForm from './OffSeasonPackageForm';

const dateLabel = (value) => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : 'Not set';
const discountLabel = (offer) => offer.discountType === 'PERCENTAGE'
  ? `${Number(offer.discountValue)}% off`
  : `${offer.discountCurrency} ${Number(offer.discountValue).toFixed(2)} off`;
const scopeLabel = (offer) => offer.scope === 'GLOBAL' ? 'Every hotel' : offer.scope === 'BRANCH' ? (offer.branchName || 'One branch') : `${offer.hotelName} · all branches`;

const OffSeasonPackageManager = ({ isAdmin = false, managedHotelId = null }) => {
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [hotelFilter, setHotelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [changingStatus, setChangingStatus] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    hotelApi.getAllHotels(1, 100).then(({ items }) => setHotels(items)).catch(() => setHotels([]));
  }, [isAdmin]);

  const load = useCallback(async () => {
    if (!isAdmin && !managedHotelId) return;
    setLoading(true);
    try {
      const items = await packageApi.getForManagement(isAdmin ? (hotelFilter || null) : managedHotelId);
      setPackages(items);
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to load off-season packages.'));
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [hotelFilter, isAdmin, managedHotelId]);

  useEffect(() => {
    const request = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(request);
  }, [load]);

  const visiblePackages = useMemo(() => packages.filter((offer) => {
    if (statusFilter === 'ACTIVE' && !offer.active) return false;
    if (statusFilter === 'INACTIVE' && offer.active) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [offer.name, offer.code, offer.hotelName, offer.branchName, offer.summary]
      .filter(Boolean).some((value) => value.toLowerCase().includes(needle));
  }), [packages, query, statusFilter]);

  const toggleStatus = async (offer) => {
    setChangingStatus(offer.id);
    try {
      await packageApi.setActive(offer.id, !offer.active);
      toast.success(offer.active ? 'Package hidden from new bookings.' : 'Package reactivated.');
      await load();
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to change the package status.'));
    } finally {
      setChangingStatus(null);
    }
  };

  if (!isAdmin && !managedHotelId) {
    return <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-800">Your manager account must be assigned to a hotel before you can create packages.</div>;
  }

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, code or hotel" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0A7C6E]" /></label>
            {isAdmin ? <select value={hotelFilter} onChange={(event) => setHotelFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"><option value="">All hotels and global</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select> : null}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
          </div>
          <button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#08685D]"><Plus size={17} />New package</button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : visiblePackages.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><Gift className="mx-auto h-10 w-10 text-[#0A7C6E]" /><h3 className="mt-4 font-[Playfair_Display] text-xl font-semibold text-slate-900">No packages found</h3><p className="mt-2 text-sm text-slate-500">Create an off-season offer to turn quieter dates into an attractive stay.</p></div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visiblePackages.map((offer) => (
            <article key={offer.id} className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${offer.active ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
              <div className="relative h-40 bg-gradient-to-br from-[#0A7C6E] to-[#1A1A2E]">
                {offer.imageUrl ? <img src={offer.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0A7C6E] backdrop-blur">{discountLabel(offer)}</span>{offer.featured ? <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">Featured</span> : null}{!offer.active ? <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white">Inactive</span> : null}</div>
                <div className="absolute inset-x-4 bottom-4"><p className="font-mono text-xs font-semibold tracking-wider text-emerald-200">{offer.code}</p><h3 className="mt-1 font-[Playfair_Display] text-xl font-semibold text-white">{offer.name}</h3></div>
              </div>
              <div className="p-5"><p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{offer.summary}</p><div className="mt-4 space-y-2 text-xs text-slate-500"><p className="flex items-center gap-2"><MapPin size={14} className="text-[#0A7C6E]" />{scopeLabel(offer)}</p><p className="flex items-center gap-2"><CalendarDays size={14} className="text-[#0A7C6E]" />Stay {dateLabel(offer.stayStartDate)} – {dateLabel(offer.stayEndDate)}</p><p className="flex items-center gap-2"><Percent size={14} className="text-[#0A7C6E]" />{offer.minimumNights} night minimum{offer.maximumNights ? ` · ${offer.maximumNights} maximum` : ''}</p></div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs font-medium text-slate-500">{offer.maxBookings ? `${offer.timesBooked}/${offer.maxBookings} reserved` : `${offer.timesBooked || 0} reserved`}</span><div className="flex gap-1"><button type="button" onClick={() => { setEditing(offer); setFormOpen(true); }} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0A7C6E]" aria-label={`Edit ${offer.name}`}><Edit2 size={16} /></button><button type="button" disabled={changingStatus === offer.id} onClick={() => toggleStatus(offer)} className={`rounded-full p-2 disabled:opacity-50 ${offer.active ? 'text-rose-600 hover:bg-rose-50' : 'text-[#0A7C6E] hover:bg-emerald-50'}`} aria-label={offer.active ? `Deactivate ${offer.name}` : `Reactivate ${offer.name}`}>{offer.active ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen ? <OffSeasonPackageForm offer={editing} isAdmin={isAdmin} managedHotelId={managedHotelId} hotels={hotels} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); void load(); }} /> : null}
    </>
  );
};

export default OffSeasonPackageManager;
