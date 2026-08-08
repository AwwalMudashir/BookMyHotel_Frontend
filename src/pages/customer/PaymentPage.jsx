import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import StripeForm from '../../components/payment/StripeForm';
import stripePromise from '../../lib/stripe';
import paymentApi from '../../api/paymentApi';
import { useCurrency } from '../../hooks/useCurrency';
import { parseApiError } from '../../utils/parseApiError';

// Purpose: Customer payment screen — creates the PaymentIntent for a PENDING booking and
// hosts Stripe's Payment Element for the actual card/wallet entry.
const PaymentPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { format } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intent, setIntent] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  const loadIntent = async () => {
    setLoading(true);
    setError('');
    try {
      // First, fetch payment details using paymentId to get the bookingId
      const payment = await paymentApi.getPaymentByPaymentId(paymentId);
      if (!payment) {
        setError('Payment not found. Please check the payment link.');
        return;
      }
      setBookingId(payment.bookingId);
      
      // Then create/retrieve the payment intent using the bookingId
      const data = await paymentApi.createIntent(payment.bookingId);
      setIntent(data);
    } catch (err) {
      // A 502 means Stripe itself rejected the request — that's not something a customer can
      // act on, so show a generic message rather than whatever Stripe's own text says.
      if (err?.response?.status === 502) {
        setError("We couldn't start payment right now. Please try again in a moment.");
      } else {
        setError(parseApiError(err, 'Unable to start payment for this booking.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // loadIntent is also reused by the "Try again" button, which is why it's declared
    // outside the effect rather than as an effect-local function.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const elementsOptions = intent?.clientSecret
    ? {
        clientSecret: intent.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0A7C6E',
            colorText: '#1A1A2E',
            colorDanger: '#9B1E1E',
            fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            borderRadius: '12px',
          },
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/my-bookings')}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#0A7C6E] transition hover:border-[#0A7C6E] hover:bg-[#E6F5F3]"
        >
          <ArrowLeft size={16} />
          My bookings
        </button>

        <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">Complete your payment</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Booking #{bookingId}</p>

          {loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-[#F5C2C7] bg-[#FEF3F3] p-6 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#B42318]" />
              <p className="text-sm text-[#9B1E1E]">{error}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={loadIntent}
                  className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#0A7C6E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52]"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/my-bookings')}
                  className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#1A1A2E] transition hover:bg-slate-50"
                >
                  Back to My Bookings
                </button>
              </div>
            </div>
          ) : intent ? (
            <>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#F8F9FA] px-4 py-3.5 text-sm">
                <span className="text-[#6B7280]">Amount due</span>
                <span className="text-lg font-semibold text-[#0A7C6E]">{format(intent.amount, intent.currency)}</span>
              </div>

              <div className="mt-6">
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <StripeForm paymentId={paymentId} bookingId={bookingId} payLabel={`Pay ${format(intent.amount, intent.currency)}`} />
                </Elements>
              </div>
            </>
          ) : null}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#6B7280]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0A7C6E]" />
          Your card details never touch our servers.
        </p>
      </main>
    </div>
  );
};

export default PaymentPage;
