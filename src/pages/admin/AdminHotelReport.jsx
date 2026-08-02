import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, parseISO, subDays } from 'date-fns';
import { ArrowLeft, BedDouble, Coins, Leaf, TrendingUp } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import AdminNav from '../../components/admin/AdminNav';
import KpiCard from '../../components/admin/KpiCard';
import Spinner from '../../components/core/Spinner';
import analyticsApi from '../../api/analyticsApi';
import hotelApi from '../../api/hotelApi';
import roomApi from '../../api/roomApi';
import { parseApiError } from '../../utils/parseApiError';

const todayString = format(new Date(), 'yyyy-MM-dd');
const defaultStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');

const statusClasses = {
  PENDING: 'bg-[#FEF3E2] text-[#9A6400]',
  CONFIRMED: 'bg-[#E2F0E8] text-[#1D6A2D]',
  CANCELLED: 'bg-[#FDE8E8] text-[#9B1E1E]',
};

// Purpose: Per-hotel analytics drill-down. Revenue/ADR are labeled with the hotel's own
// currency only when every one of its branches shares a single currency — otherwise they're
// shown raw with an explicit caveat, per the backend's documented (not-a-bug) behavior of
// summing totalPrice across bookings with no conversion.
const AdminHotelReport = () => {
  const { hotelId } = useParams();

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayString);

  const [summary, setSummary] = useState(null);
  const [currency, setCurrency] = useState(null); // null = mixed/unknown across branches
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [lookupDate, setLookupDate] = useState(todayString);
  const [lookupResults, setLookupResults] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [roomsById, setRoomsById] = useState({});
  const inFlightRoomIds = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [hotelSummary, branches] = await Promise.all([
          analyticsApi.getHotelSummary(hotelId, { startDate, endDate }),
          hotelApi.getHotelBranches(hotelId),
        ]);
        if (cancelled) return;
        setSummary(hotelSummary);
        const currencies = new Set(branches.map((branch) => branch.currency).filter(Boolean));
        setCurrency(currencies.size === 1 ? [...currencies][0] : null);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err, 'Unable to load this hotel\'s analytics right now.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [hotelId, startDate, endDate]);

  const handleLookup = async () => {
    setLookupLoading(true);
    setLookupError('');
    try {
      const data = await analyticsApi.getBookingsByDate({ hotelId, date: lookupDate });
      setLookupResults(data);
    } catch (err) {
      setLookupError(parseApiError(err, 'Unable to load bookings for this date.'));
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    const idsToFetch = [...new Set((lookupResults || []).map((booking) => booking.roomId))].filter(
      (id) => id != null && !Object.prototype.hasOwnProperty.call(roomsById, id) && !inFlightRoomIds.current.has(id),
    );
    idsToFetch.forEach((id) => {
      inFlightRoomIds.current.add(id);
      roomApi
        .getRoomById(id)
        .then((room) => setRoomsById((current) => ({ ...current, [id]: room })))
        .catch(() => setRoomsById((current) => ({ ...current, [id]: null })))
        .finally(() => inFlightRoomIds.current.delete(id));
    });
  }, [lookupResults, roomsById]);

  const formatMoney = (amount) => {
    const value = Number(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency ? `${currency} ${value}` : value;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <AdminNav />

        <Link to="/admin/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] transition hover:text-[#0A7C6E]">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[Playfair_Display] text-2xl font-semibold">{summary?.hotelName || 'Hotel report'}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Performance for the selected range.</p>
          </div>
          <div className="flex items-end gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">From</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">To</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={todayString}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <div className="rounded-[24px] border border-[#F5C2C7] bg-[#FEF3F3] p-8 text-center">
            <p className="text-sm text-[#9B1E1E]">{error}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Room nights booked" value={(summary?.roomNightsBooked ?? 0).toLocaleString()} icon={BedDouble} />
            <KpiCard
              label="Revenue"
              value={formatMoney(summary?.revenue)}
              icon={Coins}
              hint={currency ? undefined : "This hotel's branches use different currencies — figure isn't converted, treat as approximate."}
            />
            <KpiCard label="Average daily rate" value={formatMoney(summary?.averageDailyRate)} icon={TrendingUp} />
          </div>
        )}

        <div className="mt-6 rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Occupancy on a specific date</h2>
          <p className="mb-4 text-sm text-[#6B7280]">Every booking (any status) occupying a room at this hotel on the chosen date.</p>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Date</label>
              <input
                type="date"
                value={lookupDate}
                onChange={(event) => setLookupDate(event.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </div>
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookupLoading}
              className="rounded-xl bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {lookupLoading ? 'Loading…' : 'Check occupancy'}
            </button>
          </div>

          {lookupError ? (
            <p className="text-sm text-[#9B1E1E]">{lookupError}</p>
          ) : lookupResults === null ? (
            <p className="text-sm text-[#6B7280]">Pick a date and check occupancy to see who's booked in.</p>
          ) : lookupResults.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No bookings occupy a room at this hotel on this date.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    <th className="w-1/4 py-2.5">Room</th>
                    <th className="w-1/12 py-2.5">Guest</th>
                    <th className="w-1/6 py-2.5">Stay</th>
                    <th className="w-1/12 py-2.5">Status</th>
                    <th className="w-1/6 py-2.5">Total</th>
                    <th className="w-1/12 py-2.5">Eco pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F2F4]">
                  {lookupResults.map((booking) => {
                    const room = roomsById[booking.roomId];
                    return (
                      <tr key={booking.id}>
                        <td className="py-3">
                          <p className="font-medium text-[#1A1A2E]">{room?.roomTypeName || `Room #${booking.roomId}`}</p>
                        </td>
                        <td className="py-3 text-sm text-[#6B7280]">#{booking.userId}</td>
                        <td className="py-3 text-sm text-[#6B7280]">
                          {format(parseISO(booking.checkIn), 'd MMM')} → {format(parseISO(booking.checkOut), 'd MMM')}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-semibold text-[#1A1A2E]">
                          {room?.currency ? `${room.currency} ` : ''}{Number(booking.totalPrice ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 text-sm">
                          {booking.ecoPointsEarned > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[#1D6A2D]"><Leaf className="h-3.5 w-3.5" />{booking.ecoPointsEarned}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminHotelReport;
