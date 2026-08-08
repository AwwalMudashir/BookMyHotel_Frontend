import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import hotelApi from '../../api/hotelApi';
import roomApi from '../../api/roomApi';
import toast from 'react-hot-toast';

const AdminRooms = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadHotels(); }, []);

  const loadHotels = async () => {
    try {
      const { items } = await hotelApi.getAllHotels(1, 100);
      setHotels(items);
    } catch (e) { toast.error('Unable to load hotels'); }
  };

  const onHotelChange = async (hotelId) => {
    setSelectedHotel(hotelId);
    try {
      const br = await hotelApi.getHotelBranches(hotelId);
      setBranches(br);
      setSelectedBranch(null);
      setRooms([]);
    } catch (e) { toast.error('Unable to load branches'); }
  };

  const onBranchChange = async (branchId) => {
    setSelectedBranch(branchId);
    setLoading(true);
    try {
      const rs = await hotelApi.getBranchRooms(branchId);
      setRooms(rs || []);
    } catch (e) { toast.error('Unable to load rooms'); }
    setLoading(false);
  };

  const removeRoom = async (roomId) => {
    if (!confirm('Delete this room?')) return;
    try {
      await roomApi.deleteRoom(selectedBranch, roomId);
      toast.success('Room deleted');
      onBranchChange(selectedBranch);
    } catch (e) { toast.error('Unable to delete room'); }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Rooms</h1>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <select value={selectedHotel||''} onChange={(e) => onHotelChange(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="">Select hotel</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select value={selectedBranch||''} onChange={(e) => onBranchChange(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="">Select branch</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
          </select>
          <div />
        </div>

        <div className="rounded-lg bg-white p-4">
          {loading ? <div>Loading rooms...</div> : (
            <div className="space-y-3">
              {rooms.length === 0 ? <div className="text-sm text-slate-500">No rooms found for the selected branch.</div> : rooms.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <div className="font-semibold">{r.roomTypeName || r.roomType || r.type}</div>
                    <div className="text-sm text-slate-500">{r.description || r.shortDescription || ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-yellow-500 px-3 py-1 text-sm text-white">Edit</button>
                    <button onClick={() => removeRoom(r.id)} className="rounded-md bg-red-500 px-3 py-1 text-sm text-white">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRooms;
