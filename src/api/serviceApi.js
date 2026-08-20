import axiosInstance from './axiosInstance';

const serviceApi = {
  async getBranchServices(branchId) {
    const res = await axiosInstance.get(`/branches/${branchId}/services`);
    return Array.isArray(res.data) ? res.data : [];
  },

  async getManagedServices(hotelId) {
    const res = await axiosInstance.get('/services', {
      params: hotelId ? { hotelId } : undefined,
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  async createService(payload) {
    const res = await axiosInstance.post('/services', payload);
    return res.data;
  },

  async updateService(serviceId, payload) {
    const res = await axiosInstance.put(`/services/${serviceId}`, payload);
    return res.data;
  },

  async deleteService(serviceId) {
    await axiosInstance.delete(`/services/${serviceId}`);
  },
};

export default serviceApi;
