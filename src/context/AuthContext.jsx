import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authApi from '../api/authApi';
import { refreshAccessToken } from '../api/axiosInstance';
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
    id: source.id ?? null,
    userId: source.userId || source.user_id || payload?.userId || null,
    email: source.email || payload?.email || payload?.sub || '',
    firstName: source.firstName || source.first_name || '',
    lastName: source.lastName || source.last_name || '',
    role: source.role || payload?.role || 'GUEST',
    managedHotel: source.managedHotel || null,
    ecoPoints: Number(source.ecoPoints ?? 0) || 0,
    emailNotifications: source.emailNotifications ?? source.email_notifications ?? false,
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
      // JWT claims only contain email and role. Do not expose that partial
      // identity as a hydrated session before /auth/me has completed.
      isHydrated: false,
    };
  }

  // The access token has lapsed, but a refresh token can still revive the
  // session — keep it and let hydrateSession() spend it. Only a session with
  // nothing left to spend gets wiped here.
  if (storedRefreshToken) {
    return {
      user: null,
      token: '',
      refreshToken: storedRefreshToken,
      isHydrated: false,
    };
  }

  clearStoredAuth();
  return {
    user: null,
    token: '',
    refreshToken: '',
    isHydrated: true,
  };
};

export const AuthProvider = ({ children }) => {
  const initialAuthState = getInitialAuthState();
  const [user, setUser] = useState(initialAuthState.user);
  const [token, setToken] = useState(initialAuthState.token);
  const [refreshToken, setRefreshToken] = useState(initialAuthState.refreshToken);
  const [isHydrated, setIsHydrated] = useState(initialAuthState.isHydrated);

  const reloadUser = useCallback(async (fallbackToken = '') => {
    const response = await authApi.getCurrentUser();
    const activeToken = getStoredValue(AUTH_STORAGE_KEYS.token) || fallbackToken;
    const normalized = normalizeUser(response, activeToken);
    setUser(normalized);
    setToken(activeToken);
    setRefreshToken(getStoredValue(AUTH_STORAGE_KEYS.refreshToken));
    return normalized;
  }, []);

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
    const payload = { email: credentials?.email, password: credentials?.password };
    const response = await authApi.login(payload);
    applySession(response, '', remember);
    if (!response?.user && !response?.currentUser) {
      await reloadUser(response?.token || response?.accessToken || '');
    }
    return response;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    return response;
  };

  const loginWithGoogle = async (idToken) => {
    const response = await authApi.googleLogin(idToken);
    applySession(response, '', true);
    if (!response?.user && !response?.currentUser) {
      await reloadUser(response?.token || response?.accessToken || '');
    }
    return response;
  };

  const refreshSession = async () => {
    const currentRefreshToken = refreshToken || getStoredValue(AUTH_STORAGE_KEYS.refreshToken);
    if (!currentRefreshToken) {
      clearStoredAuth();
      setToken('');
      setRefreshToken('');
      setUser(null);
      throw new Error('Session expired');
    }

    // Delegate to the shared single-flight refresh in axiosInstance so this
    // never races against an interceptor-driven refresh.
    const nextAccessToken = await refreshAccessToken();
    setToken(nextAccessToken);
    setRefreshToken(getStoredValue(AUTH_STORAGE_KEYS.refreshToken));
    await reloadUser(nextAccessToken);
    return nextAccessToken;
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
    const handleLogout = () => {
      clearStoredAuth();
      setToken('');
      setRefreshToken('');
      setUser(null);
      setIsHydrated(true);
    };
    const handleTokenRefresh = (event) => {
      const storedToken = getStoredValue(AUTH_STORAGE_KEYS.token);
      const storedRefreshToken = getStoredValue(AUTH_STORAGE_KEYS.refreshToken);
      const refreshedUser = event?.detail?.user;

      if (storedToken && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        if (refreshedUser) {
          setUser(normalizeUser(refreshedUser, storedToken));
          setIsHydrated(true);
        } else {
          // Backward-compatible fallback for an older API response. A refreshed
          // JWT is not a user profile, so fetch the authoritative database row.
          authApi.getCurrentUser()
            .then((response) => {
              setUser(normalizeUser(response, storedToken));
              setIsHydrated(true);
            })
            .catch(() => {
              // Keep the previous complete identity during a transient failure.
            });
        }
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
      const storedRefreshToken = getStoredValue(AUTH_STORAGE_KEYS.refreshToken);

      // A stale access token is only fatal when there is no refresh token left:
      // axiosInstance refreshes transparently on the /auth/me call below.
      if ((!storedToken || isTokenExpired(storedToken)) && !storedRefreshToken) {
        clearStoredAuth();
        setToken('');
        setRefreshToken('');
        setUser(null);
        setIsHydrated(true);
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        // The request may have rotated the tokens on its way out, so read back
        // what is actually stored rather than what we captured above.
        const activeToken = getStoredValue(AUTH_STORAGE_KEYS.token);
        setUser(normalizeUser(response, activeToken));
        setToken(activeToken);
        setRefreshToken(getStoredValue(AUTH_STORAGE_KEYS.refreshToken));
      } catch (error) {
        console.error('[AuthContext] unable to hydrate session', error);
        handleLogout();
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

  const value = {
    user,
    role: user?.role || 'GUEST',
    token,
    refreshToken,
    isHydrated,
    isAuthenticated: Boolean(token && user && isHydrated && !isTokenExpired(token)),
    login,
    loginWithGoogle,
    register,
    refreshSession,
    reloadUser,
    logout,
  };

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
