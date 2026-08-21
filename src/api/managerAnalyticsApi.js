import axiosInstance from './axiosInstance';

const paramsFor = ({ startDate, endDate } = {}) => ({
  ...(startDate ? { startDate } : {}),
  ...(endDate ? { endDate } : {}),
});

const managerAnalyticsApi = {
  async getSummary(range) {
    const response = await axiosInstance.get('/manager/analytics/summary', { params: paramsFor(range) });
    return response.data;
  },
  async getTimeline(range) {
    const response = await axiosInstance.get('/manager/analytics/timeline', { params: paramsFor(range) });
    return Array.isArray(response.data) ? response.data : [];
  },
  async getBookingsByDate(date) {
    const response = await axiosInstance.get('/manager/analytics/bookings-by-date', { params: { date } });
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default managerAnalyticsApi;
