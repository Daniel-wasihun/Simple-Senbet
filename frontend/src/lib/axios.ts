import axios from "axios";

// Helper function to get cookie by name
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const api = axios.create({
  baseURL: "", // Use empty baseURL to allow full paths to be passed
  withCredentials: true, // Enable credentials for CSRF cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Add auth token to Authorization header
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('AXIOS No auth token found in localStorage or headers object missing');
    }

    // Add XSRF-TOKEN from cookies to header
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken && config.headers) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    } else {
      console.warn('AXIOS No XSRF-TOKEN found in cookies or headers object missing');
    }
  }
  return config;
});

// Fetch CSRF cookie before making requests that require it
export const setupCsrf = async () => {
  try {
    // Use the same axios instance but with full URL
    const response = await api.get("/sanctum/csrf-cookie");

    // Wait briefly to ensure the cookie is set in the browser
    await new Promise(resolve => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    console.error("CSRF initialization failed:", error);
    return false;
  }
};

export default api;
