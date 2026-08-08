import axiosInstance from './axiosInstance';

// Purpose: Payment intent creation and payment status API helpers.
const paymentApi = {
  async createIntent(bookingId) {
    const res = await axiosInstance.post('/payments/intent', { bookingId });
    return res.data;
  },

  // A 404 here just means nobody has attempted to pay for this booking yet — a normal
  // state, not an error. Callers should treat a null return as "no payment record".
  async getPayment(bookingId) {
    try {
      const res = await axiosInstance.get(`/payments/${bookingId}`);
      return res.data;
    } catch (err) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  // Fetch payment using paymentId (public ID) instead of database ID for enhanced security
  async getPaymentByPaymentId(paymentId) {
    try {
      const res = await axiosInstance.get(`/payments/by-id/${paymentId}`);
      return res.data;
    } catch (err) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};

export default paymentApi;
