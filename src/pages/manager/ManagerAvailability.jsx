import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BedDouble, Info } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ManagerLayout from '../../components/manager/ManagerLayout';
import hotelApi from '../../api/hotelApi';
import availabilityApi from '../../api/availabilityApi';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/parseApiError';

const roomIdentifier = (room) => room?.roomId || room?.id || '';
const roomType = (room) => room?.roomTypeName || room?.roomType || 'Room';

const ManagerAvailability = () => {
  const { user } = useAuth();
  const hotelId = user?.managedHotel?.id;
  const [searchParams] = useSearchParams();
  const requestedBranchId = searchParams.get('branchId');
  const requestedRoomId = searchParams.get('roomId');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    isAvailable: true,
    customPrice: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hotelId) return;

    hotelApi.getHotelBranches(hotelId)
      .then((items) => {
        setBranches(items);
        const requestedBranchExists = items.some((branch) => String(branch.id) === requestedBranchId);
        setBranchId(requestedBranchExists ? requestedBranchId : (items[0] ? String(items[0].id) : ''));
      })
      .catch((error) => toast.error(parseApiError(error, 'Unable to load your hotel branches.')));
  }, [hotelId, requestedBranchId]);

  useEffect(() => {
    if (!branchId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoadingRooms(true);
      hotelApi.getBranchRooms(branchId)
        .then((items) => {
          if (cancelled) return;
          setRooms(items);
          const selected = items.find((room) => (
            String(room.id) === requestedRoomId || String(roomIdentifier(room)) === requestedRoomId
          )) || items[0];
          setRoomId(selected ? String(selected.id) : '');
        })
        .catch((error) => {
          if (cancelled) return;
          setRooms([]);
          setRoomId('');
          toast.error(parseApiError(error, 'Unable to load rooms for this branch.'));
        })
        .finally(() => {
          if (!cancelled) setLoadingRooms(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [branchId, requestedRoomId]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === roomId) || null,
    [roomId, rooms],
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!roomId || !form.startDate || !form.endDate) {
      toast.error('Select a room and date range.');
      return;
    }

    setSaving(true);
    try {
      await availabilityApi.setAvailability(roomId, {
        startDate: form.startDate,
        endDate: form.endDate,
        isAvailable: form.isAvailable,
        customPrice: form.customPrice === '' ? null : Number(form.customPrice),
        reason: form.reason.trim() || null,
      });
      toast.success(`Availability updated for room ${roomIdentifier(selectedRoom)} only.`);
    } catch (error) {
      toast.error(parseApiError(error, 'Unable to update availability.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerLayout>
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Inventory control</p>
        <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold">Availability & nightly rates</h1>
        <p className="mt-1 text-sm text-slate-500">Block dates, reopen inventory, or override the rate for one specific room.</p>

        <div className="mt-5 flex gap-3 rounded-2xl border border-[#0A7C6E]/20 bg-[#E6F5F3] p-4 text-sm text-slate-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0A7C6E]" />
          <p>
            Changes apply only to the selected room for the chosen dates. Other Standard, Deluxe, Suite, or other room records keep their existing availability and prices.
          </p>
        </div>

        <form onSubmit={submit} className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Branch
              <select
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              >
                {branches.length === 0 ? <option value="">No branches available</option> : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name || `${branch.city} branch`}</option>
                ))}
              </select>
            </label>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="availability-room">
                Specific room
              </label>
              <select
                id="availability-room"
                value={roomId}
                disabled={loadingRooms || rooms.length === 0}
                onChange={(event) => setRoomId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingRooms ? <option value="">Loading rooms…</option> : null}
                {!loadingRooms && rooms.length === 0 ? <option value="">No rooms in this branch</option> : null}
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    ID {roomIdentifier(room)} — {roomType(room)}
                  </option>
                ))}
              </select>
              <Link
                to={branchId ? `/manager/rates?branchId=${branchId}` : '/manager/rates'}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A7C6E] hover:text-[#065E52] hover:underline"
              >
                View room images and IDs
                <ArrowRight size={13} />
              </Link>
            </div>

            <label className="text-sm font-medium text-slate-700">
              Start date
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              End date
              <input
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Inventory status
              <select
                value={String(form.isAvailable)}
                onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.value === 'true' }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              >
                <option value="true">Available</option>
                <option value="false">Blocked / unavailable</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Custom nightly price (optional)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.customPrice}
                onChange={(event) => setForm((current) => ({ ...current, customPrice: event.target.value }))}
                placeholder={selectedRoom?.pricePerNight ? `Base rate: ${selectedRoom.currency || ''} ${selectedRoom.pricePerNight}` : 'Keep the base price'}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </label>
          </div>

          {selectedRoom ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-[#E6F5F3]">
                {selectedRoom.images?.[0] ? (
                  <img src={selectedRoom.images[0]} alt={roomType(selectedRoom)} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[#0A7C6E]"><BedDouble size={22} /></span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{roomType(selectedRoom)}</p>
                <p className="truncate font-mono text-xs text-slate-500">Room ID: {roomIdentifier(selectedRoom)}</p>
              </div>
            </div>
          ) : null}

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Reason (optional)
            <input
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Maintenance, event pricing…"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !roomId}
            className="mt-6 w-full rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Apply to selected room'}
          </button>
        </form>
      </div>
    </ManagerLayout>
  );
};

export default ManagerAvailability;
