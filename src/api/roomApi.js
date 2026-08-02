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

// RoomResponseDto.roomNumber is actually the room's database id, not a physical room number.
const normalizeRoomDetail = (payload) => ({
  id: payload?.roomNumber ?? payload?.id ?? null,
  branchId: payload?.branchId ?? null,
  branchName: payload?.branchName || '',
  pricePerNight: payload?.pricePerNight ?? 0,
  currency: payload?.currency || 'GBP',
  roomTypeName: payload?.roomTypeName || 'Room',
  amenities: payload?.amenities && typeof payload.amenities === 'object' ? payload.amenities : {},
  images: Array.isArray(payload?.images) ? payload.images : [],
  tags: Array.isArray(payload?.tags) ? payload.tags : [],
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

  async getRoomById(roomId) {
    const res = await axiosInstance.get(`/room/${roomId}`);
    return normalizeRoomDetail(res.data);
  },
};

export default roomApi;
