import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export const paymentsService = {
  request<T = Record<string, unknown>>(path: string, options: RequestInit | string = {}, body?: unknown, userId?: number): Promise<BackendResponse<T>> {
    const init: RequestInit = typeof options === "string" ? { method: options, ...(body === undefined ? {} : { body: JSON.stringify(body) }) } : options;
    const method = (init.method ?? "GET").toUpperCase();
    const cleanPath = path.replace(/^https?:\/\/[^/]+/i, "").replace(/^(\/?(api\/backend|api|backend)(\/|[?]|$))+/i, "$3").replace(/^\/+/, "");
    const cacheKey = method === "GET" && userId !== undefined ? `${userId}:payments:${cleanPath}` : undefined;
    return backendApiService.request<T>(cleanPath, init, cacheKey ?? (userId === undefined ? undefined : `${userId}:payments:mutation`));
  },
  dashboard<T = Record<string, unknown>>(query = "", userId?: number) { return this.request<T>(`payments/dashboard${query}`, "GET", undefined, userId); },
  ledger<T = Record<string, unknown>>(query = "", userId?: number) { return this.request<T>(`payments/members${query}`, "GET", undefined, userId); },
  memberHistory<T = Record<string, unknown>>(id: number | string, query = "", userId?: number) { return this.request<T>(`payments/members/${id}${query}`, "GET", undefined, userId); },
  record<T = Record<string, unknown>>(payload: unknown, userId?: number) { return this.request<T>("payments", "POST", payload, userId); },
  void<T = Record<string, unknown>>(id: number | string, payload: unknown, userId?: number) { return this.request<T>(`payments/${id}/void`, "POST", payload, userId); },
  receipt<T = Record<string, unknown>>(id: number | string, userId?: number) { return this.request<T>(`payments/${id}/receipt`, "GET", undefined, userId); },
  rules<T = Record<string, unknown>>(userId?: number) { return this.request<T>("payments/rules", "GET", undefined, userId); },
  saveRules<T = Record<string, unknown>>(payload: unknown, userId?: number) { return this.request<T>("payments/rules", "POST", payload, userId); },
};
