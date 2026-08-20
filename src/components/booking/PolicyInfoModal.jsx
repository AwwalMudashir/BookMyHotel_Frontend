import { useEffect } from 'react';
import { ArrowRight, CalendarX2, Loader2, RefreshCcw, ShieldCheck, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

const contextCopy = {
  booking: {
    eyebrow: 'Booking information',
    title: 'Before you reserve',
    description: 'Here is how cancellation, refunds, and travel protection currently work for this booking.',
  },
  payment: {
    eyebrow: 'Payment information',
    title: 'Know your options before paying',
    description: 'Review what happens if your plans change after payment.',
  },
  cancellation: {
    eyebrow: 'Cancellation policy',
    title: 'Cancel this booking?',
    description: 'Please review the consequences before you permanently cancel this stay.',
  },
};

const formatStay = (booking) => {
  if (!booking?.checkIn || !booking?.checkOut) return '';
  const checkIn = parseISO(booking.checkIn);
  const checkOut = parseISO(booking.checkOut);
  if (!isValid(checkIn) || !isValid(checkOut)) return '';
  return `${format(checkIn, 'd MMM yyyy')} to ${format(checkOut, 'd MMM yyyy')}`;
};

const refundDescription = (payment) => {
  if (payment?.status === 'SUCCEEDED') {
    return 'A paid cancellation sends a refund request to Stripe for the original payment method. Your bank or card provider controls when the money appears.';
  }
  if (payment?.status === 'PENDING' || payment?.status === 'FAILED') {
    return 'There is no completed charge to refund for this booking. Any temporary bank authorisation normally expires according to your provider’s rules.';
  }
  if (payment?.status === 'REFUNDED') {
    return 'This payment is already marked as refunded. Your bank or card provider controls when the credit appears on your statement.';
  }
  return 'If a completed payment is refundable, the cancellation process requests the refund to the original payment method. Provider processing times vary.';
};

const PolicyInfoModal = ({
  context = 'booking',
  booking = null,
  payment = null,
  onClose,
  onContinue,
  continueLabel,
  busy = false,
}) => {
  const copy = contextCopy[context] || contextCopy.booking;
  const destructive = context === 'cancellation';
  const stay = formatStay(booking);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`policy-title-${context}`}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-[28px] border border-white/70 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${destructive ? 'bg-[#FDE8E8] text-[#9B1E1E]' : 'bg-[#E6F5F3] text-[#0A7C6E]'}`}>
              {destructive ? <CalendarX2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </span>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${destructive ? 'text-[#9B1E1E]' : 'text-[#0A7C6E]'}`}>
                {copy.eyebrow}
              </p>
              <h2 id={`policy-title-${context}`} className="mt-1 font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">
                {copy.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">{copy.description}</p>
              {stay ? <p className="mt-2 text-sm font-semibold text-[#1A1A2E]">Stay: {stay}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close policy information"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5 sm:px-7">
          <article className="flex gap-3 rounded-2xl border border-[#DCEFEA] bg-[#F2FBF9] p-4">
            <CalendarX2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0A7C6E]" />
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A2E]">Cancellation</h3>
              <p className="mt-1 text-sm leading-6 text-[#4B5563]">
                A cancellation request can currently be made from My Bookings until checkout. Cancelling after check-in ends the stay early and releases the remaining room dates. Cancellation cannot be undone.
              </p>
            </div>
          </article>

          <article className="flex gap-3 rounded-2xl border border-[#DBEAFE] bg-[#F5F9FF] p-4">
            <RefreshCcw className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A2E]">Refund process</h3>
              <p className="mt-1 text-sm leading-6 text-[#4B5563]">{refundDescription(payment)}</p>
              <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                An itemised refund estimate is not currently shown before cancellation. Contact support before proceeding if you need the exact refundable amount confirmed.
              </p>
            </div>
          </article>

          <article className="flex gap-3 rounded-2xl border border-[#FDE7B2] bg-[#FFFBEB] p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#B7791F]" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#1A1A2E]">Travel protection</h3>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#92400E]">
                  Not currently offered
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-[#4B5563]">
                BookMyHotel does not currently sell travel insurance at checkout. Third-party cover is separate, and cancelling here does not submit an insurance claim. Keep your booking and cancellation records for your insurer.
              </p>
            </div>
          </article>

          <p className="px-1 text-xs leading-5 text-[#6B7280]">
            This summary describes the current BookMyHotel workflow. Any hotel-specific terms shown in your booking confirmation also apply.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row-reverse sm:px-7">
          <button
            type="button"
            onClick={onContinue}
            disabled={busy}
            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? 'bg-[#9B1E1E] hover:bg-[#7F1818]' : 'bg-[#0A7C6E] hover:bg-[#065E52]'}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {continueLabel || (destructive ? 'Cancel booking' : 'Continue')}
            {!busy && !destructive ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 cursor-pointer rounded-2xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#1A1A2E] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {destructive ? 'Keep booking' : 'Go back'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default PolicyInfoModal;
