import api, { setupCsrf } from "@/lib/clientAxios";
import { normalizeBffPath } from "@/services/backendApi.service";
import type { Method } from "axios";

// Helper function to get cookie by name
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// BFF requests (/api/backend/*) are proxied through Next.js server routes — no client-side
// CSRF handshake needed. CSRF only applies to direct calls to the Laravel backend origin.
const isBffRequest = (url: string): boolean => url.includes("/api/backend/");
const withClientOrigin = (url: string): string => {
  if (typeof window === "undefined" || /^https?:\/\//i.test(url)) return url;
  return new URL(url, window.location.origin).toString();
};

/** Build axios config with auth headers (no CSRF init for BFF). */
function buildConfig(extraHeaders?: Record<string, string | undefined>): any {
  const headers: Record<string, string | undefined> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...extraHeaders,
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
    const xsrfToken = getCookie("XSRF-TOKEN");
    if (xsrfToken) headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
  }
  return { headers, withCredentials: true };
}

export const apiService = {
  localRequest: async (url: string, init: RequestInit = {}): Promise<Response> => fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: { Accept: "application/json", ...init.headers },
  }),

  request: async <T>(url: string, method: Method = "GET", data?: unknown) => {
    const path = normalizeBffPath(url);
    const target = withClientOrigin(path);
    try {
      let result: T;
      // Only BFF requests — no CSRF needed since Next.js handles auth server-side.
      // For non-BFF (direct backend) calls, still initialize CSRF.
      if (!isBffRequest(target)) await setupCsrf();
      switch (method.toUpperCase()) {
        case "POST":   result = await apiService.post<T>(target, data); break;
        case "PUT":    result = await apiService.put<T>(target, data); break;
        case "PATCH":  result = await apiService.patch<T>(target, data); break;
        case "DELETE": result = await apiService.delete<T>(target); break;
        case "GET":    result = await apiService.get<T>(target); break;
        default: throw new Error(`Unsupported API method: ${method}`);
      }
      return { data: result, status: 200, ok: true };
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: T } })?.response;
      return { data: response?.data ?? ({ message: error instanceof Error ? error.message : "The request failed." } as T), status: response?.status ?? 0, ok: false };
    }
  },

  get: async <T>(url: string): Promise<T> => {
    if (!isBffRequest(url)) await setupCsrf();
    const response = await api.get<T>(url, buildConfig());
    return response.data;
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    if (!isBffRequest(url)) await setupCsrf();
    const isFormData = data instanceof FormData;
    const config = buildConfig(isFormData ? { "Content-Type": undefined } : undefined);
    try {
      const response = await api.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error("POST request failed:", error.response?.status);
      throw error;
    }
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    if (!isBffRequest(url)) await setupCsrf();
    const isFormData = data instanceof FormData;
    const config = buildConfig(isFormData ? { "Content-Type": undefined } : undefined);
    try {
      const response = await api.put<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error("PUT request failed:", error.response?.status);
      throw error;
    }
  },

  patch: async <T>(url: string, data?: any): Promise<T> => {
    if (!isBffRequest(url)) await setupCsrf();
    const isFormData = data instanceof FormData;
    const config = buildConfig(isFormData ? { "Content-Type": undefined } : undefined);
    try {
      const response = await api.patch<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error("PATCH request failed:", error.response?.status);
      throw error;
    }
  },

  delete: async <T>(url: string): Promise<T> => {
    if (!isBffRequest(url)) await setupCsrf();
    const response = await api.delete<T>(url, buildConfig());
    return response.data;
  },
};



