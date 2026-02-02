import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const token = localStorage.getItem("token");

let isRefreshing = false;
export let failedQueue = [];

// Helper to process the queue of requests that failed while refreshing
export const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // important: send the auth cookie
});

// 1. Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor (The Logic Hub)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : null;

    // --- REFRESH TOKEN LOGIC ---
    // If 401 and not already retrying this specific request
    if (status === 401 && !originalRequest._retry && token) {
      // A. If refreshing is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      } else if (status === 401) {
        // If 401 but no token exists, just clear and go to login without looping
        localStorage.clear();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      // B. Mark as retry and start refresh process
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use standard axios (not axiosInstance) to avoid interceptor loops
        const response = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
          }
        );

        const { token } = response.data; // Adjust based on your API structure
        localStorage.setItem("token", token);

        // Update the instance header for future calls
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        // Process the queue with the new token
        processQueue(null, token);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // C. If refresh fails, clear all and force login
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // --- STANDALONE ERROR HANDLING (For other codes) ---
    if (status === 403) {
      console.error("Authorization Error: You do not have permission.");
    } else if (status === 404) {
      console.error("Resource not found.");
    } else if (status === 500) {
      console.error("Server error. Please try again later.");
    } else if (!status) {
      console.error("Network error or CORS issue.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
