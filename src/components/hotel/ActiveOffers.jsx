import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Tag } from 'lucide-react';
import promotionApi from '../../api/promotionApi';

const formatDiscount = (promo) =>
  promo.discountType === 'PERCENTAGE' ? `${Number(promo.discountValue)}% off` : `$${Number(promo.discountValue).toFixed(2)} USD off`;

// Purpose: Public "active offers" strip for a hotel page — fed by the public
// GET /promotions?hotelId= endpoint, no auth required. Renders nothing while loading,
// on error, or when the hotel simply has no active promotions right now.
const ActiveOffers = ({ hotelId }) => {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    if (!hotelId) return;
    let cancelled = false;
    promotionApi.getActivePromotions(hotelId)
      .then((data) => { if (!cancelled) setPromotions(data); })
      .catch(() => { if (!cancelled) setPromotions([]); });
    return () => { cancelled = true; };
  }, [hotelId]);

  if (promotions.length === 0) return null;

  return (
    <section className="rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 font-[Playfair_Display] text-xl font-semibold text-[#1A1A2E]">Available offers</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {promotions.map((promo) => (
          <div key={promo.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-[#0A7C6E]/40 bg-[#E6F5F3] px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0A7C6E]">
              <Tag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold text-[#0A7C6E]">{promo.code}</p>
              <p className="text-xs text-[#1A1A2E]/70">
                {formatDiscount(promo)} · valid until {format(parseISO(promo.validTo), 'd MMM yyyy')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActiveOffers;
