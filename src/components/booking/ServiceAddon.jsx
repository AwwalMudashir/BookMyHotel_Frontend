import { Minus, Plus, Sparkles } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { serviceTypeIcons } from '../../utils/serviceTypes';

// Purpose: Add-on service card for booking extras. quantity === 0 means unselected.
const ServiceAddon = ({ service, quantity = 0, onChange }) => {
  const { format } = useCurrency();
  const Icon = serviceTypeIcons[service.serviceType] || Sparkles;
  const selected = quantity > 0;

  const toggle = () => onChange(selected ? 0 : 1);
  const adjust = (delta) => (event) => {
    event.stopPropagation();
    onChange(Math.min(5, Math.max(1, quantity + delta)));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      }}
      className={`flex cursor-pointer items-start justify-between gap-3 rounded-2xl border p-3.5 transition ${
        selected ? 'border-[#0A7C6E] bg-[#E6F5F3]/60' : 'border-[#E5E7EB] bg-white hover:border-[#0A7C6E]/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-[#0A7C6E] text-white' : 'bg-[#F1F5F4] text-[#0A7C6E]'}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#1A1A2E]">{service.name}</p>
          {service.description ? <p className="mt-0.5 text-xs text-[#6B7280]">{service.description}</p> : null}
          <p className="mt-1 text-xs font-semibold text-[#0A7C6E]">{format(service.price, 'USD')} / each</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {selected ? (
          <div className="flex items-center gap-1 rounded-full border border-[#0A7C6E]/30 bg-white p-0.5">
            <button
              type="button"
              onClick={adjust(-1)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[#0A7C6E] transition hover:bg-[#E6F5F3] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label={`Decrease ${service.name} quantity`}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-xs font-semibold text-[#1A1A2E]">{quantity}</span>
            <button
              type="button"
              onClick={adjust(1)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[#0A7C6E] transition hover:bg-[#E6F5F3] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={quantity >= 5}
              aria-label={`Increase ${service.name} quantity`}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#D1D5DB]" />
        )}
      </div>
    </div>
  );
};

export default ServiceAddon;
