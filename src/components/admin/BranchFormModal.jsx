import { useEffect, useState } from 'react';
import { Leaf, X } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '../../api/adminApi';
import { parseApiError } from '../../utils/parseApiError';

// Purpose: Create/edit modal for a hotel's branches, including the admin-set sustainability
// fields (ecoCertified, ecoTags, ecoScore) — plain entered values, nothing derived/computed.
const BranchFormModal = ({ hotelId, branch = null, onClose = () => {} }) => {
  const isEdit = Boolean(branch?.id);

  const [name, setName] = useState(branch?.name || '');
  const [city, setCity] = useState(branch?.city || '');
  const [country, setCountry] = useState(branch?.country || '');
  const [address, setAddress] = useState(branch?.address || '');
  const [currency, setCurrency] = useState(branch?.currency || '');
  const [checkInTime, setCheckInTime] = useState(branch?.checkInTime?.slice(0, 5) || '15:00');
  const [checkOutTime, setCheckOutTime] = useState(branch?.checkOutTime?.slice(0, 5) || '11:00');

  const [ecoCertified, setEcoCertified] = useState(Boolean(branch?.ecoCertified));
  const [ecoTags, setEcoTags] = useState(Array.isArray(branch?.ecoTags) ? branch.ecoTags : []);
  const [tagInput, setTagInput] = useState('');
  const [ecoScore, setEcoScore] = useState(branch?.ecoScore ?? '');

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

  const commitTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    const exists = ecoTags.some((tag) => tag.toLowerCase() === value.toLowerCase());
    if (!exists) setEcoTags((current) => [...current, value]);
    setTagInput('');
  };

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitTag();
    } else if (event.key === 'Backspace' && !tagInput && ecoTags.length > 0) {
      setEcoTags((current) => current.slice(0, -1));
    }
  };

  const removeTag = (tag) => setEcoTags((current) => current.filter((item) => item !== tag));

  const validate = () => {
    if (!name.trim()) return 'Branch name is required.';
    if (!city.trim()) return 'City is required.';
    if (!country.trim()) return 'Country is required.';
    if (!currency.trim()) return 'Currency is required.';
    if (ecoScore !== '' && (Number.isNaN(Number(ecoScore)) || Number(ecoScore) < 0 || Number(ecoScore) > 100)) {
      return 'Sustainability score must be between 0 and 100.';
    }
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
      const payload = {
        name: name.trim(),
        city: city.trim(),
        country: country.trim(),
        address: address.trim() || null,
        currency: currency.trim().toUpperCase(),
        checkInTime: `${checkInTime}:00`,
        checkOutTime: `${checkOutTime}:00`,
        ecoCertified,
        ecoTags,
        ecoScore: ecoScore === '' ? null : Number(ecoScore),
      };

      if (isEdit) {
        await adminApi.updateBranch(branch.id, payload);
        toast.success('Branch updated.');
      } else {
        await adminApi.createBranch({ ...payload, hotelId });
        toast.success('Branch created.');
      }
      onClose(true);
    } catch (err) {
      const message = parseApiError(err, 'Unable to save this branch.');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6" onClick={handleBackdropClick}>
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[Playfair_Display] text-2xl font-semibold text-slate-900">
              {isEdit ? 'Edit branch' : 'Add branch'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isEdit ? 'Update this branch\'s details.' : 'Create a new branch for this hotel.'}
            </p>
          </div>
          <button type="button" onClick={() => onClose()} className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="branchName" className="mb-2 block text-sm font-medium text-slate-700">Branch name</label>
            <input
              id="branchName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Central Branch"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="branchCity" className="mb-2 block text-sm font-medium text-slate-700">City</label>
              <input
                id="branchCity"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
            <div>
              <label htmlFor="branchCountry" className="mb-2 block text-sm font-medium text-slate-700">Country</label>
              <input
                id="branchCountry"
                type="text"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="branchAddress" className="mb-2 block text-sm font-medium text-slate-700">Address (optional)</label>
            <input
              id="branchAddress"
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="branchCurrency" className="mb-2 block text-sm font-medium text-slate-700">Currency</label>
              <input
                id="branchCurrency"
                type="text"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                placeholder="AED"
                maxLength={3}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
            <div>
              <label htmlFor="branchCheckIn" className="mb-2 block text-sm font-medium text-slate-700">Check-in</label>
              <input
                id="branchCheckIn"
                type="time"
                value={checkInTime}
                onChange={(event) => setCheckInTime(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
            <div>
              <label htmlFor="branchCheckOut" className="mb-2 block text-sm font-medium text-slate-700">Check-out</label>
              <input
                id="branchCheckOut"
                type="time"
                value={checkOutTime}
                onChange={(event) => setCheckOutTime(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#DCEFEA] bg-[#F7FCF8] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1D6A2D]">
              <Leaf className="h-4 w-4" />
              Sustainability
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={ecoCertified}
                onChange={(event) => setEcoCertified(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0A7C6E] focus:ring-[#0A7C6E]"
              />
              Eco-certified property
            </label>

            <div className="mt-3">
              <label htmlFor="branchEcoTags" className="mb-2 block text-sm font-medium text-slate-700">Sustainability tags</label>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                {ecoTags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-[#E6F5F3] px-2.5 py-1 text-xs font-medium text-[#0A7C6E]">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} className="text-[#0A7C6E]/60 hover:text-[#0A7C6E]">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="branchEcoTags"
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={commitTag}
                  placeholder={ecoTags.length === 0 ? 'e.g. solar_power, recycling — press Enter to add' : 'Add another…'}
                  className="min-w-[140px] flex-1 border-none bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Free text — press Enter or comma to add each tag.</p>
            </div>

            <div className="mt-3">
              <label htmlFor="branchEcoScore" className="mb-2 block text-sm font-medium text-slate-700">Sustainability score (0–100, optional)</label>
              <input
                id="branchEcoScore"
                type="number"
                min={0}
                max={100}
                value={ecoScore}
                onChange={(event) => setEcoScore(event.target.value)}
                placeholder="e.g. 78"
                className="w-full max-w-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/20"
              />
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save changes' : 'Create branch')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BranchFormModal;
