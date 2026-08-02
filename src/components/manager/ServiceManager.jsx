import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, Loader2, MapPin, Plus, Sparkles } from 'lucide-react';
import hotelApi from '../../api/hotelApi';
import serviceApi from '../../api/serviceApi';
import { useCurrency } from '../../hooks/useCurrency';
import { parseApiError } from '../../utils/parseApiError';
import { SERVICE_TYPE_OPTIONS, serviceTypeIcons } from '../../utils/serviceTypes';

const EMPTY_FORM = { name: '', description: '', price: '', serviceType: SERVICE_TYPE_OPTIONS[0].value };

// Purpose: Manager tool for adding ancillary services to one of their own hotel's branches.
// `hotelId` must belong to the logged-in manager's own managedHotel — the branch dropdown is
// populated exclusively from GET /hotel/{hotelId}/branches, so there is no way to target any
// other hotel's branches from this UI, on top of the backend's own ownership check.
const ServiceManager = ({ hotelId }) => {
  const { format } = useCurrency();

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadBranches = async () => {
      setBranchesLoading(true);
      setBranchesError('');
      try {
        const data = await hotelApi.getHotelBranches(hotelId);
        if (cancelled) return;
        setBranches(data);
        if (data.length > 0) setSelectedBranchId(String(data[0].id));
      } catch (err) {
        if (!cancelled) setBranchesError(parseApiError(err, 'Unable to load your branches.'));
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };
    loadBranches();
    return () => { cancelled = true; };
  }, [hotelId]);

  useEffect(() => {
    if (!selectedBranchId) return undefined;
    let cancelled = false;
    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const data = await serviceApi.getServicesByBranch(selectedBranchId);
        if (!cancelled) setServices(data);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    };
    loadServices();
    return () => { cancelled = true; };
  }, [selectedBranchId]);

  const selectedBranch = branches.find((branch) => String(branch.id) === String(selectedBranchId)) || null;

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!selectedBranchId) {
      setFormError('Select a branch first.');
      return;
    }
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    const priceNumber = Number(form.price);
    if (form.price === '' || Number.isNaN(priceNumber) || priceNumber < 0) {
      setFormError('Enter a valid price of 0 or more.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await serviceApi.createService({
        branchId: Number(selectedBranchId),
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: priceNumber,
        serviceType: form.serviceType,
      });
      setServices((current) => [created, ...current]);
      setForm((current) => ({ ...EMPTY_FORM, serviceType: current.serviceType }));
      toast.success('Service added.');
    } catch (err) {
      // Both plain-text business-rule rejections and the JSON validation-error shape resolve
      // to a single readable string here — never a raw object or [object Object].
      setFormError(parseApiError(err, 'Unable to create this service.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (branchesLoading) {
    return (
      <div className="space-y-3">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (branchesError) {
    return (
      <div className="rounded-[28px] border border-[#F5C2C7] bg-[#FEF3F3] p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#B42318]" />
        <p className="text-sm text-[#9B1E1E]">{branchesError}</p>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#6B7280]">Your hotel doesn't have any branches yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-[Playfair_Display] text-xl font-semibold text-[#1A1A2E]">New service</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Branch</label>
            <select
              value={selectedBranchId}
              onChange={(event) => setSelectedBranchId(event.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name ? `${branch.name} — ${branch.city}` : branch.city || `Branch #${branch.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={updateField('name')}
              placeholder="e.g. Airport Pickup"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={updateField('description')}
              placeholder="A short description guests will see"
              rows={2}
              className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Price {selectedBranch?.currency ? `(${selectedBranch.currency})` : ''}
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={updateField('price')}
              placeholder="0.00"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Service type</label>
            <select
              value={form.serviceType}
              onChange={updateField('serviceType')}
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            >
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {formError ? <p className="mt-4 text-sm font-medium text-[#9B1E1E]">{formError}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitting ? 'Adding…' : 'Add service'}
        </button>
      </form>

      <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">
            Services at {selectedBranch?.name || 'this branch'}
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <MapPin className="h-3.5 w-3.5 text-[#0A7C6E]" />
            {selectedBranch?.city}
          </span>
        </div>

        {servicesLoading ? (
          <div className="space-y-2">
            {[0, 1].map((key) => <div key={key} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No services added for this branch yet.</p>
        ) : (
          <div className="space-y-2">
            {services.map((service) => {
              const Icon = serviceTypeIcons[service.serviceType] || Sparkles;
              return (
                <div key={service.id} className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#0A7C6E]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1A1A2E]">{service.name}</p>
                    {service.description ? <p className="truncate text-xs text-[#6B7280]">{service.description}</p> : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[#0A7C6E]">
                    {format(service.price, selectedBranch?.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceManager;
