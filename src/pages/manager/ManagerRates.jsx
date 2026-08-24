import { useCallback, useEffect, useState } from 'react';
import { BedDouble, CalendarRange, Copy, Edit2, Plus, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ManagerLayout from '../../components/manager/ManagerLayout';
import RoomFormModal from '../../components/admin/RoomFormModal';
import hotelApi from '../../api/hotelApi';
import roomApi from '../../api/roomApi';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/core/Spinner';
import { parseApiError } from '../../utils/parseApiError';

const roomIdentifier = (room) => room?.roomId || room?.id || '';
const roomType = (room) => room?.roomTypeName || room?.roomType || 'Room';

const ManagerRates = () => {
  const { user } = useAuth();
  const hotelId = user?.managedHotel?.id;
  const [searchParams] = useSearchParams();
  const requestedBranchId = searchParams.get('branchId');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined);

  useEffect(() => {
    if (!hotelId) return;

    hotelApi.getHotelBranches(hotelId)
      .then((items) => {
        setBranches(items);
        const requestedBranchExists = items.some((branch) => String(branch.id) === requestedBranchId);
        setBranchId(requestedBranchExists ? requestedBranchId : (items[0] ? String(items[0].id) : ''));
      })
      .catch((error) => {
        setLoading(false);
        toast.error(parseApiError(error, 'Unable to load your hotel branches.'));
      });
  }, [hotelId, requestedBranchId]);

  const loadRooms = useCallback(async () => {
    if (!branchId) {
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setRooms(await hotelApi.getBranchRooms(branchId));
    } catch (error) {
      toast.error(parseApiError(error, 'Unable to load rooms.'));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRooms(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRooms]);

  const remove = async (room) => {
    if (!window.confirm(`Remove room ${roomIdentifier(room)} from public listings?`)) return;

    try {
      await roomApi.deleteRoom(branchId, roomIdentifier(room));
      toast.success('Room removed from public listings.');
      await loadRooms();
    } catch (error) {
      toast.error(parseApiError(error, 'Unable to remove this room.'));
    }
  };

  const copyRoomId = async (room) => {
    const id = String(roomIdentifier(room));
    try {
      await navigator.clipboard.writeText(id);
      toast.success(`Room ID ${id} copied.`);
    } catch {
      toast.error('Unable to copy automatically. Select the displayed room ID and copy it manually.');
    }
  };

  return (
    <ManagerLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Inventory</p>
            <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold">Rooms & rates</h1>
            <p className="mt-1 text-sm text-slate-500">Identify rooms by image and public room ID, then manage their base prices.</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Branch
              <select
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900"
              >
                {branches.length === 0 ? <option value="">No branches available</option> : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name || `${branch.city} branch`}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!branchId}
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:opacity-50"
            >
              <Plus size={16} />
              Add room
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No active rooms in this branch.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {rooms.map((room) => {
              const publicRoomId = roomIdentifier(room);
              const availabilityLink = `/manager/availability?branchId=${encodeURIComponent(branchId)}&roomId=${encodeURIComponent(publicRoomId)}`;

              return (
                <article key={room.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-48 bg-gradient-to-br from-[#E6F5F3] to-slate-100">
                    {room.images?.[0] ? (
                      <img src={room.images[0]} alt={roomType(room)} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[#0A7C6E]/45"><BedDouble size={44} /></span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">{roomType(room)}</h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{room.description || 'No room description provided.'}</p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-[#0A7C6E]">
                        {room.currency || ''} {Number(room.pricePerNight || 0).toFixed(2)}
                        <span className="block text-[11px] font-normal text-slate-500">base rate / night</span>
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Public room ID</p>
                        <code className="mt-1 block select-all truncate text-sm font-semibold text-slate-900">{publicRoomId}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyRoomId(room)}
                        title="Copy room ID"
                        aria-label={`Copy room ID ${publicRoomId}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#0A7C6E] hover:text-[#0A7C6E]"
                      >
                        <Copy size={15} />
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <Link
                        to={availabilityLink}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0A7C6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52]"
                      >
                        <CalendarRange size={15} />
                        Set availability
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing(room)}
                        title="Edit room"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(room)}
                        title="Remove from public listings"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {editing !== undefined ? (
          <RoomFormModal
            branchId={Number(branchId)}
            room={editing}
            onClose={(saved) => {
              setEditing(undefined);
              if (saved) void loadRooms();
            }}
          />
        ) : null}
      </div>
    </ManagerLayout>
  );
};

export default ManagerRates;
