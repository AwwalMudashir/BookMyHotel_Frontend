import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import PolicyInfoModal from '../booking/PolicyInfoModal';
import useUnsavedChangesWarning from '../../hooks/useUnsavedChangesWarning';

// Purpose: renders the payment methods supported by the current Stripe PaymentIntent.
const StripeForm = ({ bookingId, payLabel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyReviewed, setPolicyReviewed] = useState(false);
  const [paymentDetailsEntered, setPaymentDetailsEntered] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  useUnsavedChangesWarning(paymentDetailsEntered && !submitting);

  const processPayment = async () => {
    if (!stripe || !elements || !paymentElementReady) {
      setErrorMessage('The secure payment form is not ready. Please reload the page and try again.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bookings/${bookingId}/payment-return`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Something went wrong confirming your payment.');
        return;
      }

      // The return page verifies the server-side result and recovers missed local webhooks.
      navigate(`/bookings/${bookingId}/payment-return`);
    } catch (error) {
      setErrorMessage(error?.message || 'The secure payment form could not be submitted. Please reload and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!stripe || !elements || !paymentElementReady) return;
    if (!policyReviewed) {
      setPolicyOpen(true);
      return;
    }
    processPayment();
  };

  const handlePolicyContinue = () => {
    setPolicyReviewed(true);
    setPolicyOpen(false);
    processPayment();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <PaymentElement
          onReady={() => {
            setPaymentElementReady(true);
            setErrorMessage('');
          }}
          onLoaderror={(event) => {
            setPaymentElementReady(false);
            setErrorMessage(event?.error?.message || 'The secure payment form could not load. Please reload the page.');
          }}
          onChange={(event) => {
            setPaymentDetailsEntered(!event.empty);
            if (event.error) setErrorMessage(event.error.message);
          }}
        />

        {errorMessage ? <p className="text-sm font-medium text-[#9B1E1E]">{errorMessage}</p> : null}

        <button
          type="submit"
          disabled={!stripe || !elements || !paymentElementReady || submitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
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

      {policyOpen ? (
        <PolicyInfoModal
          context="payment"
          busy={submitting}
          onClose={() => setPolicyOpen(false)}
          onContinue={handlePolicyContinue}
          continueLabel={payLabel}
        />
      ) : null}
    </>
  );
};

export default StripeForm;
