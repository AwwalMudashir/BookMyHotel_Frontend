import { AlertTriangle, Loader2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Purpose: Cancellation confirmation dialog for a customer's booking.
const CancelModal = ({ booking, submitting, onConfirm, onClose }) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FDE8E8] text-[#9B1E1E]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-semibold text-[#1A1A2E]">Cancel this booking?</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          You're about to cancel your stay from{' '}
          <span className="font-semibold text-[#1A1A2E]">{format(parseISO(booking.checkIn), 'd MMM yyyy')}</span> to{' '}
          <span className="font-semibold text-[#1A1A2E]">{format(parseISO(booking.checkOut), 'd MMM yyyy')}</span>. This can't be undone.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#9B1E1E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7F1818] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Yes, cancel booking
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 cursor-pointer rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;
