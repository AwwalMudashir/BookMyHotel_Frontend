import { useEffect, useRef, useState } from 'react';
import { Edit2, Trash2, ImagePlus, Plus, Search } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import hotelApi from '../../api/hotelApi';
import roomApi from '../../api/roomApi';
import RoomFormModal from '../../components/admin/RoomFormModal';
import Spinner from '../../components/core/Spinner';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils/parseApiError';

const AdminRooms = () => {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomIdSearch, setRoomIdSearch] = useState('');
  const branchReqId = useRef(0);
  const roomReqId = useRef(0);

  useEffect(() => { loadHotels(); }, []);

  const loadHotels = async () => {
    setHotelLoading(true);
    try {
      const { items } = await hotelApi.getAllHotels(1, 100);
      setHotels(items);
      if (items[0] && !hotelId) setHotelId(String(items[0].id));
    } catch (e) { toast.error('Unable to load hotels'); }
    setHotelLoading(false);
  };

  const loadBranches = async (hId) => {
    if (!hId) return;
    branchReqId.current += 1;
    const reqId = branchReqId.current;
    setBranchLoading(true);
    // clear branches immediately for perceived responsiveness
    setBranches([]);
    setBranchId('');
    try {
      const b = await hotelApi.getHotelBranches(hId);
      // ignore stale responses
      if (reqId !== branchReqId.current) return;
      setBranches(b || []);
      if (b && b[0] && !branchId) setBranchId(String(b[0].id));
    } catch (e) {
      setBranches([]);
    } finally {
      if (reqId === branchReqId.current) setBranchLoading(false);
    }
  };

  useEffect(() => {
    if (!hotelId) return;
    loadBranches(hotelId);
  }, [hotelId]);

  const loadRooms = async (bId) => {
    roomReqId.current += 1;
    const reqId = roomReqId.current;
    if (!bId) { setRooms([]); setAllRooms([]); setLoading(false); return; }
    setLoading(true);
    try {
      const rs = await hotelApi.getBranchRooms(bId);
      if (reqId !== roomReqId.current) return;
      setAllRooms(rs || []);
      setRooms(rs || []);
    } catch (e) { toast.error('Unable to load rooms'); setRooms([]); setAllRooms([]); }
    finally { if (reqId === roomReqId.current) setLoading(false); }
  };

  useEffect(() => {
    // When branch changes, show the spinner immediately so the UI doesn't flash the
    // "no rooms" empty state while the async loadRooms runs (useEffect runs after render).
    if (!branchId) {
      setRooms([]);
      setAllRooms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadRooms(branchId);
  }, [branchId]);

  const handleDeleteRoom = async (room) => {
    const roomIdentifier = room?.roomId ?? room?.id ?? room?.roomNumber;
    if (!roomIdentifier) {
      toast.error('Unable to identify this room. Refresh the page and try again.');
      return;
    }

    if (!confirm(
      'Remove this room from public listings? Historical bookings will be preserved, and rooms with pending or confirmed future stays cannot be removed.',
    )) return;

    try {
      await roomApi.deleteRoom(branchId, roomIdentifier);
      toast.success('Room removed from public listings. Booking history was preserved.');
      const rs = await hotelApi.getBranchRooms(branchId);
      setAllRooms(rs || []);
      setRooms(rs || []);
    } catch (e) {
      toast.error(parseApiError(e, 'Unable to remove this room.'));
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[Playfair_Display] text-2xl font-semibold">Rooms</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Manage rooms per branch. Add images and edit details.</p>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Hotel</label>
                <select
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
                >
                  {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
          </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Branch</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
                >
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
                </select>
              </div>

              <div className="flex items-center mt-5">
                <button
                  type="button"
                  title="Search rooms"
                  onClick={() => loadRooms(branchId)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setEditingRoom(null); setShowForm(true); }}
              disabled={!branchId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={14} />
              Add room
            </button>
          </div>
        </div>

        {/* Search row */}
        <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Room id</label>
              <input
                type="text"
                value={roomIdSearch}
                onChange={(e) => setRoomIdSearch(e.target.value)}
                placeholder="Search by room_id"
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={async () => {
                  if (!branchId) return;
                  setLoading(true);
                  try {
                    if (!roomIdSearch?.trim()) {
                      setRooms(allRooms);
                    } else {
                      const q = roomIdSearch.trim().toLowerCase();
                      const filtered = (allRooms || []).filter((rr) => {
                        const candidates = [rr.roomId, rr.roomID, rr.roomNumber, rr.id, rr.roomNumber];
                        return candidates.some((val) => val !== undefined && val !== null && String(val).toLowerCase() === q);
                      });
                      setRooms(filtered);
                    }
                  } catch (err) {
                    toast.error('Search failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52]"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => { setRoomIdSearch(''); setRooms(allRooms); }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white border px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-[#F8FAF9] p-3 text-[#0A7C6E]"><ImagePlus /></div>
              <p className="text-sm text-[#6B7280]">No rooms found for this branch.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F2F4]">
              {rooms.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-4 py-4">
                      <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-1.5 font-medium text-[#1A1A2E]">
                      {r.roomTypeName || r.roomType || r.type}
                    </p>
                        <p title={r.description || ''} className="text-xs text-[#6B7280] truncate">{r.description || ''}</p>
                  </div>

                      <div className="w-40 flex-none">
                    <p className="text-xs text-slate-500">Room id</p>
                        <p className="font-mono text-sm text-[#1A1A2E] truncate">{r.roomId || r.Id || r.id}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-[#1A1A2E]">{r.pricePerNight ? `${r.pricePerNight} ${r.currency || r.branchCurrency || ''}` : ''}</div>
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => { setEditingRoom(r); setShowForm(true); }}
                      className="rounded-full p-2 text-slate-500 transition hover:text-[#0A7C6E]"
                    >
                      <Edit2 className="h-4 w-4 cursor-pointer" />
                    </button>

                    <button
                      type="button"
                      title="Remove from public listings"
                      onClick={() => handleDeleteRoom(r)}
                      className="rounded-full p-2 text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4 cursor-pointer" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm ? (
          <RoomFormModal
            branchId={Number(branchId)}
            room={editingRoom}
            onClose={async (didSave, updatedRoom) => {
              setShowForm(false);
              setEditingRoom(null);
              if (didSave) {
                if (updatedRoom) {
                  // replace in allRooms and rooms
                  setAllRooms((prev) => {
                    const list = Array.isArray(prev) ? prev.slice() : [];
                    const idx = list.findIndex((x) => (x.id && updatedRoom.id && x.id === updatedRoom.id) || (x.roomId && updatedRoom.roomId && x.roomId === updatedRoom.roomId));
                    if (idx >= 0) {
                      list[idx] = { ...list[idx], ...updatedRoom };
                    }
                    return list;
                  });
                  setRooms((prev) => {
                    const list = Array.isArray(prev) ? prev.slice() : [];
                    const idx = list.findIndex((x) => (x.id && updatedRoom.id && x.id === updatedRoom.id) || (x.roomId && updatedRoom.roomId && x.roomId === updatedRoom.roomId));
                    if (idx >= 0) {
                      list[idx] = { ...list[idx], ...updatedRoom };
                    }
                    return list;
                  });
                } else {
                  // no local updated object provided (e.g., create) — re-fetch from server
                  const rs = await hotelApi.getBranchRooms(branchId);
                  setAllRooms(rs || []);
                  setRooms(rs || []);
                }
              }
            }}
          />
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminRooms;
