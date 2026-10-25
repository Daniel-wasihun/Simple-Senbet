import api from "@/lib/serverAxios";
import type { AxiosRequestConfig, Method } from "axios";

export const serverApiService = {
  requestRaw: async (url: string, config: AxiosRequestConfig & { method?: Method } = {}) => {
    const response = await api.request<string>({
      ...config,
      url,
      responseType: "text",
      transformResponse: [(value) => value],
      validateStatus: () => true,
    });
    const contentType = response.headers["content-type"];
    return { data: response.data, status: response.status, contentType: typeof contentType === "string" ? contentType : undefined };
  },
  get: async <T>(url: string): Promise<T> => {
    const response = await api.get<T>(url);
    return response.data;
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.post<T>(url, data);
    return response.data;
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.put<T>(url, data);
    return response.data;
  },
  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.patch<T>(url, data);
    return response.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await api.delete<T>(url);
    return response.data;
  },
};
