import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { countryCurrencyConfig, findCountryConfig } from '../../utils/countryCurrency';
import { useCurrency } from '../../hooks/useCurrency';

// Purpose: Navbar globe button + dropdown for switching the display country/currency.
const CurrencySwitcher = ({ buttonClassName = '' }) => {
  const { country, setCountry } = useCurrency();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const activeCountry = findCountryConfig(country);

  return (
    <div className="relative overflow-visible z-[9999]" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={16} />
        <span>{activeCountry?.flag}</span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="fixed left-1/2 top-[4.5rem] z-[9999] mx-auto mt-0 max-h-80 w-[min(90vw,16rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 text-slate-900 shadow-xl md:absolute md:left-auto md:right-0 md:top-full md:translate-x-0 md:mt-2 md:w-64"
        >
          {countryCurrencyConfig.map((entry) => {
            const isActive = entry.code === country;
            return (
              <button
                key={entry.code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setCountry(entry.code);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${isActive ? 'bg-[#0A7C6E]/10 text-[#0A7C6E]' : 'text-slate-700 hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span>{entry.flag}</span>
                  <span>{entry.name}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  {entry.currency}
                  {isActive ? <Check size={14} className="text-[#0A7C6E]" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default CurrencySwitcher;
