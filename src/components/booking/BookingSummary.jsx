import { ArrowRight, CalendarDays, Info, Loader2 } from 'lucide-react';
import PromoCodeInput from './PromoCodeInput';
import ServiceAddon from './ServiceAddon';
import { useCurrency } from '../../hooks/useCurrency';

// Purpose: Booking summary sidebar used on the room detail page — dates, add-ons, promo, and totals.
// `roomSubtotal` arrives already converted to the selected display currency (the price call it
// came from was made with targetCurrency set); service prices arrive in `serviceCurrency` (the
// branch's native currency) and are converted here since that endpoint has no targetCurrency option.
const BookingSummary = ({
  serviceCurrency,
  checkInLabel,
  checkOutLabel,
  nights,
  priceLoading,
  priceError,
  roomSubtotal,
  services,
  servicesLoading,
  selectedServices,
  onServiceChange,
  promoCode,
  onPromoCodeChange,
  onPromoApply,
  onPromoRemove,
  promoApplying,
  promoResult,
  promoError,
  canSubmit,
  submitting,
  onSubmit,
  submitLabel,
  authRequired,
}) => {
  const { currency, convert, format } = useCurrency();

  const rawServicesTotal = services.reduce(
    (sum, svc) => sum + (selectedServices[svc.id] || 0) * Number(svc.price || 0),
    0,
  );
  const convertedServicesTotal = convert(rawServicesTotal, serviceCurrency);
  const servicesTotalForSum = convertedServicesTotal === null ? rawServicesTotal : convertedServicesTotal;
  const discountAmount = promoResult?.discountAmount || 0;
  const grandTotal = Math.max(0, (roomSubtotal || 0) + servicesTotalForSum - discountAmount);

  return (
    <aside className="sticky top-24 flex flex-col gap-5 rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div>
        <h3 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Booking summary</h3>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#F8F9FA] px-3 py-2.5 text-sm text-[#1A1A2E]">
          <CalendarDays className="h-4 w-4 shrink-0 text-[#0A7C6E]" />
          {checkInLabel && checkOutLabel ? (
            <span>{checkInLabel} <span className="text-[#6B7280]">→</span> {checkOutLabel} <span className="text-[#6B7280]">· {nights} night{nights === 1 ? '' : 's'}</span></span>
          ) : (
            <span className="text-[#6B7280]">Select your dates below</span>
          )}
        </div>
      </div>

      {services.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Add-ons</p>
          {servicesLoading ? (
            <div className="space-y-2">
              {[0, 1].map((key) => <div key={key} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <ServiceAddon
                  key={service.id}
                  service={service}
                  nativeCurrency={serviceCurrency}
                  quantity={selectedServices[service.id] || 0}
                  onChange={(quantity) => onServiceChange(service.id, quantity)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Promo code</p>
        <PromoCodeInput
          code={promoCode}
          onCodeChange={onPromoCodeChange}
          onApply={onPromoApply}
          onRemove={onPromoRemove}
          applying={promoApplying}
          result={promoResult}
          error={promoError}
          disabled={!nights}
        />
      </div>

      <div className="space-y-2 border-t border-[#F1F2F4] pt-4 text-sm">
        <div className="flex items-center justify-between text-[#6B7280]">
          <span>Room subtotal</span>
          <span className="text-[#1A1A2E]">{priceLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#0A7C6E]" /> : format(roomSubtotal, currency)}</span>
        </div>
        {rawServicesTotal > 0 ? (
          <div className="flex items-center justify-between text-[#6B7280]">
            <span>Add-ons</span>
            <span className="text-[#1A1A2E]">{format(rawServicesTotal, serviceCurrency)}</span>
          </div>
        ) : null}
        {discountAmount > 0 ? (
          <div className="flex items-center justify-between text-[#0A7C6E]">
            <span>Promo discount</span>
            <span>-{format(discountAmount, currency)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-[#F1F2F4] pt-3 text-base font-semibold text-[#1A1A2E]">
          <span>Total</span>
          <span>{priceLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#0A7C6E]" /> : format(grandTotal, currency)}</span>
        </div>
      </div>

      {priceError ? <p className="text-xs font-medium text-[#9B1E1E]">{priceError}</p> : null}

      <div title={authRequired ? 'Log in to reserve a room' : undefined}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              {submitLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-[#6B7280]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        You won't be charged yet — this reserves your room, then takes you straight to a secure payment step to confirm it.
      </p>
    </aside>
  );
};

export default BookingSummary;
