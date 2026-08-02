import { loadStripe } from '@stripe/stripe-js';

// Purpose: single Stripe.js instance shared across the app. Loaded once at module scope —
// never inside a component/effect, or every render would re-fetch stripe.js and reconnect.
// Only the publishable key belongs here; it's meant to be public (tokenizes payment methods,
// can never charge or refund on its own). The secret key lives only on the backend.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default stripePromise;
