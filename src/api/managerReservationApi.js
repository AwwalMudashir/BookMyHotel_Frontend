import axiosInstance from './axiosInstance';

const managerReservationApi = {
  async getReservations({ date, status, page = 0, size = 20 } = {}) {
    const response = await axiosInstance.get('/manager/reservations', { params: { ...(date ? { date } : {}), ...(status ? { status } : {}), page, size } });
    return response.data;
  },
  async updateStatus(id, status) {
    const response = await axiosInstance.put(`/manager/reservations/${id}`, { status });
    return response.data;
  },
};
export default managerReservationApi;
