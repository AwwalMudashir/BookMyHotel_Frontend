import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Percent, Plus, Tag, Trash2, Pencil } from 'lucide-react';
import promotionApi from '../../api/promotionApi';
import PromotionFormModal from '../admin/PromotionFormModal';
import { parseApiError } from '../../utils/parseApiError';

const formatDiscount = (promo) =>
  promo.discountType === 'PERCENTAGE' ? `${Number(promo.discountValue)}% off` : `$${Number(promo.discountValue).toFixed(2)} USD off`;

// Purpose: Hotel-scoped promotion management — create, edit, deactivate. Reused by both the
// admin promotions screen (any hotel) and the manager promotions screen (own hotel only);
// the caller decides which hotelId it's scoped to. Only active promotions are ever listed here
// (the same public GET the "active offers" section uses) since a deactivated promo has no
// further action available — there's no reactivate endpoint.
const PromotionManager = ({ hotelId }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const loadPromotions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await promotionApi.getActivePromotions(hotelId);
      setPromotions(data);
    } catch (err) {
      setError(parseApiError(err, 'Unable to load promotions for this hotel.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hotelId) return;
    loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setDeactivating(true);
    try {
      await promotionApi.deactivatePromotion(confirmDeactivate.id);
      toast.success('Promotion deactivated.');
      setConfirmDeactivate(null);
      await loadPromotions();
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to deactivate this promotion.'));
    } finally {
      setDeactivating(false);
    }
  };

  if (!hotelId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Active promotions</h2>
        <button
          type="button"
          onClick={() => { setEditingPromotion(null); setShowForm(true); }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065E52]"
        >
          <Plus className="h-4 w-4" />
          New promotion
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((key) => <div key={key} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-[#F5C2C7] bg-[#FEF3F3] p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-[#B42318]" />
          <p className="text-sm text-[#9B1E1E]">{error}</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[#6B7280]">No active promotions for this hotel yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => (
            <div key={promo.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#0A7C6E]">
                {promo.discountType === 'PERCENTAGE' ? <Percent className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
              </span>
              <div className="min-w-[140px] flex-1">
                <p className="font-mono text-sm font-semibold text-[#1A1A2E]">{promo.code}</p>
                <p className="text-xs text-[#6B7280]">{formatDiscount(promo)}</p>
              </div>
              <div className="text-xs text-[#6B7280]">
                {format(parseISO(promo.validFrom), 'd MMM yyyy')} → {format(parseISO(promo.validTo), 'd MMM yyyy')}
              </div>
              <div className="text-xs text-[#6B7280]">
                {promo.maxUses ? `${promo.timesUsed}/${promo.maxUses} used` : `${promo.timesUsed} uses`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingPromotion(promo); setShowForm(true); }}
                  title="Edit"
                  className="rounded-full p-2 text-slate-500 transition hover:text-[#0A7C6E]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(promo)}
                  title="Deactivate"
                  className="rounded-full p-2 text-slate-500 transition hover:text-[#9B1E1E]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <PromotionFormModal
          hotelId={hotelId}
          promotion={editingPromotion}
          onClose={(didSave) => {
            setShowForm(false);
            if (didSave) loadPromotions();
          }}
        />
      ) : null}

      {confirmDeactivate ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/40 p-4 sm:p-6">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 sm:max-h-[calc(100dvh-3rem)] sm:p-6">
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Deactivate this promotion?</h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              <span className="font-mono font-semibold">{confirmDeactivate.code}</span> will stop working for new bookings.
              This can't be reversed from here — there's no reactivate option, only creating a new code.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setConfirmDeactivate(null)} disabled={deactivating} className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm disabled:opacity-60">Cancel</button>
              <button onClick={handleDeactivate} disabled={deactivating} className="rounded-full bg-[#9B1E1E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {deactivating ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PromotionManager;
