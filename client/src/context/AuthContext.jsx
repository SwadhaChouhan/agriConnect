import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken as syncAxiosToken } from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to keep both React state and Axios in-memory module variable synchronized
  const updateToken = (token) => {
    setAccessTokenState(token);
    syncAxiosToken(token);
  };

  /**
   * Login with email and password
   * Access token is stored strictly in memory (React state), never in localStorage
   */
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken: token, user: userData } = res.data;

    updateToken(token);
    setUser(userData);
    return res.data;
  };

  /**
   * Logout user, clearing server-side refresh token, cookie, and client memory state
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error from server:', err.message);
    } finally {
      updateToken(null);
      setUser(null);
    }
  };

  /**
   * On initial app load, attempt a silent token refresh using the HttpOnly cookie.
   * If a valid refresh token exists in cookies, restore the session seamlessly.
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        updateToken(data.accessToken);

        // Fetch current authenticated user's profile
        const meRes = await api.get('/auth/me');
        setUser(meRes.data.user);
      } catch (err) {
        // No valid session or refresh token expired — user stays logged out
        updateToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
