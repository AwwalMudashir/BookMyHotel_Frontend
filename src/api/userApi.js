import axiosInstance from './axiosInstance';
import authApi from './authApi';

const normalizeError = (error) => {
  const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
  const err = new Error(message);
  err.status = error.response?.status;
  return err;
};

const userApi = {
  async getMe() {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async updateMe(payload) {
    try {
      const response = await axiosInstance.put('/auth/me', payload);
      console.log('updateMe response', response);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async sendOtp(email) {
    return authApi.forgotPassword(email);
  },

  async verifyOtp(payload) {
    return authApi.verifyOtp(payload);
  },

  async resetPassword(payload) {
    try {
      const response = await axiosInstance.post('/auth/reset-password', payload);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};

export default userApi;
