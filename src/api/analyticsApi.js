import axiosInstance from './axiosInstance';

// Purpose: Admin-only platform/hotel analytics API helpers.
const analyticsApi = {
  async getSummary({ startDate, endDate } = {}) {
    const res = await axiosInstance.get('/admin/analytics/summary', {
      params: { ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) },
    });
    return res.data;
  },

  async getHotelSummary(hotelId, { startDate, endDate } = {}) {
    const res = await axiosInstance.get(`/admin/analytics/hotel/${hotelId}`, {
      params: { ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) },
    });
    return res.data;
  },

  async getBookingsByDate({ hotelId, date }) {
    const res = await axiosInstance.get('/admin/analytics/bookings-by-date', {
      params: { hotelId, date },
    });
    return Array.isArray(res.data) ? res.data : [];
  },
};

export default analyticsApi;
