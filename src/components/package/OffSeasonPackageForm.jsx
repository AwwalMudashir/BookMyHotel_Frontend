import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Check, Globe2, Hotel, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import hotelApi from '../../api/hotelApi';
import packageApi from '../../api/packageApi';
import { parseApiError } from '../../utils/parseApiError';

const today = new Date().toISOString().slice(0, 10);
const baseForm = {
  scope: 'HOTEL', hotelId: '', branchId: '', code: '', name: '', summary: '', description: '',
  inclusions: '', eligibleRoomTypes: '', termsAndConditions: '', imageUrl: '',
  discountType: 'PERCENTAGE', discountValue: '', discountCurrency: 'USD',
  maxDiscountAmount: '', minimumRoomSubtotal: '', bookingStartDate: today, bookingEndDate: '',
  stayStartDate: '', stayEndDate: '', minimumNights: '1', maximumNights: '',
  minimumAdvanceDays: '0', maxBookings: '', featured: false,
};

const fieldClass = 'mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/15';
const labelClass = 'block text-sm font-medium text-slate-700';
const toLines = (items) => (Array.isArray(items) ? items.join('\n') : '');
const numberOrNull = (value) => (value === '' || value === null ? null : Number(value));
const lines = (value) => value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);

const OffSeasonPackageForm = ({ offer = null, isAdmin, managedHotelId, hotels, onClose, onSaved }) => {
  const isEdit = Boolean(offer?.id);
  const [form, setForm] = useState(() => (offer ? {
    scope: offer.scope || 'HOTEL', hotelId: offer.hotelId ? String(offer.hotelId) : '',
    branchId: offer.branchId ? String(offer.branchId) : '', code: offer.code || '', name: offer.name || '',
    summary: offer.summary || '', description: offer.description || '', inclusions: toLines(offer.inclusions),
    eligibleRoomTypes: toLines(offer.eligibleRoomTypes), termsAndConditions: offer.termsAndConditions || '',
    imageUrl: offer.imageUrl || '', discountType: offer.discountType || 'PERCENTAGE',
    discountValue: offer.discountValue ?? '', discountCurrency: offer.discountCurrency || 'USD',
    maxDiscountAmount: offer.maxDiscountAmount ?? '', minimumRoomSubtotal: offer.minimumRoomSubtotal ?? '',
    bookingStartDate: offer.bookingStartDate || today, bookingEndDate: offer.bookingEndDate || '',
    stayStartDate: offer.stayStartDate || '', stayEndDate: offer.stayEndDate || '',
    minimumNights: offer.minimumNights ?? '1', maximumNights: offer.maximumNights ?? '',
    minimumAdvanceDays: offer.minimumAdvanceDays ?? '0', maxBookings: offer.maxBookings ?? '',
    featured: Boolean(offer.featured),
  } : { ...baseForm, hotelId: managedHotelId ? String(managedHotelId) : String(hotels[0]?.id || '') }));
  const [branches, setBranches] = useState([]);
  const [currencies, setCurrencies] = useState(['USD']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedHotelId = form.scope === 'GLOBAL' ? '' : (isAdmin ? form.hotelId : String(managedHotelId || ''));
  const scopeOptions = useMemo(() => (isAdmin ? [
    { value: 'GLOBAL', label: 'Every hotel', icon: Globe2, help: 'Administrator-only platform package.' },
    { value: 'HOTEL', label: 'One hotel', icon: Hotel, help: 'Available at every branch in the hotel.' },
    { value: 'BRANCH', label: 'One branch', icon: MapPin, help: 'Available only at the selected branch.' },
  ] : [
    { value: 'HOTEL', label: 'Every branch', icon: Hotel, help: 'Available throughout your hotel.' },
    { value: 'BRANCH', label: 'One branch', icon: MapPin, help: 'Available only at the selected branch.' },
  ]), [isAdmin]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    packageApi.getSupportedCurrencies().then((items) => setCurrencies(items.sort())).catch(() => setCurrencies(['USD']));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedHotelId || form.scope !== 'BRANCH') {
      return undefined;
    }
    hotelApi.getHotelBranches(selectedHotelId)
      .then((items) => { if (!cancelled) setBranches(items); })
      .catch(() => { if (!cancelled) setBranches([]); });
    return () => { cancelled = true; };
  }, [selectedHotelId, form.scope]);

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (form.scope !== 'GLOBAL' && !selectedHotelId) return 'Select a hotel.';
    if (form.scope === 'BRANCH' && !form.branchId) return 'Select a branch.';
    if (!form.code.trim() || !/^[A-Za-z0-9_-]{3,40}$/.test(form.code.trim())) return 'Enter a 3-40 character package code using letters, numbers, hyphens or underscores.';
    if (!form.name.trim()) return 'Package name is required.';
    if (!form.summary.trim()) return 'A short customer-facing summary is required.';
    const discount = Number(form.discountValue);
    if (!Number.isFinite(discount) || discount <= 0) return 'Enter a discount greater than zero.';
    if (form.discountType === 'PERCENTAGE' && discount > 100) return 'Percentage discount cannot exceed 100%.';
    if (!form.bookingStartDate || !form.bookingEndDate || form.bookingEndDate < form.bookingStartDate) return 'Enter a valid booking window.';
    if (!form.stayStartDate || !form.stayEndDate || form.stayEndDate <= form.stayStartDate) return 'Stay end date must be after the stay start date.';
    if (Number(form.minimumNights) < 1) return 'Minimum nights must be at least one.';
    if (form.maximumNights && Number(form.maximumNights) < Number(form.minimumNights)) return 'Maximum nights cannot be below minimum nights.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    const payload = {
      scope: form.scope,
      hotelId: form.scope === 'GLOBAL' ? null : Number(selectedHotelId),
      branchId: form.scope === 'BRANCH' ? Number(form.branchId) : null,
      code: form.code.trim().toUpperCase(), name: form.name.trim(), summary: form.summary.trim(),
      description: form.description.trim() || null, inclusions: lines(form.inclusions),
      eligibleRoomTypes: lines(form.eligibleRoomTypes), termsAndConditions: form.termsAndConditions.trim() || null,
      imageUrl: form.imageUrl.trim() || null, discountType: form.discountType,
      discountValue: Number(form.discountValue), discountCurrency: form.discountCurrency,
      maxDiscountAmount: numberOrNull(form.maxDiscountAmount), minimumRoomSubtotal: numberOrNull(form.minimumRoomSubtotal),
      bookingStartDate: form.bookingStartDate, bookingEndDate: form.bookingEndDate,
      stayStartDate: form.stayStartDate, stayEndDate: form.stayEndDate,
      minimumNights: Number(form.minimumNights), maximumNights: numberOrNull(form.maximumNights),
      minimumAdvanceDays: Number(form.minimumAdvanceDays || 0), maxBookings: numberOrNull(form.maxBookings),
      featured: form.featured,
    };
    setSaving(true);
    setError('');
    try {
      if (isEdit) await packageApi.update(offer.id, payload);
      else await packageApi.create(payload);
      toast.success(isEdit ? 'Off-season package updated.' : 'Off-season package created.');
      onSaved();
    } catch (err) {
      const message = parseApiError(err, 'Unable to save this package.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A7C6E]">Seasonal package</p><h2 className="mt-1 font-[Playfair_Display] text-2xl font-semibold text-slate-950 sm:text-3xl">{isEdit ? 'Edit package' : 'Create an off-season package'}</h2><p className="mt-1 text-sm text-slate-500">Define who can see it, when they can stay, what is included and how the saving is calculated.</p></div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Close package form"><X size={18} /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5 sm:px-7">
          <section><h3 className="text-sm font-semibold text-slate-900">1. Availability scope</h3><div className="mt-3 grid gap-3 sm:grid-cols-3">{scopeOptions.map(({ value, label, icon: Icon, help }) => <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, scope: value, branchId: '' }))} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${form.scope === value ? 'border-[#0A7C6E] bg-[#F0FAF7] ring-2 ring-[#0A7C6E]/10' : 'border-slate-200 hover:border-slate-300'}`}><span className={`rounded-xl p-2 ${form.scope === value ? 'bg-[#0A7C6E] text-white' : 'bg-slate-100 text-slate-600'}`}><Icon size={17} /></span><span><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{help}</span></span></button>)}</div>
            {(isAdmin || form.scope === 'BRANCH') && form.scope !== 'GLOBAL' ? <div className={`mt-4 grid gap-4 ${isAdmin && form.scope === 'BRANCH' ? 'sm:grid-cols-2' : 'sm:max-w-md'}`}>{isAdmin ? <label className={labelClass}>Hotel<select value={selectedHotelId} onChange={(event) => setForm((current) => ({ ...current, hotelId: event.target.value, branchId: '' }))} className={fieldClass}><option value="">Select hotel</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select></label> : null}{form.scope === 'BRANCH' ? <label className={labelClass}>Branch<select value={form.branchId} onChange={update('branchId')} className={fieldClass}><option value="">Select branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name || `${branch.city}, ${branch.country}`}</option>)}</select></label> : null}</div> : null}
          </section>

          <section className="border-t border-slate-100 pt-6"><h3 className="text-sm font-semibold text-slate-900">2. Customer-facing details</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Package code<input value={form.code} onChange={update('code')} maxLength={40} className={`${fieldClass} uppercase`} placeholder="WINTER-DUBAI" /></label><label className={labelClass}>Package name<input value={form.name} onChange={update('name')} maxLength={120} className={fieldClass} placeholder="Dubai Winter Escape" /></label></div><label className={`${labelClass} mt-4`}>Short summary<input value={form.summary} onChange={update('summary')} maxLength={280} className={fieldClass} placeholder="Save on a quieter three-night city break with breakfast included." /></label><div className="mt-4 grid gap-4 lg:grid-cols-2"><label className={labelClass}>Full description<textarea value={form.description} onChange={update('description')} rows={4} maxLength={2000} className={fieldClass} /></label><label className={labelClass}>Inclusions <span className="font-normal text-slate-400">(one per line)</span><textarea value={form.inclusions} onChange={update('inclusions')} rows={4} className={fieldClass} placeholder={'Daily breakfast\nLate checkout\nAirport transfer'} /></label></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><label className={labelClass}>Eligible room types <span className="font-normal text-slate-400">(blank means every type)</span><textarea value={form.eligibleRoomTypes} onChange={update('eligibleRoomTypes')} rows={3} className={fieldClass} placeholder={'Standard\nDeluxe\nSuite'} /></label><label className={labelClass}>Terms and conditions<textarea value={form.termsAndConditions} onChange={update('termsAndConditions')} rows={3} maxLength={2500} className={fieldClass} placeholder="Non-transferable. Subject to room availability." /></label></div><label className={`${labelClass} mt-4`}>Hero image URL <span className="font-normal text-slate-400">(optional; hotel banner is the fallback)</span><input type="url" value={form.imageUrl} onChange={update('imageUrl')} className={fieldClass} placeholder="https://..." /></label>{form.imageUrl ? <img src={form.imageUrl} alt="Package preview" className="mt-3 h-36 w-full rounded-2xl object-cover" /> : null}</section>

          <section className="border-t border-slate-100 pt-6"><h3 className="text-sm font-semibold text-slate-900">3. Saving and limits</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className={labelClass}>Discount type<select value={form.discountType} onChange={update('discountType')} className={fieldClass}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></label><label className={labelClass}>Discount value<input type="number" min="0.01" step="0.01" value={form.discountValue} onChange={update('discountValue')} className={fieldClass} /></label><label className={labelClass}>Currency<select value={form.discountCurrency} onChange={update('discountCurrency')} className={fieldClass}>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></label><label className={labelClass}>Maximum discount <span className="font-normal text-slate-400">(optional)</span><input type="number" min="0.01" step="0.01" value={form.maxDiscountAmount} onChange={update('maxDiscountAmount')} className={fieldClass} /></label></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className={labelClass}>Minimum room subtotal<input type="number" min="0" step="0.01" value={form.minimumRoomSubtotal} onChange={update('minimumRoomSubtotal')} className={fieldClass} /></label><label className={labelClass}>Maximum bookings<input type="number" min="1" value={form.maxBookings} onChange={update('maxBookings')} className={fieldClass} placeholder="Unlimited" /></label><label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-700 sm:mt-7"><input type="checkbox" checked={form.featured} onChange={update('featured')} className="h-4 w-4 accent-[#0A7C6E]" />Feature this package publicly</label></div></section>

          <section className="border-t border-slate-100 pt-6"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><CalendarRange size={17} className="text-[#0A7C6E]" />4. Booking and stay dates</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className={labelClass}>Booking opens<input type="date" value={form.bookingStartDate} onChange={update('bookingStartDate')} className={fieldClass} /></label><label className={labelClass}>Booking closes<input type="date" value={form.bookingEndDate} onChange={update('bookingEndDate')} className={fieldClass} /></label><label className={labelClass}>First stay date<input type="date" value={form.stayStartDate} onChange={update('stayStartDate')} className={fieldClass} /></label><label className={labelClass}>Final checkout date<input type="date" value={form.stayEndDate} onChange={update('stayEndDate')} className={fieldClass} /></label></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className={labelClass}>Minimum nights<input type="number" min="1" value={form.minimumNights} onChange={update('minimumNights')} className={fieldClass} /></label><label className={labelClass}>Maximum nights <span className="font-normal text-slate-400">(optional)</span><input type="number" min="1" value={form.maximumNights} onChange={update('maximumNights')} className={fieldClass} /></label><label className={labelClass}>Book at least this many days ahead<input type="number" min="0" value={form.minimumAdvanceDays} onChange={update('minimumAdvanceDays')} className={fieldClass} /></label></div></section>

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        </div>
        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={onClose} disabled={saving} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Check size={17} />{saving ? 'Saving…' : isEdit ? 'Save package' : 'Create package'}</button></footer>
      </form>
    </div>
  );
};

export default OffSeasonPackageForm;
