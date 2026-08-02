import { Calendar, MapPin } from 'lucide-react';
import { addDays, differenceInDays, format, isValid, parseISO } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency';
import { ROOM_TAG_OPTIONS } from '../../utils/roomTags';

const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential Suite'];
const occupancyOptions = [1, 2, 3, 4, 5, 6];
const hotelOptions = [
  { id: 'marriott', label: 'Marriott', count: 12 },
  { id: 'hilton', label: 'Hilton', count: 9 },
  { id: 'hyatt', label: 'Hyatt', count: 7 },
  { id: 'four-seasons', label: 'Four Seasons', count: 4 },
];

const todayString = format(new Date(), 'yyyy-MM-dd');

// ── Reusable labelled input with icon ──────────────────────────────────────────
const IconInput = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, min, extra = {} }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
    )}
    <div className="relative flex items-center">
      {Icon && (
        <span className="pointer-events-none absolute left-3 flex h-full items-center">
          <Icon className="h-4 w-4 text-[#0A7C6E]" />
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        {...extra}
        className={`w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15 ${Icon ? 'pl-9' : 'pl-3'}`}
      />
    </div>
  </div>
);

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{title}</p>
    {children}
  </div>
);

const FilterPanel = ({ filters, onFilterChange, onClear }) => {
  const { symbol } = useCurrency();
  const checkInDate  = filters.checkIn  ? parseISO(filters.checkIn)  : null;
  const checkOutDate = filters.checkOut ? parseISO(filters.checkOut) : null;
  const nights = isValid(checkInDate) && isValid(checkOutDate)
    ? Math.max(differenceInDays(checkOutDate, checkInDate), 0)
    : 0;
  const checkOutMin = filters.checkIn && isValid(checkInDate)
    ? format(addDays(checkInDate, 1), 'yyyy-MM-dd')
    : todayString;

  const minVal = Number(filters.minPrice || 0);
  const maxVal = Number(filters.maxPrice || 5000);
  const minPct = Math.min(100, Math.max(0, (minVal / 5000) * 100));
  const maxPct = Math.min(100, Math.max(0, (maxVal / 5000) * 100));

  return (
    <aside className="flex flex-col gap-4 rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-sm">

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A2E]">Search filters</h2>
        <p className="mt-0.5 text-xs text-slate-400">Refine your stay preferences</p>
      </div>

      {/* ── DATE RANGE ──────────────────────────────────────────────────────── */}
      <Section title="Date range">
        <div className="grid grid-cols-1 gap-3">
          <IconInput
            label="Check-in"
            icon={Calendar}
            type="date"
            min={todayString}
            value={filters.checkIn}
            onChange={(e) => onFilterChange('checkIn', e.target.value)}
          />
          <IconInput
            label="Check-out"
            icon={Calendar}
            type="date"
            min={checkOutMin}
            value={filters.checkOut}
            onChange={(e) => onFilterChange('checkOut', e.target.value)}
          />
        </div>
        {nights > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#E5E7EB]" />
            <span className="rounded-full bg-[#E6F5F3] px-3 py-1 text-xs font-semibold text-[#0A7C6E]">
              {nights} night{nights !== 1 ? 's' : ''}
            </span>
            <div className="h-px flex-1 bg-[#E5E7EB]" />
          </div>
        )}
      </Section>

      {/* ── LOCATION ────────────────────────────────────────────────────────── */}
      <Section title="Location">
        <div className="flex flex-col gap-3">
          <IconInput
            label="City"
            icon={MapPin}
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            placeholder="e.g. Paris"
          />
          <IconInput
            label="Country"
            icon={MapPin}
            value={filters.country}
            onChange={(e) => onFilterChange('country', e.target.value)}
            placeholder="e.g. France"
          />
        </div>
      </Section>

      {/* ── PRICE RANGE ─────────────────────────────────────────────────────── */}
      <Section title="Price per night">
        {/* Min / Max inputs */}
        <div className="grid grid-cols-2 gap-3">
          {/* Min price */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Min</span>
            <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-white shadow-sm transition focus-within:border-[#0A7C6E] focus-within:ring-2 focus-within:ring-[#0A7C6E]/15">
              <span className="flex h-full items-center rounded-l-xl border-r border-[#E5E7EB] bg-[#F8F9FA] px-2.5 py-2.5 text-xs font-bold text-[#0A7C6E]">
                {symbol}
              </span>
              <input
                type="number"
                min={0}
                max={5000}
                value={filters.minPrice}
                onChange={(e) => onFilterChange('minPrice', e.target.value)}
                placeholder="0"
                className="w-full rounded-r-xl bg-transparent py-2.5 pl-2 pr-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Max price */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Max</span>
            <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-white shadow-sm transition focus-within:border-[#0A7C6E] focus-within:ring-2 focus-within:ring-[#0A7C6E]/15">
              <span className="flex h-full items-center rounded-l-xl border-r border-[#E5E7EB] bg-[#F8F9FA] px-2.5 py-2.5 text-xs font-bold text-[#0A7C6E]">
                {symbol}
              </span>
              <input
                type="number"
                min={0}
                max={5000}
                value={filters.maxPrice}
                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                placeholder="5000"
                className="w-full rounded-r-xl bg-transparent py-2.5 pl-2 pr-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Dual-range slider track */}
        <div className="relative mt-4 h-1.5 rounded-full bg-[#E5E7EB]">
          {/* filled segment between min and max */}
          <div
            className="absolute inset-y-0 rounded-full bg-[#0A7C6E]"
            style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
          />
          {/* min thumb */}
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={minVal}
            onChange={(e) => {
              const v = Math.min(Number(e.target.value), maxVal - 50);
              onFilterChange('minPrice', String(v));
            }}
            className="pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0A7C6E] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          />
          {/* max thumb */}
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={maxVal}
            onChange={(e) => {
              const v = Math.max(Number(e.target.value), minVal + 50);
              onFilterChange('maxPrice', String(v));
            }}
            className="pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0A7C6E] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          />
        </div>
        {/* Range labels */}
        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
          <span>{symbol}0</span>
          <span>{symbol}5,000</span>
        </div>
      </Section>

      {/* ── ROOM TYPE ───────────────────────────────────────────────────────── */}
      <Section title="Room type">
        <div className="flex flex-col gap-2">
          {roomTypes.map((option) => {
            const active = filters.roomType === option;
            const badge = { Standard: 'Best value', Deluxe: 'Popular', Suite: 'Luxury', 'Presidential Suite': 'Elite' }[option];
            return (
              <button
                key={option}
                type="button"
                onClick={() => onFilterChange('roomType', active ? '' : option)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-[#0A7C6E] bg-[#E6F5F3]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#0A7C6E]/40'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold transition ${
                    active
                      ? 'border-[#0A7C6E] bg-[#0A7C6E] text-white'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}>✓</span>
                  <span className="text-sm font-medium text-slate-800">{option}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-[#0A7C6E]/10 text-[#065E52]' : 'bg-slate-100 text-slate-500'
                }`}>
                  {badge}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── STAY TYPE ───────────────────────────────────────────────────────── */}
      <Section title="Stay type">
        <div className="flex flex-wrap gap-2">
          {ROOM_TAG_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = filters.tag === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onFilterChange('tag', active ? '' : value)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-[#0A7C6E] bg-[#E6F5F3] text-[#0A7C6E]'
                    : 'border-[#E5E7EB] bg-white text-slate-600 hover:border-[#0A7C6E]/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">Pick one — these highlight different kinds of stays.</p>
      </Section>

      {/* ── GUESTS ──────────────────────────────────────────────────────────── */}
      <Section title="Guests">
        <div className="flex flex-wrap gap-2">
          {occupancyOptions.map((value) => {
            const active = filters.maxOccupancy === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onFilterChange('maxOccupancy', active ? null : value)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  active
                    ? 'border-[#0A7C6E] bg-[#0A7C6E] text-white shadow-sm'
                    : 'border-[#E5E7EB] bg-white text-slate-700 hover:border-[#0A7C6E]/40'
                }`}
              >
                {value === 6 ? '6+' : value}
              </button>
            );
          })}
        </div>
        {filters.maxOccupancy && (
          <p className="mt-2 text-xs text-slate-500">
            Showing rooms for up to {filters.maxOccupancy === 6 ? '6+' : filters.maxOccupancy} guest{filters.maxOccupancy !== 1 ? 's' : ''}
          </p>
        )}
      </Section>

      {/* ── HOTEL CHAIN ─────────────────────────────────────────────────────── */}
      <Section title="Hotel chain">
        <div className="flex flex-col gap-2">
          {hotelOptions.map((hotel) => {
            const checked = filters.hotelIds?.includes(hotel.id);
            return (
              <button
                key={hotel.id}
                type="button"
                onClick={() => {
                  const nextIds = checked
                    ? filters.hotelIds.filter((id) => id !== hotel.id)
                    : [...(filters.hotelIds || []), hotel.id];
                  onFilterChange('hotelIds', nextIds);
                }}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                  checked
                    ? 'border-[#0A7C6E] bg-[#E6F5F3]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#0A7C6E]/40'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold transition ${
                    checked
                      ? 'border-[#0A7C6E] bg-[#0A7C6E] text-white'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}>✓</span>
                  <span className="text-sm font-medium text-slate-800">{hotel.label}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  checked ? 'bg-[#0A7C6E]/10 text-[#065E52]' : 'bg-slate-100 text-slate-500'
                }`}>
                  {hotel.count}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <button
        type="button"
        onClick={onClear}
        className="mt-1 w-full rounded-2xl border border-[#0A7C6E] bg-white py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]"
      >
        Clear all filters
      </button>
    </aside>
  );
};

export default FilterPanel;