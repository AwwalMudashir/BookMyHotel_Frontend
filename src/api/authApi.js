import axiosInstance from './axiosInstance';
import { parseApiError } from '../utils/parseApiError';

const normalizeError = (error) => {
  // Business-rule errors here can arrive as plain text (e.g. the inactive-account
  // message) or as JSON { status, message } — parseApiError handles both.
  const message = parseApiError(error, error.message || 'Request failed');
  const err = new Error(message);
  err.status = error.response?.status;
  return err;
};

const authApi = {
  async register(payload) {
    try {
      const response = await axiosInstance.post('/auth/register', payload);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async login(payload) {
    try {
      const response = await axiosInstance.post('/auth/login', payload);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async googleLogin(idToken) {
    try {
      const response = await axiosInstance.post('/auth/google', { idToken });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async refreshToken(refreshToken) {
    try {
      const response = await axiosInstance.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async logout(refreshToken) {
    try {
      const response = await axiosInstance.post('/auth/logout', { refreshToken });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getCurrentUser() {
    try {
      // Let the request interceptor supply the token: it also reads sessionStorage
      // and refreshes a lapsed access token before the call goes out.
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async registerHotelManager(payload) {
    try {
      const response = await axiosInstance.post('/auth/register/hotel-manager', payload);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async registerAdmin(payload) {
    try {
      const response = await axiosInstance.post('/auth/register/admin', payload);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async forgotPassword(email) {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', null, { params: { email } });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async resendOtp(email) {
    try {
      const response = await axiosInstance.post('/auth/resend-otp', null, { params: { email } });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async verifyOtp(payload) {
    try {
      const response = await axiosInstance.post('/auth/verify-otp', payload);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};

export default authApi;
