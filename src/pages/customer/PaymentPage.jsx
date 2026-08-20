import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { AlertCircle, ArrowLeft, CalendarDays, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import StripeForm from '../../components/payment/StripeForm';
import stripePromise from '../../lib/stripe';
import paymentApi from '../../api/paymentApi';
import bookingApi from '../../api/bookingApi';
import { useCurrency } from '../../hooks/useCurrency';
import { parseApiError } from '../../utils/parseApiError';

// Purpose: Customer payment screen — creates the PaymentIntent for a PENDING booking and
// hosts Stripe's Payment Element for the actual card/wallet entry.
const PaymentPage = () => {
  // Route historically used bookingId as the param name: /payment/:bookingId
  // but some external links may pass a paymentId. Support both for robustness.
  const params = useParams();
  const paymentIdParam = params.paymentId || null;
  const bookingIdParam = params.bookingId || null;
  const navigate = useNavigate();
  const { format } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intent, setIntent] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  const handleIntentResponse = (data, resolvedBookingId) => {
    const waitingForStripe = ['processing', 'requires_capture'].includes(data?.stripeStatus);
    if (data?.status === 'SUCCEEDED' || waitingForStripe) {
      navigate(`/bookings/${resolvedBookingId}/payment-return`, { replace: true });
      return;
    }
    if (!data?.clientSecret) {
      throw new Error('No payable Stripe session was returned for this booking.');
    }
    setIntent(data);
  };

  const loadIntent = async () => {
    setLoading(true);
    setError('');
    try {
      // Two supported flows:
      // 1) Route provides a paymentId (public id) -> lookup payment by paymentId to get bookingId
      // 2) Route provides a bookingId -> create/retrieve intent for that booking directly
      if (paymentIdParam) {
        const payment = await paymentApi.getPaymentByPaymentId(paymentIdParam);
        if (!payment) {
          setError('Payment not found. Please check the payment link.');
          return;
        }
        setBookingId(payment.bookingId);
        const [data, details] = await Promise.all([
          paymentApi.createIntent(payment.bookingId),
          bookingApi.getBooking(payment.bookingId).catch(() => null),
        ]);
        handleIntentResponse(data, payment.bookingId);
        setBookingDetails(details);
      } else if (bookingIdParam) {
        // If route carried bookingId, just create/retrieve intent for that booking.
        setBookingId(bookingIdParam);
        const [data, details] = await Promise.all([
          paymentApi.createIntent(bookingIdParam),
          bookingApi.getBooking(bookingIdParam).catch(() => null),
        ]);
        handleIntentResponse(data, bookingIdParam);
        setBookingDetails(details);
      } else {
        setError('Invalid payment link.');
        return;
      }
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
    // Re-run if either param changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIdParam, bookingIdParam]);

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
              {bookingDetails ? (
                <div className="mt-5 rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                  {bookingDetails.hotelName ? <p className="font-semibold text-[#1A1A2E]">{bookingDetails.hotelName}</p> : null}
                  <p className="mt-1 flex items-center gap-2 text-sm text-[#6B7280]">
                    <CalendarDays className="h-4 w-4 text-[#0A7C6E]" />
                    {bookingDetails.checkIn} → {bookingDetails.checkOut}
                  </p>
                  {bookingDetails.services?.length > 0 ? (
                    <div className="mt-4 border-t border-[#E5E7EB] pt-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0A7C6E]"><Sparkles className="h-3.5 w-3.5" /> Included services</p>
                      <div className="space-y-2">
                        {bookingDetails.services.map((service) => (
                          <div key={service.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-[#1A1A2E]">{service.serviceName} × {service.quantity}</span>
                            <span className="font-medium text-[#0A7C6E]">{format(service.subtotal, intent.currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {bookingDetails.ecoPointsRedeemed > 0 ? (
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#DCEFEA] pt-3 text-sm text-[#0A7C6E]">
                      <span className="flex items-center gap-1.5 font-medium"><Leaf className="h-4 w-4" /> Eco points ({bookingDetails.ecoPointsRedeemed})</span>
                      <span className="font-semibold">-{format(bookingDetails.ecoPointsDiscount, intent.currency)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#F8F9FA] px-4 py-3.5 text-sm">
                <span className="text-[#6B7280]">Amount due</span>
                <span className="text-lg font-semibold text-[#0A7C6E]">{format(intent.amount, intent.currency)}</span>
              </div>

              <div className="mt-6">
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <StripeForm bookingId={bookingId} payLabel={`Pay ${format(intent.amount, intent.currency)}`} />
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
