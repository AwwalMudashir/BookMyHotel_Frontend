import axiosInstance from './axiosInstance';

// Purpose: Booking service add-on API helpers.
const serviceApi = {
  // Used by the room-detail add-on checkboxes.
  async getBranchServices(branchId) {
    const res = await axiosInstance.get(`/branches/${branchId}/services`);
    return Array.isArray(res.data) ? res.data : [];
  },

  // Same shape, different route — this one backs the manager's service-management screen.
  async getServicesByBranch(branchId) {
    const res = await axiosInstance.get(`/services/branch/${branchId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  async createService({ branchId, name, description, price, serviceType }) {
    const res = await axiosInstance.post('/services', {
      branchId,
      name,
      description: description || null,
      price,
      serviceType,
    });
    return res.data;
  },
};

export default serviceApi;
