import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Edit3,
  Globe2,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import hotelApi from '../../api/hotelApi';
import serviceApi from '../../api/serviceApi';
import { parseApiError } from '../../utils/parseApiError';
import { SERVICE_TYPE_OPTIONS, serviceTypeIcons } from '../../utils/serviceTypes';

const formatUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const emptyForm = () => ({
  name: '',
  description: '',
  price: '',
  serviceType: SERVICE_TYPE_OPTIONS[0].value,
  allBranches: true,
  branchId: '',
});

const ServiceManager = ({ hotelId }) => {
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setLoadError('');
    try {
      const [branchData, serviceData] = await Promise.all([
        hotelApi.getHotelBranches(hotelId),
        serviceApi.getManagedServices(hotelId),
      ]);
      setBranches(branchData);
      setServices(serviceData);
      setForm((current) => ({
        ...current,
        branchId: current.branchId || (branchData[0] ? String(branchData[0].id) : ''),
      }));
    } catch (error) {
      setLoadError(parseApiError(error, 'Unable to load services.'));
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    // The same loader is intentionally shared with the retry action.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), branchId: branches[0] ? String(branches[0].id) : '' });
    setFormError('');
  };

  const startEditing = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name || '',
      description: service.description || '',
      price: String(service.price ?? ''),
      serviceType: service.serviceType || SERVICE_TYPE_OPTIONS[0].value,
      allBranches: Boolean(service.allBranches),
      branchId: service.branchId ? String(service.branchId) : (branches[0] ? String(branches[0].id) : ''),
    });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const price = Number(form.price);
    if (!form.name.trim()) {
      setFormError('Enter a service name.');
      return;
    }
    if (!form.allBranches && !form.branchId) {
      setFormError('Select a branch or make this service available at all branches.');
      return;
    }
    if (form.price === '' || Number.isNaN(price) || price < 0) {
      setFormError('Enter a valid price of 0 or more.');
      return;
    }

    const payload = {
      hotelId: Number(hotelId),
      branchId: form.allBranches ? null : Number(form.branchId),
      allBranches: form.allBranches,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      serviceType: form.serviceType,
    };

    setSubmitting(true);
    try {
      const saved = editingId
        ? await serviceApi.updateService(editingId, payload)
        : await serviceApi.createService(payload);
      setServices((current) => editingId
        ? current.map((service) => (service.id === editingId ? saved : service))
        : [saved, ...current]);
      toast.success(editingId ? 'Service updated.' : 'Service created.');
      resetForm();
    } catch (error) {
      setFormError(parseApiError(error, 'Unable to save this service.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Remove “${service.name}”? Existing bookings will keep their service details.`)) return;
    setDeletingId(service.id);
    try {
      await serviceApi.deleteService(service.id);
      setServices((current) => current.filter((item) => item.id !== service.id));
      if (editingId === service.id) resetForm();
      toast.success('Service removed.');
    } catch (error) {
      toast.error(parseApiError(error, 'Unable to remove this service.'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="h-72 animate-pulse rounded-[28px] bg-white shadow-sm" />;
  }

  if (loadError) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
        <p className="text-sm text-red-700">{loadError}</p>
        <button type="button" onClick={loadData} className="mt-4 cursor-pointer text-sm font-semibold text-[#0A7C6E]">Try again</button>
      </div>
    );
  }

  const selectedBranch = branches.find((branch) => String(branch.id) === form.branchId);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
      <form onSubmit={handleSubmit} className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-7 xl:sticky xl:top-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A7C6E]">Guest add-on</p>
            <h2 className="mt-1 font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">
              {editingId ? 'Edit service' : 'Create a service'}
            </h2>
          </div>
          {editingId ? (
            <button type="button" onClick={resetForm} aria-label="Cancel editing" className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Availability</label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, allBranches: true }))}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${form.allBranches ? 'bg-white text-[#0A7C6E] shadow-sm' : 'text-slate-500'}`}
              >
                <Globe2 className="h-4 w-4" /> All branches
              </button>
              <button
                type="button"
                disabled={branches.length === 0}
                onClick={() => setForm((current) => ({ ...current, allBranches: false }))}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${!form.allBranches ? 'bg-white text-[#0A7C6E] shadow-sm' : 'text-slate-500'}`}
              >
                <MapPin className="h-4 w-4" /> One branch
              </button>
            </div>
          </div>

          {!form.allBranches ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Branch</label>
              <select value={form.branchId} onChange={updateField('branchId')} className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15">
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name || branch.city || `Branch #${branch.id}`}</option>)}
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Name</label>
            <input value={form.name} onChange={updateField('name')} placeholder="e.g. Airport pickup" className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Description</label>
            <textarea value={form.description} onChange={updateField('description')} rows={3} placeholder="Tell guests what is included" className="w-full resize-none rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Price</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center rounded-l-xl border-r border-[#E5E7EB] bg-slate-100 px-3 text-sm font-bold text-slate-600" aria-hidden="true">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateField('price')}
                  placeholder="0.00"
                  aria-describedby="service-price-currency-help"
                  className="w-full rounded-xl border border-[#E5E7EB] py-2.5 pl-11 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
                />
              </div>
              <p id="service-price-currency-help" className="mt-1.5 text-xs text-slate-500">Service prices are stored in USD.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Type</label>
              <select value={form.serviceType} onChange={updateField('serviceType')} className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15">
                {SERVICE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            {form.allBranches
              ? 'The USD price is converted automatically into each guest’s selected currency.'
              : `The USD price is converted for guests booking at ${selectedBranch?.name || 'the selected branch'}.`}
          </p>
          {formError ? <p className="text-sm font-medium text-red-700">{formError}</p> : null}
          <button type="submit" disabled={submitting} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:bg-slate-300">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create service'}
          </button>
        </div>
      </form>

      <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A7C6E]">Live catalogue</p>
            <h2 className="mt-1 font-[Playfair_Display] text-2xl font-semibold text-[#1A1A2E]">Your services</h2>
          </div>
          <span className="rounded-full bg-[#E6F5F3] px-3 py-1 text-xs font-semibold text-[#0A7C6E]">{services.length} active</span>
        </div>

        {services.length === 0 ? (
          <div className="py-16 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[#0A7C6E]" />
            <p className="mt-3 text-sm font-semibold text-[#1A1A2E]">No services yet</p>
            <p className="mt-1 text-sm text-slate-500">Create the first extra guests can add to their stay.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {services.map((service) => {
              const Icon = serviceTypeIcons[service.serviceType] || Sparkles;
              const branch = branches.find((item) => item.id === service.branchId);
              return (
                <article key={service.id} className="flex min-h-44 flex-col rounded-2xl border border-[#E5E7EB] p-4 transition hover:border-[#0A7C6E]/30 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#0A7C6E]"><Icon className="h-5 w-5" /></span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => startEditing(service)} aria-label={`Edit ${service.name}`} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0A7C6E]"><Edit3 className="h-4 w-4" /></button>
                      <button type="button" disabled={deletingId === service.id} onClick={() => handleDelete(service)} aria-label={`Delete ${service.name}`} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                        {deletingId === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-[#1A1A2E]">{service.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{service.description || 'No description provided.'}</p>
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      {service.allBranches ? <Globe2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                      {service.allBranches ? 'All branches' : service.branchName || branch?.name || 'One branch'}
                    </span>
                    <span className="font-semibold text-[#0A7C6E]">{formatUsd(service.price)} USD</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ServiceManager;
