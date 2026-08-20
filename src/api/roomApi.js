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
  hotelId: payload?.hotelId ?? payload?.hotelID ?? payload?.hotel_id ?? null,
  description: payload?.description || payload?.roomDescription || '',
  amenities: payload?.amenities && typeof payload.amenities === 'object' ? payload.amenities : {},
  images: Array.isArray(payload?.images) ? payload.images : [],
  publicIds: Array.isArray(payload?.publicIds) ? payload.publicIds : [],
  tags: Array.isArray(payload?.tags) ? payload.tags : [],
});

const roomApi = {
  async createRoom(branchId, payload) {
    // payload is an object; we need to send multipart/form-data for images
    const form = new FormData();
    form.append('room', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (payload.images && Array.isArray(payload.images)) {
      payload.images.forEach((f) => form.append('images', f));
    }
    const res = await axiosInstance.post(`/room/branches/${branchId}/create-room`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return normalizeRoom(res.data);
  },

  async updateRoom(branchId, id, payload) {
    const form = new FormData();
    form.append('room', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (payload.images && Array.isArray(payload.images)) {
      payload.images.forEach((f) => form.append('images', f));
    }
    const res = await axiosInstance.put(`/room/branches/${branchId}/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return normalizeRoom(res.data);
  },

  async deleteRoom(branchId, id) {
    const res = await axiosInstance.delete(`/room/branches/${branchId}/${id}`);
    return res.data;
  },

  async deleteRoomImage(branchId, id, publicId, url) {
    const params = {};
    if (publicId) params.publicId = publicId;
    if (url) params.url = url;
    const res = await axiosInstance.delete(`/room/branches/${branchId}/${id}/images`, { params });
    return res.data;
  },


  async getRoomById(roomId) {
    const res = await axiosInstance.get(`/room/${roomId}`);
    return normalizeRoomDetail(res.data);
  },

};

export default roomApi;
