import axios from 'axios';
import toast from 'react-hot-toast';

export const TOKEN_KEY = 'userToken';
export const USER_KEY = 'userData';
export const AUTH_EXPIRED_EVENT = 'auth:expired';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://route-posts.routemisr.com';

export const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (data) {
    if (Array.isArray(data.errors) && data.errors.length) {
      return data.errors
        .map((e) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e)))
        .join(' • ');
    }
    if (typeof data.message === 'string' && data.message) return data.message;
    if (typeof data.error === 'string' && data.error) return data.error;
  }
  if (error?.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
  return error?.message || 'Something went wrong. Please try again.';
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Inject the JWT on every request.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.token = token;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling + token expiration.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthCall = url.includes('/users/signin') || url.includes('/users/signup');
    const hadToken = !!localStorage.getItem(TOKEN_KEY);

    if (status === 401 && hadToken && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      toast.error('Your session has expired. Please log in again.', { id: 'session-expired' });
    } else if (!error?.config?.skipErrorToast) {
      toast.error(getErrorMessage(error), { id: `err-${status || 'net'}-${url}` });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
