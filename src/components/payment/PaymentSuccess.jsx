import { Link } from 'react-router-dom';
import { CheckCircle2, Hash, Leaf } from 'lucide-react';
import { format as formatDate, parseISO } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency';

// Purpose: Payment success confirmation screen.
const PaymentSuccess = ({ payment, ecoPointsEarned = 0 }) => {
  const { format } = useCurrency();

  return (
    <div className="flex flex-col items-center rounded-[28px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E2F0E8] text-[#1D6A2D]">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h1 className="mt-4 font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">Payment successful</h1>
      <p className="mt-2 text-sm text-[#6B7280]">
        {payment?.amount != null ? `${format(payment.amount, payment.currency)} paid` : 'Your payment was received'}
        {payment?.paidAt ? ` on ${formatDate(parseISO(payment.paidAt), 'd MMM yyyy, HH:mm')}` : ''}.
      </p>
      <p className="mt-1 text-sm text-[#6B7280]">Your booking is confirmed — a confirmation email is on its way.</p>

      {payment?.bookingId != null ? (
        <span className="mt-4 flex items-center gap-1.5 rounded-full bg-[#F8F9FA] px-3 py-1.5 text-xs font-semibold text-[#6B7280]">
          <Hash className="h-3 w-3" />
          Booking reference: {payment.bookingId}
        </span>
      ) : null}

      {ecoPointsEarned > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#DCEFEA] bg-[#E6F5F3] px-3 py-2.5 text-xs font-semibold text-[#1D6A2D]">
          <Leaf className="h-4 w-4 shrink-0" />
          You earned {ecoPointsEarned} eco point{ecoPointsEarned === 1 ? '' : 's'} for choosing an eco-friendly stay!
        </div>
      ) : null}

      <Link
        to="/my-bookings"
        className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52]"
      >
        View my bookings
      </Link>
    </div>
  );
};

export default PaymentSuccess;
