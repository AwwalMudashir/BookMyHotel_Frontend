import axiosInstance from './axiosInstance';
import { AUTH_STORAGE_KEYS } from '../utils/constants';

const normalizeError = (error) => {
  const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
  const err = new Error(message);
  err.status = error.response?.status;
  return err;
};

const authApi = {
  async register(payload) {
    console.info('[authApi] register request', payload);
    try {
      const response = await axiosInstance.post('/auth/register', payload);
      console.info('[authApi] register response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async login(payload) {
    console.info('[authApi] login request', payload);
    try {
      const response = await axiosInstance.post('/auth/login', payload);
      console.info('[authApi] login response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async refreshToken(refreshToken) {
    console.info('[authApi] refresh request', { refreshToken });
    try {
      const response = await axiosInstance.post('/auth/refresh', { refreshToken });
      console.info('[authApi] refresh response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async logout(refreshToken) {
    console.info('[authApi] logout request', { refreshToken });
    try {
      const response = await axiosInstance.post('/auth/logout', null, { params: { refreshToken } });
      console.info('[authApi] logout response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getCurrentUser() {
    console.info('[authApi] get current user request');
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_STORAGE_KEYS.token) || '' : '';
      const response = await axiosInstance.get('/auth/me', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      console.info('[authApi] get current user response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async registerHotelManager(payload) {
    console.info('[authApi] register hotel manager request', payload);
    try {
      const response = await axiosInstance.post('/auth/register/hotel-manager', payload);
      console.info('[authApi] register hotel manager response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async registerAdmin(payload) {
    console.info('[authApi] register admin request', payload);
    try {
      const response = await axiosInstance.post('/auth/register/admin', payload);
      console.info('[authApi] register admin response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async forgotPassword(email) {
    console.info('[authApi] forgot password request', { email });
    try {
      const response = await axiosInstance.post('/auth/forgot-password', null, { params: { email } });
      console.info('[authApi] forgot password response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async resendOtp(email) {
    console.info('[authApi] resend otp request', { email });
    try {
      const response = await axiosInstance.post('/auth/resend-otp', null, { params: { email } });
      console.info('[authApi] resend otp response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async verifyOtp(payload) {
    console.info('[authApi] verify otp request', payload);
    try {
      const response = await axiosInstance.post('/auth/verify-otp', payload);
      console.info('[authApi] verify otp response', response.data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};

export default authApi;
