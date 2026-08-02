import { XCircle } from 'lucide-react';

// Purpose: Payment failure state with retry guidance.
const PaymentFailed = ({ onRetry }) => (
  <div className="flex flex-col items-center rounded-[28px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE8E8] text-[#9B1E1E]">
      <XCircle className="h-7 w-7" />
    </span>
    <h1 className="mt-4 font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">Payment failed</h1>
    <p className="mt-2 max-w-sm text-sm text-[#6B7280]">
      Your card wasn't charged and your room is still reserved as pending — you can try paying again.
    </p>

    <button
      type="button"
      onClick={onRetry}
      className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52]"
    >
      Try again
    </button>
  </div>
);

export default PaymentFailed;
