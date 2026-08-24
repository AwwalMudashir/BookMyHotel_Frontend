import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import ReservationTable from '../../components/admin/ReservationTable';
import Pagination from '../../components/core/Pagination';
import Spinner from '../../components/core/Spinner';
import adminApi from '../../api/adminApi';
import hotelApi from '../../api/hotelApi';
import roomApi from '../../api/roomApi';
import { parseApiError } from '../../utils/parseApiError';

const PAGE_SIZE = 20;

const actionCopy = {
  CONFIRMED: {
    title: 'Confirm this reservation?',
    body: 'This runs the same logic as a successful payment webhook — it awards eco points (if eligible), increments the promo code\'s usage count, and sends the confirmation email. This is a real action, not a status correction.',
    confirmLabel: 'Yes, confirm booking',
    classes: 'bg-[#0A7C6E] hover:bg-[#065E52]',
  },
  CANCELLED: {
    title: 'Cancel this reservation?',
    body: 'This runs the same logic as a customer cancellation — it claws back any eco points already awarded and issues a Stripe refund if the booking was paid. This can\'t be undone.',
    confirmLabel: 'Yes, cancel booking',
    classes: 'bg-[#9B1E1E] hover:bg-[#7F1818]',
  },
};

// Purpose: Admin reservation oversight — filterable, paginated, with a status-change action
// that performs the real confirm/cancel side effects (see actionCopy above), not a raw edit.
const AdminReservations = () => {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [referenceQuery, setReferenceQuery] = useState('');
  const [page, setPage] = useState(0);

  const [bookings, setBookings] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roomsById, setRoomsById] = useState({});
  const inFlightRoomIds = useRef(new Set());

  const [pendingAction, setPendingAction] = useState(null); // { booking, nextStatus }
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    hotelApi.getAllHotels(1, 100).then(({ items }) => setHotels(items)).catch(() => setHotels([]));
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getReservations({
        hotelId: hotelId || undefined,
        date: date || undefined,
        status: status || undefined,
        page,
        size: PAGE_SIZE,
      });
      setBookings(data.content || []);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      setError(parseApiError(err, 'Unable to load reservations right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, date, status, page]);

  useEffect(() => {
    const idsToFetch = [...new Set(bookings.map((booking) => booking.roomId))].filter(
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
  }, [bookings, roomsById]);

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { booking, nextStatus } = pendingAction;
    setActingId(booking.id);
    try {
      const updated = await adminApi.updateReservationStatus(booking.id, nextStatus);
      setBookings((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(nextStatus === 'CONFIRMED' ? 'Booking confirmed.' : 'Booking cancelled.');
      setPendingAction(null);
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to update this reservation.'));
    } finally {
      setActingId(null);
    }
  };

  const activeActionCopy = pendingAction ? actionCopy[pendingAction.nextStatus] : null;
  const filteredBookings = bookings.filter((booking) => {
    const normalizedQuery = referenceQuery.trim().toLowerCase();
    if (!normalizedQuery) return true;

    const reference = (booking.reference || `BK-${booking.id || ''}`).toLowerCase();
    return reference.includes(normalizedQuery);
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">

        <div className="mb-6">
          <h1 className="font-[Playfair_Display] text-2xl font-semibold">Reservations</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Oversee every booking across the platform.</p>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Hotel</label>
            <select
              value={hotelId}
              onChange={handleFilterChange(setHotelId)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            >
              <option value="">All hotels</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={handleFilterChange(setDate)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Status</label>
            <select
              value={status}
              onChange={handleFilterChange(setStatus)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="min-w-[220px] flex-1 md:max-w-[260px]">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Reference</label>
            <input
              type="text"
              value={referenceQuery}
              onChange={(event) => setReferenceQuery(event.target.value)}
              placeholder="Find booking by ref"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            />
          </div>
          {(hotelId || date || status || referenceQuery) ? (
            <button
              type="button"
              onClick={() => { setHotelId(''); setDate(''); setStatus(''); setReferenceQuery(''); setPage(0); }}
              className="cursor-pointer rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-[#0A7C6E] hover:text-[#0A7C6E]"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-[#E6F5F3] p-3 text-[#0A7C6E]"><RefreshCw /></div>
              <p className="text-sm text-[#6B7280]">{error}</p>
              <button onClick={loadReservations} className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white">Try again</button>
            </div>
          ) : (
            <ReservationTable
              bookings={filteredBookings}
              roomsById={roomsById}
              actingId={actingId}
              onConfirm={(booking) => setPendingAction({ booking, nextStatus: 'CONFIRMED' })}
              onCancel={(booking) => setPendingAction({ booking, nextStatus: 'CANCELLED' })}
            />
          )}
        </div>

        {!loading && !error && totalPages > 1 ? (
          <div className="mt-6">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm sm:p-6">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FEF3E2] text-[#9A6400]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[#1A1A2E]">{activeActionCopy.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{activeActionCopy.body}</p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actingId === pendingAction.booking.id}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${activeActionCopy.classes}`}
              >
                {activeActionCopy.confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actingId === pendingAction.booking.id}
                className="flex-1 cursor-pointer rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
};

export default AdminReservations;
