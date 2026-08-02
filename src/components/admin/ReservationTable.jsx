import { CheckCircle2, Loader2, Leaf, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency';

const statusClasses = {
  PENDING: 'bg-[#FEF3E2] text-[#9A6400]',
  CONFIRMED: 'bg-[#E2F0E8] text-[#1D6A2D]',
  CANCELLED: 'bg-[#FDE8E8] text-[#9B1E1E]',
};

// Purpose: Admin reservation oversight table. Confirm/Cancel run the same real side effects
// as the payment webhook / customer cancellation (eco points, promo usage, refunds, emails) —
// this is not a raw status editor, so actions are only offered where they're a real transition.
const ReservationTable = ({ bookings = [], roomsById = {}, actingId = null, onConfirm, onCancel }) => {
  const { format: formatPrice } = useCurrency();

  if (bookings.length === 0) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">No reservations match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] table-fixed">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            <th className="w-1/6 py-3">Room</th>
            <th className="w-1/12 py-3">Guest</th>
            <th className="w-1/6 py-3">Stay</th>
            <th className="w-1/12 py-3">Status</th>
            <th className="w-1/12 py-3">Total</th>
            <th className="w-1/12 py-3">Eco points</th>
            <th className="w-1/6 py-3">Booked on</th>
            <th className="w-1/6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F2F4]">
          {bookings.map((booking) => {
            const room = roomsById[booking.roomId];
            const isActing = actingId === booking.id;
            const canConfirm = booking.status === 'PENDING';
            const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

            return (
              <tr key={booking.id} className="align-top">
                <td className="py-4">
                  <p className="font-medium text-[#1A1A2E]">{room?.roomTypeName || `Room #${booking.roomId}`}</p>
                  <p className="text-xs text-[#6B7280]">{room?.branchName || '—'}</p>
                </td>
                <td className="py-4 text-sm text-[#6B7280]">#{booking.userId}</td>
                <td className="py-4 text-sm text-[#6B7280]">
                  {format(parseISO(booking.checkIn), 'd MMM yyyy')}
                  <span className="text-slate-300"> → </span>
                  {format(parseISO(booking.checkOut), 'd MMM yyyy')}
                </td>
                <td className="py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 text-sm font-semibold text-[#1A1A2E]">
                  {formatPrice(booking.totalPrice, room?.currency)}
                </td>
                <td className="py-4 text-sm">
                  {booking.ecoPointsEarned > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[#1D6A2D]">
                      <Leaf className="h-3.5 w-3.5" />
                      {booking.ecoPointsEarned}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-4 text-sm text-[#6B7280]">
                  {booking.createdAt ? format(parseISO(booking.createdAt), 'd MMM yyyy, HH:mm') : '—'}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {canConfirm ? (
                      <button
                        type="button"
                        onClick={() => onConfirm(booking)}
                        disabled={isActing}
                        title="Confirm this booking"
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#0A7C6E] px-3 py-1.5 text-xs font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm
                      </button>
                    ) : null}
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => onCancel(booking)}
                        disabled={isActing}
                        title="Cancel this booking"
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#F5C2C7] px-3 py-1.5 text-xs font-semibold text-[#9B1E1E] transition hover:bg-[#FEF3F3] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Cancel
                      </button>
                    ) : null}
                    {!canConfirm && !canCancel ? <span className="text-xs text-slate-300">No actions</span> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ReservationTable;
