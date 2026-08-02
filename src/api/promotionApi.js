import axiosInstance from './axiosInstance';

// Purpose: Promotion lookup and management API helpers.
const promotionApi = {
  async applyPromotion({ code, totalPrice, hotelId }) {
    const res = await axiosInstance.post('/promotion/apply', { code, totalPrice, hotelId });
    return res.data;
  },

  // Public — lists only currently-active promotions for a hotel.
  async getActivePromotions(hotelId) {
    const res = await axiosInstance.get('/promotions', { params: { hotelId } });
    return Array.isArray(res.data) ? res.data : [];
  },

  async createPromotion(payload) {
    const res = await axiosInstance.post('/promotions', payload);
    return res.data;
  },

  // Partial update — only send the fields being changed.
  async updatePromotion(id, payload) {
    const res = await axiosInstance.put(`/promotions/${id}`, payload);
    return res.data;
  },

  // Deactivates (soft-delete) — there is no hard-delete or reactivate endpoint.
  async deactivatePromotion(id) {
    const res = await axiosInstance.delete(`/promotions/${id}`);
    return res.data;
  },
};

export default promotionApi;
