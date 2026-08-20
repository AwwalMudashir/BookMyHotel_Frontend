import axiosInstance from './axiosInstance';

// Purpose: Booking creation, lookup, and cancellation API helpers.
const bookingApi = {
  async createBooking({ roomId, checkIn, checkOut, promoCode, services = [], ecoPointsToRedeem = 0 }) {
    const res = await axiosInstance.post('/bookings/create', {
      roomId,
      checkIn,
      checkOut,
      services,
      ecoPointsToRedeem,
      ...(promoCode ? { promoCode } : {}),
    });
    return res.data;
  },

  async attachServices(bookingId, services) {
    const res = await axiosInstance.post(`/bookings/${bookingId}/services`, { services });
    return res.data;
  },

  async getBookings({ status, page = 0, size = 50 } = {}) {
    const res = await axiosInstance.get('/bookings', {
      params: { ...(status ? { status } : {}), page, size },
    });
    return res.data;
  },

  async getBooking(bookingId) {
    const res = await axiosInstance.get(`/bookings/${bookingId}`);
    return res.data;
  },

  async cancelBooking(bookingId) {
    const res = await axiosInstance.post(`/bookings/${bookingId}/cancel`);
    return res.data;
  },
};

export default bookingApi;
