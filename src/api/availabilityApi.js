import axiosInstance from './axiosInstance';

// Purpose: Room availability calendar and date-range pricing API helpers.
const availabilityApi = {
  async getCalendar(roomId, startDate, endDate) {
    const res = await axiosInstance.get(`/availability/${roomId}/calendar`, {
      params: { startDate, endDate },
    });
    return {
      roomId: res.data?.roomId ?? roomId,
      // Lombok/Jackson may serialize a primitive Java `isAvailable` field as
      // either `isAvailable` or `available`. Give the UI one stable shape.
      days: Array.isArray(res.data?.days)
        ? res.data.days.map((day) => ({
            ...day,
            isAvailable: day?.isAvailable ?? day?.available ?? true,
          }))
        : [],
    };
  },

  async getPrice(roomId, checkIn, checkOut, targetCurrency) {
    const res = await axiosInstance.get(`/availability/${roomId}/price`, {
      params: { checkIn, checkOut, ...(targetCurrency ? { targetCurrency } : {}) },
    });
    return {
      ...res.data,
      isAvailable: res.data?.isAvailable ?? res.data?.available ?? true,
    };
  },

  async setAvailability(roomId, payload) {
    const response = await axiosInstance.put(`/availability/${roomId}/availability`, payload);
    return response.data;
  },

  async updateDailyRate(roomId, date, newRate, reason) {
    const response = await axiosInstance.put(`/availability/${roomId}/update-rate`, null, {
      params: { date, newRate, reason },
    });
    return response.data;
  },
};

export default availabilityApi;
