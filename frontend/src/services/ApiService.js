import axios from "./api.js"; // This is your axiosInstance
// Note: Ensure you export 'processQueue' from your api.js file where interceptors are defined.
import { processQueue } from "./api.js";

/**
 * 1. The Result Wrapper (Standardizing the UI response)
 */
export const safeCall = async (promise) => {
  try {
    const res = await promise;
    return { success: true, data: res.data, status: res.status };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || "An unexpected error occurred",
      status: err.response?.status,
    };
  }
};

/**
 * 2. The Base Request Handler
 * Standardizes how we call axios so we don't repeat try/catch/log logic.
 */
const request = async (config) => {
  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    // Log to external services like Sentry here
    console.error(`API Error [${config.method}] ${config.url}:`, error);
    throw error; 
  }
};

/**
 * 3. Simplified API Methods
 */
export const api = {
  get: (url, config = {}) => request({ method: 'get', url, ...config }),
  
  post: (url, data, config = {}) => request({ method: 'post', url, data, ...config }),
  
  put: (url, data, config = {}) => request({ method: 'put', url, data, ...config }),
  
  delete: (url, config = {}) => request({ method: 'delete', url, ...config }),

  // Special case for downloads
  download: (url, data = {}) => request({ 
    method: 'post', 
    url, 
    data, 
    responseType: 'blob' 
  }),
};

/**
 * 4. Industrial Standard Logout
 * Integrates with safeCall and handles global cleanup
 */
export const logoutUser = async () => {
  // A. Call backend logout (Best effort)
  // We use safeCall so the function continues even if the network fails
  await safeCall(api.post('/auth/logout'));

  // B. Clear Authentication Data
  localStorage.removeItem("token");
  localStorage.clear(); 

  // C. Reset Axios Instance
  // Remove the default Authorization header for any future requests
  delete axios.defaults.headers.common["Authorization"];

  // D. Clear Interceptor Queue
  // If there were requests waiting for a refresh token, cancel them
  if (typeof processQueue === "function") {
    processQueue(new Error("User logged out"), null);
  }

  // E. Finalize
  window.location.href = "/login";
};

/* 
// sample 1 use case.....
import { api, safeCall } from './apiUtils';

export const getUserProfile = (userId) => 
  safeCall(api.get(`/users/${userId}`));

export const updateAvatar = (formData) => 
  safeCall(api.post(`/users/upload`, formData)); // No manual headers needed!

// sample 2 use case.....
import apiClient from './api';
import { safeCall } from './apiUtils'; // The wrapper from the previous step

// Clean and focused: Just the URL and the data
export const uploadDocument = (formData) => 
  safeCall(apiClient.post('/documents/upload', formData));

export const getDashboardData = () => 
  safeCall(apiClient.get('/dashboard/stats'));
To move your code to a professional, "industrial" level, you need to automate the repetitive tasks. In a production environment, you shouldn't manually handle headers or tokens in every function; instead, you let the Axios Instance and Interceptors do the heavy lifting.The Global API Setup (api.js)This setup creates a single source of truth for your API configuration. It automatically attaches tokens to outgoing requests and handles errors before they even reach your components.JavaScriptimport axios from 'axios';

// 1. Create the Instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api.yourdomain.com',
  timeout: 10000, // 10 seconds
});

// 2. Request Interceptor: Global Header Management
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or your preferred store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Note: Axios automatically sets 'Content-Type' to 'multipart/form-data' 
    // if the data is an instance of FormData. No manual check needed.
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    const { response } = error;

    if (response) {
      // Global logic based on Status Codes
      switch (response.status) {
        case 401:
          // Unauthorized: Clear session and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error("You don't have permission to do this.");
          break;
        case 500:
          console.error("Server-side error. Please try again later.");
          break;
        default:
          break;
      }
    } else if (error.request) {
      // The request was made but no response was received (Network Error)
      console.error("Network error. Please check your internet connection.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
Why this is "Industrial Standard"FeatureWhy it mattersToken InjectionYou don't have to remember to add the Authorization header to every single API call. It's centralized.Timeout HandlingPrevents the app from "hanging" forever if the server is unresponsive.Automatic RoutingIf a user's token expires (401), they are kicked to the login page immediately, regardless of which page they are on.Clean MethodsBecause the instance is configured, your actual service calls become very short and readable.Updated Service Layer ExampleNow, your service file becomes incredibly clean. You no longer need to worry about headers or environment variables here.JavaScriptimport apiClient from './api';
import { safeCall } from './apiUtils'; // The wrapper from the previous step

// Clean and focused: Just the URL and the data
export const uploadDocument = (formData) => 
  safeCall(apiClient.post('/documents/upload', formData));

export const getDashboardData = () => 
  safeCall(apiClient.get('/dashboard/stats'));

A Note on File Downloads :-
export const downloadReport = async (reportId) => {
  return safeCall(
    apiClient.get(`/reports/${reportId}`, { responseType: 'blob' })
  );
};

*/