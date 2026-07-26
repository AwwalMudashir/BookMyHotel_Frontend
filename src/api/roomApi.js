import axiosInstance from './axiosInstance';

const normalizeRoom = (payload) => ({
  id: payload?.id ?? payload?.roomId ?? null,
  type: payload?.type || payload?.roomType || 'Standard',
  description: payload?.description || '',
  maxOccupancy: payload?.maxOccupancy ?? payload?.occupancy ?? 1,
  price: payload?.price ?? payload?.pricePerNight ?? 0,
  currency: payload?.currency || payload?.currencyCode || 'GBP',
  amenities: Array.isArray(payload?.amenities) ? payload.amenities : [],
  branchId: payload?.branchId || payload?.branchID || null,
});

const roomApi = {
  async createRoom(payload) {
    const res = await axiosInstance.post('/rooms', payload);
    return normalizeRoom(res.data);
  },

  async updateRoom(id, payload) {
    const res = await axiosInstance.put(`/rooms/${id}`, payload);
    return normalizeRoom(res.data);
  },
};

export default roomApi;
