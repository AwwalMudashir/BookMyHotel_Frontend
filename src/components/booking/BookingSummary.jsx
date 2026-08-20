import { useEffect } from 'react';
import { ArrowRight, CalendarDays, Info, Leaf, Loader2 } from 'lucide-react';
import PromoCodeInput from './PromoCodeInput';
import { useCurrency } from '../../hooks/useCurrency';

// Purpose: Booking summary sidebar used on the room detail page — dates, add-ons, promo, and totals.
// `roomSubtotal` arrives already converted to the selected display currency (the price call it
// came from was made with targetCurrency set). Service prices are stored in USD and converted
// here into the customer's selected display currency before totals are combined.
const BookingSummary = ({
  checkInLabel,
  checkOutLabel,
  nights,
  priceLoading,
  priceError,
  roomSubtotal,
  services,
  selectedServices,
  promoCode,
  onPromoCodeChange,
  onPromoApply,
  onPromoRemove,
  promoApplying,
  promoResult,
  promoError,
  availableEcoPoints = 0,
  ecoPointsToRedeem = 0,
  onEcoPointsChange,
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
  const convertedServicesTotal = rawServicesTotal > 0 ? convert(rawServicesTotal, 'USD') : 0;
  const serviceConversionUnavailable = rawServicesTotal > 0 && convertedServicesTotal === null;
  const servicesTotalForSum = convertedServicesTotal ?? 0;
  const discountAmount = promoResult?.discountAmount || 0;
  const roomAfterPromo = Math.max(0, (roomSubtotal || 0) - discountAmount);
  const oneUsdInDisplayCurrency = convert(1, 'USD');
  const walletValue = convert(availableEcoPoints / 10, 'USD');
  const maximumPointsForRoom = oneUsdInDisplayCurrency > 0
    ? Math.max(0, Math.min(availableEcoPoints, Math.floor((roomAfterPromo / oneUsdInDisplayCurrency) * 10)))
    : 0;
  const safeEcoPoints = Math.min(ecoPointsToRedeem, maximumPointsForRoom);
  const convertedEcoDiscount = convert(safeEcoPoints / 10, 'USD');
  const ecoDiscount = Math.min(roomAfterPromo, convertedEcoDiscount || 0);
  const grandTotal = serviceConversionUnavailable
    ? null
    : Math.max(0, roomAfterPromo + servicesTotalForSum - ecoDiscount);
  const selectedServiceList = services.filter((service) => selectedServices[service.id] > 0);

  useEffect(() => {
    if (ecoPointsToRedeem > maximumPointsForRoom) {
      onEcoPointsChange(maximumPointsForRoom);
    }
  }, [ecoPointsToRedeem, maximumPointsForRoom, onEcoPointsChange]);

  const ecoPointsEnabled = safeEcoPoints > 0;
  const toggleEcoPoints = () => {
    onEcoPointsChange(ecoPointsEnabled ? 0 : Math.min(10, maximumPointsForRoom));
  };

  const updateEcoPoints = (value) => {
    const parsed = Number.parseInt(value, 10);
    onEcoPointsChange(Math.max(0, Math.min(Number.isNaN(parsed) ? 0 : parsed, maximumPointsForRoom)));
  };

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

      {selectedServiceList.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Selected services</p>
          <div className="space-y-2 rounded-2xl bg-[#F8F9FA] p-3">
            {selectedServiceList.map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[#1A1A2E]">{service.name} × {selectedServices[service.id]}</span>
                <span className="shrink-0 font-medium text-[#0A7C6E]">{format(Number(service.price || 0) * selectedServices[service.id], 'USD')}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {availableEcoPoints > 0 && nights > 0 ? (
        <div className="rounded-2xl border border-[#BFE3D8] bg-[#F4FBF9] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0F3ED] text-[#0A7C6E]">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Use your eco points</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#59636F]">
                  You have {availableEcoPoints.toLocaleString()} points (worth {walletValue === null ? `USD ${(availableEcoPoints / 10).toFixed(2)}` : format(walletValue, currency)}).
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ecoPointsEnabled}
              aria-label="Use eco points"
              onClick={toggleEcoPoints}
              disabled={maximumPointsForRoom === 0}
              className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${ecoPointsEnabled ? 'bg-[#0A7C6E]' : 'bg-slate-300'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${ecoPointsEnabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {ecoPointsEnabled ? (
            <div className="mt-4 border-t border-[#DCEFEA] pt-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="eco-points-input" className="text-xs font-semibold text-[#374151]">Points to redeem</label>
                <input
                  id="eco-points-input"
                  type="number"
                  min="1"
                  max={maximumPointsForRoom}
                  step="1"
                  value={safeEcoPoints}
                  onChange={(event) => updateEcoPoints(event.target.value)}
                  className="w-24 rounded-xl border border-[#BFE3D8] bg-white px-3 py-2 text-right text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
                />
              </div>
              <input
                type="range"
                min="1"
                max={maximumPointsForRoom}
                step="1"
                value={safeEcoPoints}
                onChange={(event) => updateEcoPoints(event.target.value)}
                aria-label="Eco points to redeem"
                className="mt-3 w-full accent-[#0A7C6E]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#6B7280]">
                <span>10 points = USD 1</span>
                <span>Saving {format(ecoDiscount, currency)}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6B7280]">
                Points reduce the room price after any promo. Paid services are not discounted.
              </p>
            </div>
          ) : null}
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
            <span className="text-[#1A1A2E]">{format(rawServicesTotal, 'USD')}</span>
          </div>
        ) : null}
        {discountAmount > 0 ? (
          <div className="flex items-center justify-between text-[#0A7C6E]">
            <span>Promo discount</span>
            <span>-{format(discountAmount, currency)}</span>
          </div>
        ) : null}
        {ecoDiscount > 0 ? (
          <div className="flex items-center justify-between text-[#0A7C6E]">
            <span>Eco points ({safeEcoPoints.toLocaleString()})</span>
            <span>-{format(ecoDiscount, currency)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-[#F1F2F4] pt-3 text-base font-semibold text-[#1A1A2E]">
          <span>Total</span>
          <span>{priceLoading || serviceConversionUnavailable ? <Loader2 className="h-4 w-4 animate-spin text-[#0A7C6E]" /> : format(grandTotal, currency)}</span>
        </div>
      </div>

      {priceError ? <p className="text-xs font-medium text-[#9B1E1E]">{priceError}</p> : null}
      {serviceConversionUnavailable ? (
        <p className="text-xs font-medium text-[#9B1E1E]">Waiting for the USD exchange rate before calculating your add-ons.</p>
      ) : null}

      <div title={authRequired ? 'Log in to reserve a room' : undefined}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting || serviceConversionUnavailable}
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
