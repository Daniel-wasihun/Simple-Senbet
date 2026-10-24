// lib/clientAxios.ts
import axios from "axios";

// Helper function to get cookie by name
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Client-side axios instance that uses relative URLs to leverage Next.js rewrites
const clientAxiosInstance = axios.create({
  // baseURL: "/", // Use relative URLs for client-side requests to leverage Next.js rewrites
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Use direct URL to bypass Next.js rewrites and fix 500 errors
  withCredentials: true, // Enable credentials for CSRF cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

clientAxiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Add auth token to Authorization header
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token found in localStorage or headers object missing');
    }

    // Add XSRF-TOKEN from cookies to header
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken && config.headers) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    } else {
      console.warn('No XSRF-TOKEN found in cookies or headers object missing');
    }
  }
  return config;
});

export const setupCsrf = async () => {
  try {
    // Ensure we have a fresh CSRF cookie before making requests
    const response = await clientAxiosInstance.get("/sanctum/csrf-cookie");

    // Wait briefly to ensure the cookie is set in the browser
    await new Promise(resolve => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    console.error("CSRF initialization failed:", error);
    return false;
  }
};

export default clientAxiosInstance;
