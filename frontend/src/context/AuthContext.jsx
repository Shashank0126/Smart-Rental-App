import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await authAPI.me();
        setUser(res.data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, []);

  const login = (tokenStr, userData) => {
    setToken(tokenStr);
    setUser(userData);
    localStorage.setItem('token', tokenStr);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin  = user?.role === 'admin';
  const isOwner  = user?.role === 'owner';
  const isUser   = user?.role === 'user';
  const isApproved = user?.isApproved === 'approved';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isOwner, isUser, isApproved }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
