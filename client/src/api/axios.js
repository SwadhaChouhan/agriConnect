import axios from 'axios';

// Store accessToken in memory (variable), NEVER in localStorage to prevent XSS attacks
let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => {
  return inMemoryToken;
};

// Create configured Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // required to send and receive HttpOnly cookies (refreshToken)
});

// Request interceptor: attach current in-memory access token to Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: automatically refresh expired access token on 401 response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh endpoint itself returns 401 or request was already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);

        // Retry original failed request with the new access token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
