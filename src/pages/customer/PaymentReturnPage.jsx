import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Loader2 } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import PaymentSuccess from '../../components/payment/PaymentSuccess';
import PaymentFailed from '../../components/payment/PaymentFailed';
import paymentApi from '../../api/paymentApi';
import bookingApi from '../../api/bookingApi';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = Math.ceil(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);

// Purpose: lands here after Stripe's confirmPayment (in-page or via a real browser redirect
// for 3D Secure/wallets). Neither of those means the booking is confirmed — only the webhook
// reaching the backend does that — so this page is the one place that polls the real source
// of truth, GET /payments/{bookingId}, until it settles or times out.
const PaymentReturnPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('polling'); // polling | succeeded | failed | timeout
  const [payment, setPayment] = useState(null);
  const [ecoPointsEarned, setEcoPointsEarned] = useState(0);
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);

  const poll = async () => {
    attemptsRef.current += 1;
    try {
      const data = await paymentApi.getPayment(bookingId);

      if (data?.status === 'SUCCEEDED') {
        setPayment(data);
        setPhase('succeeded');
        // GET /payments/{bookingId} doesn't carry ecoPointsEarned — best-effort look it up
        // from the bookings list so the confirmation screen can show the eco-points callout.
        try {
          const bookings = await bookingApi.getBookings({ page: 0, size: 20 });
          const list = Array.isArray(bookings) ? bookings : bookings?.content || [];
          const matched = list.find((b) => String(b.id) === String(bookingId));
          if (matched?.ecoPointsEarned > 0) setEcoPointsEarned(matched.ecoPointsEarned);
        } catch {
          // Non-critical — the callout simply won't show if this lookup fails.
        }
        return;
      }
      if (data?.status === 'FAILED') {
        setPayment(data);
        setPhase('failed');
        return;
      }

      // PENDING, or no payment record yet (getPayment returns null on a 404) — keep polling.
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setPhase('timeout');
        return;
      }
      timerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
    } catch {
      // A transient network hiccup shouldn't end the flow on one blip — keep trying until timeout.
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setPhase('timeout');
        return;
      }
      timerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
    }
  };

  const restartPolling = () => {
    clearTimeout(timerRef.current);
    attemptsRef.current = 0;
    setPhase('polling');
    poll();
  };

  useEffect(() => {
    poll();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
        {phase === 'polling' ? (
          <div className="flex flex-col items-center rounded-[28px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-[#0A7C6E]" />
            <h1 className="mt-4 font-[Playfair_Display] text-xl font-semibold text-[#1A1A2E]">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-[#6B7280]">This usually takes just a few seconds. Please don't close this page.</p>
          </div>
        ) : phase === 'succeeded' ? (
          <PaymentSuccess payment={payment} ecoPointsEarned={ecoPointsEarned} />
        ) : phase === 'failed' ? (
          <PaymentFailed onRetry={() => navigate(`/payment/${bookingId}`)} />
        ) : (
          <div className="flex flex-col items-center rounded-[28px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3E2] text-[#9A6400]">
              <Clock className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-[Playfair_Display] text-xl font-semibold text-[#1A1A2E]">Still processing</h1>
            <p className="mt-2 max-w-sm text-sm text-[#6B7280]">
              Your payment is taking longer than usual to confirm. It's likely still going through — check My Bookings shortly, or check again now.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={restartPolling}
                className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52]"
              >
                Check again
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[#E5E7EB] px-5 py-3 text-sm font-semibold text-[#1A1A2E] transition hover:bg-slate-50"
              >
                Go to My Bookings
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentReturnPage;
