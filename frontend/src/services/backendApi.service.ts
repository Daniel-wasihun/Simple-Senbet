import type { Method } from "axios";
import { apiCache } from "@/services/apiCache";
import { apiService } from "@/services/api.service";

export interface BackendResponse<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}

type RequestOptions = RequestInit & { cacheTtl?: number };

function toResponse<T>(result: { data: T; status: number; ok: boolean }): BackendResponse<T> {
  return { ok: result.ok, status: result.status, json: async () => result.data };
}

/** Shared adapter for the existing client API service; UI code must use module services. */
export const backendApiService = {
  async request<T = Record<string, unknown>>(path: string, options: RequestOptions = {}, cacheKey?: string): Promise<BackendResponse<T>> {
    const { cacheTtl, ...init } = options;
    const method = (init.method ?? "GET").toUpperCase() as Method;
    const target = path.startsWith("/api/") ? path : `/api/${path.replace(/^\/+/, "")}`;
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;

    try {
      if (method === "GET" && cacheKey) {
        const result = await apiCache.get(cacheKey, () => apiService.request<T>(target, method), { ttl: cacheTtl ?? 30_000 });
        if (!result.ok) apiCache.invalidate(cacheKey);
        return toResponse(result);
      }

      const result = await apiService.request<T>(target, method, body);
      if (method !== "GET" && cacheKey) apiCache.invalidatePrefix(`${cacheKey.split(":")[0]}:`);
      return toResponse(result);
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: T } })?.response;
      const data = response?.data ?? ({ message: error instanceof Error ? error.message : "The request failed." } as T);
      return toResponse({ data, status: response?.status ?? 0, ok: false });
    }
  },
};
