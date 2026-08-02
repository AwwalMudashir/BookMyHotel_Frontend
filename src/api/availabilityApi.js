import axiosInstance from './axiosInstance';

// Purpose: Room availability calendar and date-range pricing API helpers.
const availabilityApi = {
  async getCalendar(roomId, startDate, endDate) {
    const res = await axiosInstance.get(`/availability/${roomId}/calendar`, {
      params: { startDate, endDate },
    });
    return {
      roomId: res.data?.roomId ?? roomId,
      days: Array.isArray(res.data?.days) ? res.data.days : [],
    };
  },

  async getPrice(roomId, checkIn, checkOut, targetCurrency) {
    const res = await axiosInstance.get(`/availability/${roomId}/price`, {
      params: { checkIn, checkOut, ...(targetCurrency ? { targetCurrency } : {}) },
    });
    return res.data;
  },
};

export default availabilityApi;
