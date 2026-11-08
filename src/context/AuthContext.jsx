import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/services';
import { AUTH_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from '../api/axiosInstance';

const AuthContext = createContext(null);

const isTokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return typeof exp === 'number' && exp * 1000 < Date.now();
  } catch {
    return false; // Not a decodable JWT: let the server decide.
  }
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t && isTokenExpired(t)) {
      clearSession();
      return null;
    }
    return t;
  });
  const [user, setUser] = useState(readStoredUser);
  const [initializing, setInitializing] = useState(!!localStorage.getItem(TOKEN_KEY));

  const saveUser = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const login = useCallback(
    (newToken, newUser) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      if (newUser) saveUser(newUser);
    },
    [saveUser]
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const updateToken = useCallback((newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authApi.profile({ skipErrorToast: true });
    const d = res?.data?.data;
    const u = d?.user || d;
    if (u) saveUser(u);
    return u;
  }, [saveUser]);

  // Restore the session on page load (F5).
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setInitializing(false);
      return undefined;
    }
    refreshUser()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to a 401 raised anywhere in the app.
  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const value = useMemo(
    () => ({ token, user, initializing, isAuthenticated: !!token, login, logout, updateToken, refreshUser }),
    [token, user, initializing, login, logout, updateToken, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
