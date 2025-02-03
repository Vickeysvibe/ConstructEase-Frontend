import axios from "axios";
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API || "http://localhost:8000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to get the latest token from localStorage
const getAuthToken = () => localStorage.getItem("authToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

// Attach token dynamically before each request
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Flag to track whether token refresh is in progress
let isRefreshing = false;
let refreshSubscribers = [];

// Function to refresh the token
const refreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error("No refresh token available, logging out...");
    handleLogout();
    return null;
  }

  try {
    isRefreshing = true;
    const response = await axios.post(
      `${import.meta.env.VITE_API}`/auth/refresh,
      {
        token: refreshToken,
      }
    );

    const newToken = response.data.token;
    localStorage.setItem("authToken", newToken);

    // Notify all queued requests about the new token
    refreshSubscribers.forEach((callback) => callback(newToken));
    refreshSubscribers = [];

    return newToken;
  } catch (error) {
    console.error(
      "Token refresh failed:",
      error.response?.data?.message || error.message
    );
    handleLogout();
    return null;
  } finally {
    isRefreshing = false;
  }
};

// Logout function (clears tokens & redirects)
const handleLogout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login"; // Redirect to login
};

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request was unauthorized (401) & not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request and retry once a new token is available
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      const newToken = await refreshToken();
      if (newToken) {
        originalRequest.headers.Authorization =` Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// Generic request function
const request = async (method, url, data = null, config = {}) => {
  try {
    const response = await apiClient({ method, url, data, ...config });
    if (config.responseType === "blob") {
      return response;
    }
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Error handler function
const handleApiError = (error) => {
  if (axios.isCancel(error)) {
    console.warn("Request canceled", error.message);
    return;
  }

  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        console.error("Bad Request:", data.message || "Invalid request");
        break;
      case 401:
        console.error("Unauthorized:", data.message || "Please login again");
        break;
      case 403:
        console.error("Forbidden:", data.message || "Access denied");
        break;
      case 404:
        console.error("Not Found:", data.message || "Resource not found");
        break;
      case 500:
        console.error(
          "Internal Server Error:",
          data.message || "Something went wrong"
        );
        break;
      case 503:
        console.error(
          "Service Unavailable:",
          data.message || "Try again later"
        );
        break;
      default:
        console.error(
          "API Error:",
          data.message || "An unexpected error occurred"
        );
    }
  } else if (error.request) {
    console.error("No response received from server");
  } else {
    console.error("Request error:", error.message);
  }
};

export { request };