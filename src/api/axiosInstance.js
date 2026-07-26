import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL, AUTH_STORAGE_KEYS } from '../utils/constants';
import { decodeJwt } from '../utils/decodeJwt';

const isTokenExpired = (token) => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  const expiresAt = payload.exp * 1000;
  return Date.now() >= expiresAt;
};

const getStoredValue = (key) => {
  if (typeof window === 'undefined') return '';
  try {
    const local = window.localStorage.getItem(key);
    if (local !== null) return local;
    const sess = window.sessionStorage.getItem(key);
    return sess || '';
  } catch {
    return '';
  }
};

const setStoredValue = (key, value, remember = undefined) => {
  if (typeof window === 'undefined') return;
  try {
    const keyInLocal = window.localStorage.getItem(key) !== null;
    const keyInSession = window.sessionStorage.getItem(key) !== null;
    const useLocal = remember === true || (remember === undefined && (keyInLocal || !keyInSession));

    if (value) {
      if (useLocal) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
      }
    } else {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors so auth can still work in restricted environments.
  }
};

const removeStoredValue = (key) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors so auth can still work in restricted environments.
  }
};

const clearStoredAuth = () => {
  removeStoredValue(AUTH_STORAGE_KEYS.token);
  removeStoredValue(AUTH_STORAGE_KEYS.refreshToken);
};

const isAuthRequest = (url = '') => /\/auth\/(login|register|refresh|logout|forgot-password|resend-otp|verify-otp)/.test(url);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const url = config?.url || '';

  const token = getStoredValue(AUTH_STORAGE_KEYS.token);
  if (token && !isTokenExpired(token)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // If no valid token is present, clear stored auth so subsequent logic is consistent
    clearStoredAuth();
    if (config.headers) delete config.headers.Authorization;
  }

  return config;
}, (error) => Promise.reject(error));

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    const isAuthRouteRequest = isAuthRequest(requestUrl);

    if (status === 401 && !isAuthRouteRequest && !originalRequest._retry) {
      const refreshToken = getStoredValue(AUTH_STORAGE_KEYS.refreshToken);

      if (!refreshToken) {
        toast.error('You have to log in');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axiosInstance.post('/auth/refresh', { refreshToken });
        const nextAccessToken = response.data?.token || response.data?.accessToken || response.data?.access_token || '';
        const nextRefreshToken = response.data?.refreshToken || response.data?.refresh_token || refreshToken;

        if (!nextAccessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        setStoredValue(AUTH_STORAGE_KEYS.token, nextAccessToken);
        setStoredValue(AUTH_STORAGE_KEYS.refreshToken, nextRefreshToken);
        window.dispatchEvent(new Event('auth:token-refreshed'));
        processQueue(null, nextAccessToken);

        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        toast.error('You have to log in');
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && !isAuthRouteRequest) {
      toast.error('You have to log in');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
