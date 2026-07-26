const isProd = import.meta.env.PROD;

export const API_BASE_URL_DEV = 'http://localhost:6767/api/v1';
export const API_BASE_URL_PROD = null;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isProd ? API_BASE_URL_PROD : API_BASE_URL_DEV);
export const API_ENV = import.meta.env.MODE || 'development';
export const AUTH_STORAGE_KEYS = {
  token: 'bmh_token',
  refreshToken: 'bmh_refresh_token',
};
export const ROLE_VALUES = { CUSTOMER: 'CUSTOMER', HOTEL_MANAGER: 'HOTEL_MANAGER', ADMIN: 'ADMIN', GUEST: 'GUEST' };
export const BOOKING_STATUS = { CONFIRMED: 'CONFIRMED', PENDING: 'PENDING', CANCELLED: 'CANCELLED' };
export const SERVICE_TYPES = ['BAR', 'RESTAURANT', 'CAR_HIRE', 'SPA', 'LOCAL_TOUR'];
