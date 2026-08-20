import { Check, Tag, X } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

// Purpose: Promo code input with discount application support.
// `result.discountAmount` arrives already in the current display currency (it was computed
// against a totalPrice we'd already converted), so no further conversion happens here.
const PromoCodeInput = ({ code, onCodeChange, onApply, onRemove, applying, result, error, disabled }) => {
  const { currency, format } = useCurrency();

  if (result) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#0A7C6E]/30 bg-[#E6F5F3] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A7C6E] text-white">
            <Check className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#0A7C6E]">{result.promoCode} applied</p>
            <p className="text-xs text-[#065E52]/80">
              -{format(result.discountAmount, currency)} off your room
              {result.discountType === 'FIXED_AMOUNT' && currency !== 'USD' ? ' · converted from USD' : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#0A7C6E] transition hover:bg-white"
          aria-label="Remove promo code"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0A7C6E]" />
          <input
            type="text"
            value={code}
            disabled={disabled || applying}
            onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
            placeholder="Promo code"
            className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={disabled || applying || !code.trim()}
          className="shrink-0 cursor-pointer rounded-xl border border-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3] disabled:cursor-not-allowed disabled:border-[#E5E7EB] disabled:text-slate-400 disabled:hover:bg-transparent"
        >
          {applying ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-[#9B1E1E]">{error}</p> : null}
    </div>
  );
};

export default PromoCodeInput;
