import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { decodeJwt } from '../utils/decodeJwt';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bmh_token') || '');

  const login = (nextToken) => {
    localStorage.setItem('bmh_token', nextToken);
    setToken(nextToken);
    const payload = decodeJwt(nextToken);
    setUser({
      id: payload?.userId || payload?.sub || null,
      email: payload?.email || '',
      role: payload?.role || 'GUEST',
    });
  };

  const logout = () => {
    localStorage.removeItem('bmh_token');
    setToken('');
    setUser(null);
  };

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        setUser({
          id: payload?.userId || payload?.sub || null,
          email: payload?.email || '',
          role: payload?.role || 'GUEST',
        });
      } else {
        logout();
      }
    }
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [token]);

  const value = useMemo(() => ({
    user,
    role: user?.role || 'GUEST',
    token,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
  }), [user, token]);

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
