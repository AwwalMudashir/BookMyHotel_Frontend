import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parseISO } from 'date-fns';
import { AlertCircle, CalendarCheck2, CalendarClock, Search } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import BookingCard from '../../components/booking/BookingCard';
import CancelModal from '../../components/booking/CancelModal';
import ReviewForm from '../../components/review/ReviewForm';
import bookingApi from '../../api/bookingApi';
import roomApi from '../../api/roomApi';
import paymentApi from '../../api/paymentApi';
import reviewApi from '../../api/reviewApi';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/parseApiError';

const getTodayMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [roomsById, setRoomsById] = useState({});
  const inFlightRoomIds = useRef(new Set());

  const [paymentsById, setPaymentsById] = useState({});
  const inFlightPaymentIds = useRef(new Set());

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Keyed by branchId (not bookingId) — the backend allows one review per user per branch,
  // not per booking, so two completed stays at the same branch share one review record.
  const [myReviewByBranchId, setMyReviewByBranchId] = useState({});
  const inFlightReviewBranchIds = useRef(new Set());
  const [reviewTarget, setReviewTarget] = useState(null); // { booking, room }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await bookingApi.getBookings({ page: 0, size: 20 });
        if (cancelled) return;
        setBookings(data.content || []);
        setPage(0);
        setHasMore(data.last === false);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err, 'Unable to load your bookings right now.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

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

  useEffect(() => {
    const idsToFetch = [...new Set(bookings.filter((booking) => booking.status === 'PENDING').map((booking) => booking.id))].filter(
      (id) => id != null && !Object.prototype.hasOwnProperty.call(paymentsById, id) && !inFlightPaymentIds.current.has(id),
    );

    idsToFetch.forEach((id) => {
      inFlightPaymentIds.current.add(id);
      paymentApi
        .getPayment(id)
        .then((payment) => setPaymentsById((current) => ({ ...current, [id]: payment })))
        .catch(() => setPaymentsById((current) => ({ ...current, [id]: null })))
        .finally(() => inFlightPaymentIds.current.delete(id));
    });
  }, [bookings, paymentsById]);

  useEffect(() => {
    if (!user?.id) return;

    const today = getTodayMidnight();
    const isCompleted = (booking) => booking.status === 'CONFIRMED' && parseISO(booking.checkOut) < today;

    const eligibleBranchIds = [...new Set(
      bookings
        .filter(isCompleted)
        .map((booking) => roomsById[booking.roomId]?.branchId)
        .filter((id) => id != null),
    )];

    const idsToFetch = eligibleBranchIds.filter(
      (id) => !Object.prototype.hasOwnProperty.call(myReviewByBranchId, id) && !inFlightReviewBranchIds.current.has(id),
    );

    idsToFetch.forEach((branchId) => {
      inFlightReviewBranchIds.current.add(branchId);
      // No "get my review for this branch" endpoint exists — best-effort: check a generously
      // sized first page for a review by this user. Fine at this app's scale; if a branch ever
      // has more reviews than this page size, a stale CTA would just surface the real 409 on
      // submit, which is handled gracefully in ReviewForm.
      reviewApi
        .getBranchReviews(branchId, { page: 0, size: 50 })
        .then((data) => {
          const mine = (data?.reviews || []).find((review) => String(review.userId) === String(user.id)) || null;
          setMyReviewByBranchId((current) => ({ ...current, [branchId]: mine }));
        })
        .catch(() => setMyReviewByBranchId((current) => ({ ...current, [branchId]: null })))
        .finally(() => inFlightReviewBranchIds.current.delete(branchId));
    });
  }, [bookings, roomsById, myReviewByBranchId, user?.id]);

  const handleReviewSubmitted = (review) => {
    setMyReviewByBranchId((current) => ({ ...current, [review.branchId]: review }));
    setReviewTarget(null);
    toast.success('Thanks for your review!');
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await bookingApi.getBookings({ page: nextPage, size: 20 });
      setBookings((current) => [...current, ...(data.content || [])]);
      setPage(nextPage);
      setHasMore(data.last === false);
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to load more bookings.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const updated = await bookingApi.cancelBooking(cancelTarget.id);
      setBookings((current) => current.map((booking) => (booking.id === updated.id ? { ...booking, status: updated.status } : booking)));
      toast.success('Booking cancelled.');
      setCancelTarget(null);
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to cancel this booking.'));
    } finally {
      setCancelling(false);
    }
  };

  const today = getTodayMidnight();
  const upcoming = bookings
    .filter((booking) => booking.status !== 'CANCELLED' && parseISO(booking.checkOut) >= today)
    .sort((a, b) => parseISO(a.checkIn) - parseISO(b.checkIn));
  const past = bookings
    .filter((booking) => booking.status === 'CANCELLED' || parseISO(booking.checkOut) < today)
    .sort((a, b) => parseISO(b.checkOut) - parseISO(a.checkOut));
  const visibleBookings = activeTab === 'upcoming' ? upcoming : past;

  const canCancel = (booking) => booking.status !== 'CANCELLED' && parseISO(booking.checkIn) > today;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Your stays</p>
          <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E]">My bookings</h1>
        </div>

        <div className="mb-6 inline-flex gap-1 rounded-2xl border border-[#E5E7EB] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'upcoming' ? 'bg-[#0A7C6E] text-white' : 'text-[#6B7280] hover:text-[#0A7C6E]'
            }`}
          >
            <CalendarClock className="h-4 w-4" />
            Upcoming ({upcoming.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'past' ? 'bg-[#0A7C6E] text-white' : 'text-[#6B7280] hover:text-[#0A7C6E]'
            }`}
          >
            <CalendarCheck2 className="h-4 w-4" />
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="h-40 w-40 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-6 w-1/2 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-[#F5C2C7] bg-[#FEF3F3] p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#B42318]" />
            <p className="text-sm text-[#9B1E1E]">{error}</p>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6F5F3] text-[#0A7C6E]">
              {activeTab === 'upcoming' ? <CalendarClock className="h-8 w-8" /> : <CalendarCheck2 className="h-8 w-8" />}
            </div>
            <h2 className="text-xl font-[Playfair_Display] font-semibold text-[#1A1A2E]">
              {activeTab === 'upcoming' ? 'No upcoming stays yet' : 'No past stays yet'}
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              {activeTab === 'upcoming' ? 'When you book a room, it will show up here.' : 'Completed and cancelled bookings will show up here.'}
            </p>
            {activeTab === 'upcoming' ? (
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52]"
              >
                <Search className="h-4 w-4" />
                Find a room
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleBookings.map((booking) => {
              const room = roomsById[booking.roomId];
              const branchId = room?.branchId;
              return (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  room={room}
                  roomLoading={!Object.prototype.hasOwnProperty.call(roomsById, booking.roomId)}
                  payment={paymentsById[booking.id]}
                  canCancel={canCancel(booking)}
                  onCancel={setCancelTarget}
                  existingReview={branchId != null ? myReviewByBranchId[branchId] : null}
                  reviewChecked={branchId != null && Object.prototype.hasOwnProperty.call(myReviewByBranchId, branchId)}
                  onOpenReview={(targetBooking, targetRoom) => setReviewTarget({ booking: targetBooking, room: targetRoom })}
                />
              );
            })}

            {hasMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="mx-auto flex cursor-pointer items-center justify-center rounded-2xl border border-[#E5E7EB] px-5 py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            ) : null}
          </div>
        )}
      </main>

      <CancelModal
        booking={cancelTarget}
        submitting={cancelling}
        onConfirm={handleCancelConfirm}
        onClose={() => setCancelTarget(null)}
      />

      {reviewTarget ? (
        <ReviewForm
          branchId={reviewTarget.room?.branchId}
          branchName={reviewTarget.room?.branchName}
          onClose={() => setReviewTarget(null)}
          onSubmitted={handleReviewSubmitted}
        />
      ) : null}
    </div>
  );
};

export default MyBookingsPage;
