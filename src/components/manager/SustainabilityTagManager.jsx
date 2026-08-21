import { useCallback, useEffect, useState } from 'react';
import { Edit2, Leaf, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import sustainabilityTagApi from '../../api/sustainabilityTagApi';
import hotelApi from '../../api/hotelApi';
import Spinner from '../core/Spinner';
import { parseApiError } from '../../utils/parseApiError';

const emptyForm = { name: '', description: '', allBranches: true, branchId: '' };

const SustainabilityTagManager = ({ hotelId }) => {
  const [tags, setTags] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const [tagData, branchData] = await Promise.all([
        sustainabilityTagApi.getAll(hotelId),
        hotelApi.getHotelBranches(hotelId),
      ]);
      setTags(tagData);
      setBranches(branchData);
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to load sustainability tags.'));
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (tag) => {
    setEditing(tag);
    setForm({ name: tag.name || '', description: tag.description || '', allBranches: Boolean(tag.allBranches), branchId: tag.branchId ? String(tag.branchId) : '' });
    setFormOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error('Tag name is required.');
    if (!form.allBranches && !form.branchId) return toast.error('Select a branch or choose all branches.');
    setSaving(true);
    const payload = { hotelId: Number(hotelId), branchId: form.allBranches ? null : Number(form.branchId), allBranches: form.allBranches, name: form.name.trim(), description: form.description.trim() || null };
    try {
      if (editing) await sustainabilityTagApi.update(editing.id, payload);
      else await sustainabilityTagApi.create(payload);
      toast.success(editing ? 'Sustainability tag updated.' : 'Sustainability tag created.');
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to save this sustainability tag.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tag) => {
    if (!window.confirm(`Delete “${tag.name}”?`)) return;
    try {
      await sustainabilityTagApi.remove(tag.id);
      setTags((current) => current.filter((item) => item.id !== tag.id));
      toast.success('Sustainability tag deleted.');
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to delete this sustainability tag.'));
    }
  };

  if (!hotelId) return <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500">Select a hotel to manage its sustainability tags.</div>;
  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Create badges for every branch in the hotel or target one branch.</p>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} />New tag</button>
      </div>
      {tags.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Leaf className="mx-auto h-9 w-9 text-[#0A7C6E]" /><p className="mt-3 text-sm text-slate-500">No sustainability tags have been created for this hotel.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => (
            <article key={tag.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-[#E6F5F3] p-2 text-[#0A7C6E]"><Leaf size={18} /></span>
                <div className="flex gap-1"><button type="button" onClick={() => openEdit(tag)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={`Edit ${tag.name}`}><Edit2 size={15} /></button><button type="button" onClick={() => remove(tag)} className="rounded-full p-2 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${tag.name}`}><Trash2 size={15} /></button></div>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{tag.name}</h3>
              <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{tag.description || 'No description provided.'}</p>
              <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tag.allBranches ? 'All branches' : tag.branchName || 'Selected branch'}</span>
            </article>
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="font-[Playfair_Display] text-2xl font-semibold">{editing ? 'Edit tag' : 'New sustainability tag'}</h2><p className="mt-1 text-sm text-slate-500">Choose where this tag is available.</p></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <label className="mt-5 block text-sm font-medium text-slate-700">Name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={80} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#0A7C6E]" placeholder="e.g. Renewable energy" /></label>
            <label className="mt-4 block text-sm font-medium text-slate-700">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={500} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#0A7C6E]" /></label>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.allBranches} onChange={(event) => setForm((current) => ({ ...current, allBranches: event.target.checked, branchId: event.target.checked ? '' : current.branchId }))} className="h-4 w-4 accent-[#0A7C6E]" />Available at every branch</label>
            {!form.allBranches ? <label className="mt-4 block text-sm font-medium text-slate-700">Branch<select value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"><option value="">Select branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name || branch.city}</option>)}</select></label> : null}
            <button type="submit" disabled={saving} className="mt-6 w-full rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create tag'}</button>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default SustainabilityTagManager;
