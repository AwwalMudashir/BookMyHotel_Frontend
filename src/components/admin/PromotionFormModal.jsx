import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import promotionApi from '../../api/promotionApi';
import { parseApiError } from '../../utils/parseApiError';

const emptyForm = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  validFrom: '',
  validTo: '',
  maxUses: '',
  minBookingAmount: '',
  maxDiscountAmount: '',
};

// Purpose: Create/edit modal for a single hotel's promotions. `hotelId` and `code` are fixed
// once a promotion exists — the PUT endpoint can't change them, so both are locked in edit mode.
const PromotionFormModal = ({ hotelId, promotion = null, onClose = () => {} }) => {
  const isEdit = Boolean(promotion?.id);
  const [form, setForm] = useState(
    isEdit
      ? {
          code: promotion.code || '',
          discountType: promotion.discountType || 'PERCENTAGE',
          discountValue: promotion.discountValue ?? '',
          validFrom: promotion.validFrom || '',
          validTo: promotion.validTo || '',
          maxUses: promotion.maxUses ?? '',
          minBookingAmount: promotion.minBookingAmount ?? '',
          maxDiscountAmount: promotion.maxDiscountAmount ?? '',
        }
      : emptyForm,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const validate = () => {
    if (!isEdit && !form.code.trim()) return 'Promo code is required.';
    const value = Number(form.discountValue);
    if (form.discountValue === '' || Number.isNaN(value) || value <= 0) return 'Enter a discount value greater than 0.';
    if (!form.validFrom) return 'Valid-from date is required.';
    if (!form.validTo) return 'Valid-to date is required.';
    if (form.validTo < form.validFrom) return 'Valid-to date must be on or after the valid-from date.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

      if (isEdit) {
        await promotionApi.updatePromotion(promotion.id, {
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          validFrom: form.validFrom,
          validTo: form.validTo,
          maxUses: numberOrNull(form.maxUses),
          minBookingAmount: numberOrNull(form.minBookingAmount),
          maxDiscountAmount: numberOrNull(form.maxDiscountAmount),
        });
        toast.success('Promotion updated.');
      } else {
        await promotionApi.createPromotion({
          hotelId,
          code: form.code.trim(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          validFrom: form.validFrom,
          validTo: form.validTo,
          maxUses: numberOrNull(form.maxUses),
          minBookingAmount: numberOrNull(form.minBookingAmount),
          maxDiscountAmount: numberOrNull(form.maxDiscountAmount),
        });
        toast.success('Promotion created.');
      }
      onClose(true);
    } catch (err) {
      const message = parseApiError(err, 'Unable to save this promotion.');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[Playfair_Display] text-2xl font-semibold text-slate-900">
              {isEdit ? 'Edit promotion' : 'New promotion'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isEdit ? 'Update the terms of this promo code.' : 'Create a new discount code for this hotel.'}
            </p>
          </div>
          <button type="button" onClick={() => onClose()} className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="promoCode" className="mb-2 block text-sm font-medium text-slate-700">Promo code</label>
            <input
              id="promoCode"
              type="text"
              value={form.code}
              onChange={updateField('code')}
              disabled={isEdit}
              placeholder="e.g. SUMMER10"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
            {isEdit ? <p className="mt-1.5 text-xs text-slate-400">The code can't be changed — create a new promotion instead.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="discountType" className="mb-2 block text-sm font-medium text-slate-700">Discount type</label>
              <select
                id="discountType"
                value={form.discountType}
                onChange={updateField('discountType')}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="discountValue" className="mb-2 block text-sm font-medium text-slate-700">
                {form.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount amount'}
              </label>
              <input
                id="discountValue"
                type="number"
                min={0}
                step="0.01"
                value={form.discountValue}
                onChange={updateField('discountValue')}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="validFrom" className="mb-2 block text-sm font-medium text-slate-700">Valid from</label>
              <input
                id="validFrom"
                type="date"
                value={form.validFrom}
                onChange={updateField('validFrom')}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
            <div>
              <label htmlFor="validTo" className="mb-2 block text-sm font-medium text-slate-700">Valid to</label>
              <input
                id="validTo"
                type="date"
                value={form.validTo}
                onChange={updateField('validTo')}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="maxUses" className="mb-2 block text-sm font-medium text-slate-700">Max uses (optional)</label>
            <input
              id="maxUses"
              type="number"
              min={0}
              value={form.maxUses}
              onChange={updateField('maxUses')}
              placeholder="Unlimited"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="minBookingAmount" className="mb-2 block text-sm font-medium text-slate-700">Min booking amount (optional)</label>
              <input
                id="minBookingAmount"
                type="number"
                min={0}
                step="0.01"
                value={form.minBookingAmount}
                onChange={updateField('minBookingAmount')}
                placeholder="None"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
            <div>
              <label htmlFor="maxDiscountAmount" className="mb-2 block text-sm font-medium text-slate-700">Max discount amount (optional)</label>
              <input
                id="maxDiscountAmount"
                type="number"
                min={0}
                step="0.01"
                value={form.maxDiscountAmount}
                onChange={updateField('maxDiscountAmount')}
                placeholder="None"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save changes' : 'Create promotion')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromotionFormModal;
