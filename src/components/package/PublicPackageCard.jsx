import { ArrowRight, CalendarDays, Check, Clock3, Gift, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDate = (value) => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '';
const saving = (offer) => offer.discountType === 'PERCENTAGE'
  ? `${Number(offer.discountValue)}% off`
  : `${offer.discountCurrency} ${Number(offer.discountValue).toFixed(2)} off`;

const PublicPackageCard = ({ offer, compact = false }) => {
  const destination = offer.scope === 'GLOBAL' ? 'All participating hotels' : offer.branchName || offer.hotelName;
  const target = offer.hotelId ? `/hotels/${offer.hotelId}${offer.branchId ? `?branchId=${offer.branchId}` : ''}` : '/hotels';
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative overflow-hidden bg-gradient-to-br from-[#0A7C6E] to-[#1A1A2E] ${compact ? 'h-44' : 'h-52'}`}>
        {offer.imageUrl ? <img src={offer.imageUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <Gift className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/25" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0A7C6E] shadow-sm">{saving(offer)}</span>
        <div className="absolute inset-x-5 bottom-4"><p className="font-mono text-xs font-semibold tracking-[0.15em] text-emerald-200">{offer.code}</p><h3 className="mt-1 font-[Playfair_Display] text-2xl font-semibold text-white">{offer.name}</h3></div>
      </div>
      <div className="flex flex-1 flex-col p-5"><p className="text-sm leading-6 text-slate-600">{offer.summary}</p><div className="mt-4 space-y-2 text-xs text-slate-500"><p className="flex items-center gap-2"><MapPin size={14} className="text-[#0A7C6E]" />{destination}</p><p className="flex items-center gap-2"><CalendarDays size={14} className="text-[#0A7C6E]" />Stay {formatDate(offer.stayStartDate)} – {formatDate(offer.stayEndDate)}</p><p className="flex items-center gap-2"><Clock3 size={14} className="text-[#0A7C6E]" />{offer.minimumNights} night minimum{offer.minimumAdvanceDays ? ` · book ${offer.minimumAdvanceDays} days ahead` : ''}</p></div>{offer.inclusions?.length ? <ul className="mt-4 space-y-1.5">{offer.inclusions.slice(0, compact ? 2 : 3).map((item) => <li key={item} className="flex items-start gap-2 text-xs text-slate-600"><Check size={14} className="mt-0.5 shrink-0 text-[#0A7C6E]" />{item}</li>)}</ul> : null}<Link to={target} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#0A7C6E]">Choose a room <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link></div>
    </article>
  );
};

export default PublicPackageCard;
