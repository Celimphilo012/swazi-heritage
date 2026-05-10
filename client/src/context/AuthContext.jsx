import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.data))
      .catch(() => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken',  data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('accessToken',  data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
