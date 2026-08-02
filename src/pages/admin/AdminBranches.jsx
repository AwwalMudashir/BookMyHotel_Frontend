import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Edit2, Leaf, MapPin, Plus, RefreshCw } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import AdminNav from '../../components/admin/AdminNav';
import BranchFormModal from '../../components/admin/BranchFormModal';
import Spinner from '../../components/core/Spinner';
import hotelApi from '../../api/hotelApi';
import { parseApiError } from '../../utils/parseApiError';

// Purpose: Admin branch administration for one hotel at a time, selected via ?hotelId= (linked
// from the hotels list). Includes the admin-set sustainability fields (ecoCertified/ecoTags/
// ecoScore) on each branch — plain entered values, nothing derived from room data.
const AdminBranches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId') || '';

  const [hotels, setHotels] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  useEffect(() => {
    hotelApi.getAllHotels(1, 100).then(({ items }) => {
      setHotels(items);
      if (!hotelId && items[0]) setSearchParams({ hotelId: String(items[0].id) });
    }).catch(() => setHotels([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBranches = async () => {
    if (!hotelId) return;
    setLoading(true);
    setError('');
    try {
      const data = await hotelApi.getHotelBranches(hotelId);
      setBranches(data);
    } catch (err) {
      setError(parseApiError(err, 'Unable to load branches for this hotel.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetching on hotel change, not a render-time reset
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const hotelName = hotels.find((hotel) => String(hotel.id) === String(hotelId))?.name || '';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <AdminNav />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[Playfair_Display] text-2xl font-semibold">Branches</h1>
            <p className="mt-1 text-sm text-[#6B7280]">{hotelName ? `Branches for ${hotelName}` : 'Select a hotel to manage its branches.'}</p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Hotel</label>
              <select
                value={hotelId}
                onChange={(event) => setSearchParams({ hotelId: event.target.value })}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              >
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => { setEditingBranch(null); setShowForm(true); }}
              disabled={!hotelId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={14} />
              Add branch
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-[#E6F5F3] p-3 text-[#0A7C6E]"><RefreshCw /></div>
              <p className="text-sm text-[#6B7280]">{error}</p>
              <button onClick={loadBranches} className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white">Try again</button>
            </div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-[#E6F5F3] p-3 text-[#0A7C6E]"><Building2 /></div>
              <p className="text-sm text-[#6B7280]">No branches for this hotel yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F2F4]">
              {branches.map((branch) => (
                <div key={branch.id} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="min-w-[160px] flex-1">
                    <p className="flex items-center gap-1.5 font-medium text-[#1A1A2E]">
                      <MapPin size={14} className="text-[#0A7C6E]" />
                      {branch.name || branch.city}
                    </p>
                    <p className="text-xs text-[#6B7280]">{branch.city}{branch.country ? `, ${branch.country}` : ''} · {branch.currency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {branch.ecoCertified ? (
                      <span className="flex items-center gap-1 rounded-full bg-[#E6F5F3] px-3 py-1 text-xs font-semibold text-[#0A7C6E]">
                        <Leaf className="h-3 w-3" />
                        Eco-certified
                      </span>
                    ) : null}
                    {branch.ecoScore != null ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Score {branch.ecoScore}/100
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditingBranch(branch); setShowForm(true); }}
                    title="Edit"
                    className="rounded-full p-2 text-slate-500 transition hover:text-[#0A7C6E]"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm ? (
        <BranchFormModal
          hotelId={Number(hotelId)}
          branch={editingBranch}
          onClose={(didSave) => {
            setShowForm(false);
            if (didSave) loadBranches();
          }}
        />
      ) : null}
    </div>
  );
};

export default AdminBranches;
