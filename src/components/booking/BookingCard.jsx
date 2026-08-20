import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, CalendarDays, CreditCard, Hash, Leaf, MapPin, Sparkles, Star, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency';

const statusMeta = (booking) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (booking.status === 'CANCELLED') {
    return { label: 'Cancelled', classes: 'bg-[#FDE8E8] text-[#9B1E1E]' };
  }
  if (booking.status === 'PENDING') {
    return { label: 'Awaiting payment', classes: 'bg-[#FEF3E2] text-[#9A6400]' };
  }
  if (booking.status === 'CONFIRMED') {
    const checkInDate = parseISO(booking.checkIn);
    const checkOutDate = parseISO(booking.checkOut);
    
    if (checkOutDate < today) {
      // Check-out is in the past
      return { label: 'Completed', classes: 'bg-slate-100 text-slate-600' };
    } else if (checkInDate > today) {
      // Check-in is in the future
      return { label: 'Upcoming', classes: 'bg-[#E2F0E8] text-[#1D6A2D]' };
    } else {
      // Check-in is today or in the past, and check-out is in the future
      return { label: 'Current', classes: 'bg-[#E0F7FF] text-[#0369A1]' };
    }
  }
  return { label: booking.status, classes: 'bg-slate-100 text-slate-600' };
};

// A payment attempt is only meaningful while the booking itself is still PENDING — once
// CONFIRMED/CANCELLED, the booking's own status already tells the full story.
const paymentBadgeOverride = (booking, payment) => {
  if (booking.status !== 'PENDING' || !payment) return null;
  if (payment.status === 'FAILED') return { label: 'Payment failed', classes: 'bg-[#FDE8E8] text-[#9B1E1E]' };
  if (payment.status === 'SUCCEEDED') return { label: 'Paid — confirming', classes: 'bg-[#E2F0E8] text-[#1D6A2D]' };
  if (payment.status === 'REFUNDED') return { label: 'Refunded', classes: 'bg-slate-100 text-slate-600' };
  return null;
};

// Purpose: Booking card shown on the customer bookings page.
const BookingCard = ({ booking, room, roomLoading, payment, canCancel, onCancel, existingReview, reviewChecked, onWriteReview }) => {
  const { format: formatPrice } = useCurrency();
  const status = paymentBadgeOverride(booking, payment) || statusMeta(booking);
  const nights = Math.max(0, Math.round((parseISO(booking.checkOut) - parseISO(booking.checkIn)) / 86400000));
  // Use the room's public-facing random identifier when available (room.roomId).
  // Do NOT use the Cloudinary publicIds field here — that field stores image IDs.
  const roomLink = room?.roomId ? `/rooms/${room.roomId}` : `/rooms/${booking.roomId}`;
  const showPayCta = booking.status === 'PENDING' && (!payment || payment.status === 'PENDING' || payment.status === 'FAILED');
  const payCtaLabel = payment?.status === 'FAILED' ? 'Retry payment' : 'Pay now';
  // Use booking.id as the canonical route param (app routing is /payment/:bookingId)
  const paymentLink = `/payment/${booking.id}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCompletedStay = booking.status === 'CONFIRMED' && parseISO(booking.checkOut) < today;
  const showReviewCta = isCompletedStay && reviewChecked && !existingReview;
  const isEarlyCheckoutCancellation = booking.status === 'CANCELLED'
    && parseISO(booking.checkIn) <= today
    && parseISO(booking.checkOut) > today;
  const hasBookingDetails = booking.services?.length > 0
    || (booking.status === 'CONFIRMED' && booking.ecoPointsEarned > 0)
    || booking.ecoPointsRedeemed > 0
    || isEarlyCheckoutCancellation
    || (isCompletedStay && existingReview);

  return (
    <article className="flex flex-col gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row">
      <div className="h-44 shrink-0 self-start overflow-hidden rounded-2xl bg-gradient-to-br from-[#E6F5F3] to-[#DDEEFF] sm:w-40">
        {room?.images?.[0] ? (
          <img src={room.images[0]} alt={room.roomTypeName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-8 w-8 text-[#0A7C6E]/40" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            {roomLoading ? (
              <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#0A7C6E]">
                  <MapPin className="h-3.5 w-3.5" />
                  {room?.branchName || 'Hotel branch'}
                </p>
                <h3 className="mt-1 font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">
                  {room?.roomTypeName || `Room #${booking.roomId}`}
                </h3>
              </>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${status.classes}`}>
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#0A7C6E]" />
            {format(parseISO(booking.checkIn), 'd MMM yyyy')} <span className="text-slate-300">→</span> {format(parseISO(booking.checkOut), 'd MMM yyyy')}
            <span className="text-slate-400">· {nights} night{nights === 1 ? '' : 's'}</span>
          </span>
        </div>

        {booking.reference ? (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-[#F8F9FA] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
            <Hash className="h-3 w-3" />
            {booking.reference}
          </span>
        ) : null}

        {hasBookingDetails ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {booking.services?.length > 0 ? (
              <div className="min-w-0 rounded-2xl border border-[#DCEFEA] bg-[#F4FBF9] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0A7C6E]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" /> Stay extras
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {booking.services.map((service) => (
                    <span key={service.id} className="rounded-full bg-white px-2.5 py-1 text-xs text-[#374151] shadow-sm">
                      {service.serviceName} × {service.quantity}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {booking.status === 'CONFIRMED' && booking.ecoPointsEarned > 0 ? (
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-[#DCEFEA] bg-[#E6F5F3] px-3 py-2.5 text-xs font-semibold leading-5 text-[#1D6A2D]">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0" />
                You earned {booking.ecoPointsEarned} eco point{booking.ecoPointsEarned === 1 ? '' : 's'} for choosing an eco-friendly stay!
              </div>
            ) : null}

            {booking.ecoPointsRedeemed > 0 ? (
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-[#DCEFEA] bg-[#F4FBF9] px-3 py-2.5 text-xs font-semibold leading-5 text-[#0A7C6E]">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0" />
                {booking.status === 'CANCELLED'
                  ? `${booking.ecoPointsRedeemed} eco points were returned to your balance.`
                  : `${booking.ecoPointsRedeemed} eco points applied — you saved ${formatPrice(booking.ecoPointsDiscount, room?.currency)}.`}
              </div>
            ) : null}

            {isEarlyCheckoutCancellation ? (
              <div className="min-w-0 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2.5 text-sm text-[#1E40AF]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[#1D4ED8]" />
                  <div>
                    <p className="font-semibold">Early checkout cancellation</p>
                    <p className="mt-1 text-xs text-[#334155]">
                      Your stay was cancelled before checkout, and the room is now available again for other guests.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {isCompletedStay && existingReview ? (
              <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#0A7C6E]">
                  <Star className="h-3.5 w-3.5 fill-[#C9A84C] text-[#C9A84C]" />
                  You reviewed this stay — {existingReview.rating}/5
                </p>
                {existingReview.comment ? <p className="mt-1 text-xs text-[#6B7280]">&ldquo;{existingReview.comment}&rdquo;</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F2F4] pt-3">
          <span className="text-lg font-semibold text-[#0A7C6E]">
            {roomLoading ? (
              <span className="inline-block h-5 w-16 animate-pulse rounded-full bg-slate-100 align-middle" />
            ) : (
              formatPrice(booking.totalPrice, room?.currency)
            )}
          </span>
          <div className="flex items-center gap-2">
            {showPayCta ? (
              <Link
                to={paymentLink}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065E52]"
              >
                <CreditCard className="h-4 w-4" />
                {payCtaLabel}
              </Link>
            ) : null}
            <Link
              to={roomLink}
              className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#1A1A2E] transition hover:border-[#0A7C6E] hover:text-[#0A7C6E]"
            >
              View room
            </Link>
            {showReviewCta ? (
              <button
                type="button"
                onClick={() => onWriteReview(booking, room)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#0A7C6E] px-4 py-2 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]"
              >
                <Star className="h-4 w-4" />
                Write review
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                onClick={() => onCancel(booking)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#F5C2C7] px-4 py-2 text-sm font-semibold text-[#9B1E1E] transition hover:bg-[#FEF3F3]"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

export default BookingCard;
