import axiosInstance from './axiosInstance';

const sustainabilityTagApi = {
  async getAll(hotelId) {
    const response = await axiosInstance.get('/sustainability-tags', {
      params: hotelId ? { hotelId } : {},
    });
    return Array.isArray(response.data) ? response.data : [];
  },
  async getForBranch(branchId) {
    const response = await axiosInstance.get(`/sustainability-tags/branch/${branchId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
  async create(payload) {
    const response = await axiosInstance.post('/sustainability-tags', payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await axiosInstance.put(`/sustainability-tags/${id}`, payload);
    return response.data;
  },
  async remove(id) {
    await axiosInstance.delete(`/sustainability-tags/${id}`);
  },
};

export default sustainabilityTagApi;
