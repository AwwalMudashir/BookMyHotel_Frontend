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

// Only these exact endpoints are public authentication operations. A prefix match here would
// also classify protected routes such as /auth/register/hotel-manager as public and strip the
// administrator's bearer token from the request.
const isAuthRequest = (url = '') => /^\/?auth\/(login|register|google|refresh|logout|forgot-password|resend-otp|verify-otp|reset-password)\/?(?:\?|$)/.test(url);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dedicated bare client for /auth/refresh. It must NOT go through the
// interceptors below, otherwise refreshing would recurse into itself.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;
let loggingOut = false;

const forceLogout = (message = 'Your session has expired. Please log in again.') => {
  clearStoredAuth();
  if (loggingOut) return;
  loggingOut = true;
  toast.error(message);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:logout'));
  }
  // Allow a fresh logout notice once the user has had a chance to sign in again.
  setTimeout(() => { loggingOut = false; }, 1000);
};

/**
 * Exchange the stored refresh token for a new access token.
 *
 * Single-flight: concurrent callers (parallel 401s, or several requests firing
 * at once after the access token lapsed) all await the same in-flight request,
 * so the server only ever sees one rotation and nobody races on a token that
 * has already been rotated away.
 */
export const refreshAccessToken = () => {
  if (refreshPromise) return refreshPromise;

  const storedRefreshToken = getStoredValue(AUTH_STORAGE_KEYS.refreshToken);
  if (!storedRefreshToken) {
    return Promise.reject(new Error('No refresh token available'));
  }

  refreshPromise = refreshClient
    .post('/auth/refresh', { refreshToken: storedRefreshToken })
    .then(({ data }) => {
      // /auth/refresh returns `accessToken`, /auth/login returns `token`.
      const nextAccessToken = data?.accessToken || data?.token || data?.access_token || '';
      const nextRefreshToken = data?.refreshToken || data?.refresh_token || storedRefreshToken;

      if (!nextAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      setStoredValue(AUTH_STORAGE_KEYS.token, nextAccessToken);
      setStoredValue(AUTH_STORAGE_KEYS.refreshToken, nextRefreshToken);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
          detail: { user: data?.user || data?.currentUser || null },
        }));
      }
      return nextAccessToken;
    })
    .catch((error) => {
      // Only a definitive rejection from the server kills the session. A network
      // blip or a 5xx must not sign the user out — they can retry.
      const status = error?.response?.status;
      if (status >= 400 && status < 500) {
        forceLogout();
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

axiosInstance.interceptors.request.use(async (config) => {
  const url = config?.url || '';
  config.headers = config.headers || {};

  if (isAuthRequest(url)) {
    delete config.headers.Authorization;
    return config;
  }

  let token = getStoredValue(AUTH_STORAGE_KEYS.token);

  // Access token has lapsed but the refresh token is still good: trade it in
  // now rather than firing a request we already know will come back 401.
  if ((!token || isTokenExpired(token)) && getStoredValue(AUTH_STORAGE_KEYS.refreshToken)) {
    // Let a refresh-network failure reject this request. Continuing without
    // credentials would turn it into a misleading 401 and discard good state.
    token = await refreshAccessToken();
  }

  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
}, (error) => Promise.reject(error));

axiosInstance.interceptors.response.use(
  (response) => {
    try {
      const emailFailure = response?.headers?.['x-email-failure'] || response?.headers?.['X-Email-Failure'];
      if (emailFailure) {
        const map = {
          welcome_email_failed: 'Welcome email could not be sent. The account was created successfully.',
          manager_welcome_email_failed: 'Manager welcome email could not be sent. The account was created successfully.',
          admin_welcome_email_failed: 'Admin welcome email could not be sent. The account was created successfully.',
          contact_notification_failed: 'Your enquiry was received but we could not send a notification email to support.',
          booking_confirmation_email_failed: 'Booking confirmed but confirmation email could not be sent.',
          booking_cancellation_email_failed: 'Booking cancelled but cancellation email could not be sent.',
          otp_email_failed: 'OTP email could not be sent. Please try resending.',
        };
        const message = map[emailFailure] || 'An important email could not be sent. Please check your inbox or try again later.';
        toast.error(message);
      }
    } catch {
      // ignore toast errors
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || isAuthRequest(originalRequest.url || '')) {
      return Promise.reject(error);
    }

    // Already refreshed once for this request and it is still unauthorised —
    // retrying again would loop.
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!getStoredValue(AUTH_STORAGE_KEYS.refreshToken)) {
      // A 401 with no token on file at all is just a guest hitting a protected
      // endpoint (e.g. browsing a room detail page anonymously) — not a session
      // that expired. Only announce "you have to log in" when there was an
      // access token to begin with, so anonymous browsing stays silent.
      if (getStoredValue(AUTH_STORAGE_KEYS.token)) {
        forceLogout('You have to log in');
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const nextAccessToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default axiosInstance;

