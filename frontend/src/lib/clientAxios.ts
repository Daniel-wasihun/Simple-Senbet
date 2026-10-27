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
    // Add auth token to Authorization header if present in localStorage
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add XSRF-TOKEN from cookies to header if present
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken && config.headers) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }
  }
  return config;
});

// Track whether CSRF is already initialized and a pending init promise for deduplication
let csrfInitialized = false;
let csrfPending: Promise<boolean> | null = null;

export const setupCsrf = async (): Promise<boolean> => {
  // Already initialized — skip entirely (major perf gain: no roundtrip)
  if (csrfInitialized) return true;

  // Deduplicate concurrent calls — return the same promise
  if (csrfPending) return csrfPending;

  csrfPending = (async () => {
    try {
      await clientAxiosInstance.get("/sanctum/csrf-cookie");
      // No artificial delay — the interceptor attaches the cookie on the next request automatically
      csrfInitialized = true;
      return true;
    } catch (error) {
      console.error("CSRF initialization failed:", error);
      return false;
    } finally {
      csrfPending = null;
    }
  })();

  return csrfPending;
};

export default clientAxiosInstance;
