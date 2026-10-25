import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export const promotionService = {
  request<T = Record<string, unknown>>(path: string, options: RequestInit | string = {}, body?: unknown, userId?: number): Promise<BackendResponse<T>> {
    const init: RequestInit = typeof options === "string" ? { method: options, ...(body === undefined ? {} : { body: JSON.stringify(body) }) } : options;
    const method = (init.method ?? "GET").toUpperCase();
    const cacheKey = method === "GET" && userId !== undefined ? `${userId}:promotion:${path}` : undefined;
    return backendApiService.request<T>(`/api/backend/${path}`, init, cacheKey ?? (userId === undefined ? undefined : `${userId}:promotion:mutation`));
  },
  evaluateStudent<T = Record<string, unknown>>(studentId: number | string, userId?: number) { return this.request<T>(`promotion/student/${studentId}`, "GET", undefined, userId); },
  dryRun<T = Record<string, unknown>>(payload: unknown, userId?: number) { return this.request<T>("promotion/dry-run", "POST", payload, userId); },
  commit<T = Record<string, unknown>>(payload: unknown, userId?: number) { return this.request<T>("promotion/commit", "POST", payload, userId); },
};
