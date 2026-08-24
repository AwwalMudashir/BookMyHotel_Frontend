import axiosInstance from './axiosInstance';

const packageApi = {
  async getActive() {
    const response = await axiosInstance.get('/packages/public/active');
    return Array.isArray(response.data) ? response.data : [];
  },

  async getFeatured() {
    const response = await axiosInstance.get('/packages/public/featured');
    return Array.isArray(response.data) ? response.data : [];
  },

  async getForRoom(roomId) {
    const response = await axiosInstance.get(`/packages/public/room/${roomId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async quote(payload) {
    const response = await axiosInstance.post('/packages/public/quote', payload);
    return response.data;
  },

  async getForManagement(hotelId) {
    const response = await axiosInstance.get('/packages/manage', {
      params: hotelId ? { hotelId } : {},
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async create(payload) {
    const response = await axiosInstance.post('/packages', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await axiosInstance.put(`/packages/${id}`, payload);
    return response.data;
  },

  async setActive(id, active) {
    const response = await axiosInstance.patch(`/packages/${id}/status`, null, { params: { active } });
    return response.data;
  },

  async getSupportedCurrencies() {
    const response = await axiosInstance.get('/exchange-rates/supported-currencies');
    return Array.isArray(response.data?.currencies) ? response.data.currencies : ['USD'];
  },
};

export default packageApi;
