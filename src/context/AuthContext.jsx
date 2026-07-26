import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authApi from '../api/authApi';
import { AUTH_STORAGE_KEYS } from '../utils/constants';
import { decodeJwt } from '../utils/decodeJwt';

const AuthContext = createContext(null);

const getStoredValue = (key) => {
  if (typeof window === 'undefined') return '';
  try {
    // Prefer localStorage (persistent) then sessionStorage (per-tab)
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
    // remember === undefined => preserve existing storage if present, default to localStorage
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

const isTokenExpired = (token) => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  const expiresAt = payload.exp * 1000;
  return Date.now() >= expiresAt;
};

const normalizeUser = (source = {}, fallbackToken = '') => {
  const payload = fallbackToken ? decodeJwt(fallbackToken) : null;
  return {
    id: source.userId || source.id || payload?.userId || payload?.sub || null,
    email: source.email || payload?.email || '',
    firstName: source.firstName || source.first_name || '',
    lastName: source.lastName || source.last_name || '',
    role: source.role || payload?.role || 'GUEST',
    managedHotel: source.managedHotel || null,
  };
};

const getInitialAuthState = () => {
  const storedToken = getStoredValue(AUTH_STORAGE_KEYS.token);
  const storedRefreshToken = getStoredValue(AUTH_STORAGE_KEYS.refreshToken);

  if (storedToken && !isTokenExpired(storedToken)) {
    return {
      user: normalizeUser({}, storedToken),
      token: storedToken,
      refreshToken: storedRefreshToken,
      isHydrated: true,
    };
  }

  clearStoredAuth();
  return {
    user: null,
    token: '',
    refreshToken: '',
    isHydrated: false,
  };
};

export const AuthProvider = ({ children }) => {
  const initialAuthState = getInitialAuthState();
  const [user, setUser] = useState(initialAuthState.user);
  const [token, setToken] = useState(initialAuthState.token);
  const [refreshToken, setRefreshToken] = useState(initialAuthState.refreshToken);
  const [isHydrated, setIsHydrated] = useState(initialAuthState.isHydrated);

  const applySession = (sessionData = {}, fallbackToken = '', remember = true) => {
    const accessToken = sessionData?.token || sessionData?.accessToken || sessionData?.access_token || fallbackToken || '';
    const nextRefreshToken = sessionData?.refreshToken || sessionData?.refresh_token || '';
    const userPayload = sessionData?.user || sessionData?.currentUser || sessionData;

    if (accessToken && !isTokenExpired(accessToken)) {
      setStoredValue(AUTH_STORAGE_KEYS.token, accessToken, remember);
      setToken(accessToken);
    } else {
      clearStoredAuth();
      setToken('');
      setRefreshToken('');
      setUser(null);
      setIsHydrated(true);
      return;
    }

    if (nextRefreshToken) {
      setStoredValue(AUTH_STORAGE_KEYS.refreshToken, nextRefreshToken, remember);
      setRefreshToken(nextRefreshToken);
    } else {
      removeStoredValue(AUTH_STORAGE_KEYS.refreshToken);
      setRefreshToken('');
    }

    setUser(normalizeUser(userPayload, accessToken));
    setIsHydrated(true);
  };

  const login = async (credentials) => {
    // credentials may include `rememberMe` flag from the UI
    const remember = credentials?.rememberMe === false ? false : true;
    const { rememberMe, ...payload } = credentials || {};
    const response = await authApi.login(payload);
    applySession(response, '', remember);
    return response;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    return response;
  };

  const refreshSession = async () => {
    const currentRefreshToken = refreshToken || getStoredValue(AUTH_STORAGE_KEYS.refreshToken);
    if (!currentRefreshToken || isTokenExpired(currentRefreshToken)) {
      clearStoredAuth();
      setToken('');
      setRefreshToken('');
      setUser(null);
      throw new Error('Session expired');
    }

    const response = await authApi.refreshToken(currentRefreshToken);
    applySession(response, token);
    return response;
  };

  const logout = async () => {
    const currentRefreshToken = refreshToken || getStoredValue(AUTH_STORAGE_KEYS.refreshToken);
    try {
      if (currentRefreshToken && !isTokenExpired(currentRefreshToken)) {
        await authApi.logout(currentRefreshToken);
      }
    } catch (error) {
      console.warn('[AuthContext] logout request failed', error);
    } finally {
      clearStoredAuth();
      setToken('');
      setRefreshToken('');
      setUser(null);
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    const handleLogout = () => logout();
    const handleTokenRefresh = () => {
      const storedToken = getStoredValue(AUTH_STORAGE_KEYS.token);
      const storedRefreshToken = getStoredValue(AUTH_STORAGE_KEYS.refreshToken);

      if (storedToken && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser((currentUser) => currentUser || normalizeUser({}, storedToken));
        setIsHydrated(true);
      } else {
        clearStoredAuth();
        setToken('');
        setRefreshToken('');
        setUser(null);
        setIsHydrated(true);
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:token-refreshed', handleTokenRefresh);

    const hydrateSession = async () => {
      const storedToken = getStoredValue(AUTH_STORAGE_KEYS.token);
      if (!storedToken || isTokenExpired(storedToken)) {
        clearStoredAuth();
        setToken('');
        setRefreshToken('');
        setUser(null);
        setIsHydrated(true);
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        setUser(normalizeUser(response, storedToken));
        setToken(storedToken);
        setRefreshToken(getStoredValue(AUTH_STORAGE_KEYS.refreshToken));
      } catch (error) {
        console.error('[AuthContext] unable to hydrate session', error);
        await logout();
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateSession();
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh);
    };
  }, []);

  const value = useMemo(() => ({
    user,
    role: user?.role || 'GUEST',
    token,
    refreshToken,
    isAuthenticated: Boolean(token && user && isHydrated && !isTokenExpired(token)),
    login,
    register,
    refreshSession,
    logout,
  }), [user, token, refreshToken, isHydrated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
