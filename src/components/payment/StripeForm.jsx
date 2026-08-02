import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';

// Purpose: Stripe Payment Element form — renders whatever payment methods the PaymentIntent
// supports (card, wallets, etc.) without us hardcoding any of them.
const StripeForm = ({ bookingId, payLabel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}/payment-return`,
      },
    });

    // Payment methods that need a redirect (3D Secure, some wallets) navigate the browser
    // away to return_url before this promise ever resolves — this code never runs for those.
    // For methods that don't redirect (most card payments), it resolves here — but a missing
    // error only means Stripe accepted the card, not that the booking is confirmed. The
    // webhook still has to land on the backend, so send the user to the page that actually
    // polls GET /payments/{bookingId} for the real outcome.
    if (error) {
      setErrorMessage(error.message || 'Something went wrong confirming your payment.');
      setSubmitting(false);
      return;
    }

    navigate(`/bookings/${bookingId}/payment-return`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PaymentElement />

      {errorMessage ? <p className="text-sm font-medium text-[#9B1E1E]">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            {payLabel}
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-[#6B7280]">
        <Lock className="h-3 w-3" />
        Payments are securely processed by Stripe.
      </p>
    </form>
  );
};

export default StripeForm;
