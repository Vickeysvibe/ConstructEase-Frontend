import axios from "axios";

const token = localStorage.getItem("authToken");
// Create an Axios instance with default settings
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API || "http://localhost:8000/api",
  timeout: 10000, // Set timeout to 10 seconds
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  },
});

// Global request handler function
const request = async (method, url, data = null, config = {}) => {
  try {
    const response = await apiClient({ method, url, data, ...config });
    if (config.responseType === "blob") {
      return response;
    }
    return response.data; // Return response data directly
  } catch (error) {
    handleApiError(error);
    throw error; // Rethrow for further handling if needed
  }
};

// Handle different response status codes
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
        // Optionally handle logout or token refresh logic
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
