import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export interface MemberRecord { id: number; full_name?: string; member_code?: string; [key: string]: unknown }

export const membersService = {
  request<T = Record<string, unknown>>(path: string, options: RequestInit | string = {}, body?: unknown, userId?: number): Promise<BackendResponse<T>> {
    const init: RequestInit = typeof options === "string" ? { method: options, ...(body === undefined ? {} : { body: JSON.stringify(body) }) } : options;
    const method = (init.method ?? "GET").toUpperCase();
    const cleanPath = path.replace(/^https?:\/\/[^/]+/i, "").replace(/^(\/?(api\/backend|api|backend)(\/|[?]|$))+/i, "$3").replace(/^\/+/, "");
    const cacheKey = method === "GET" && userId !== undefined ? `${userId}:members:${cleanPath}` : undefined;
    return backendApiService.request<T>(cleanPath, init, cacheKey ?? (userId === undefined ? undefined : `${userId}:members:mutation`));
  },
  list<T = Record<string, unknown>>(query = "", userId?: number) { return this.request<T>(`members${query}`, "GET", undefined, userId); },
  detail<T = Record<string, unknown>>(id: number | string, userId?: number) { return this.request<T>(`members/${id}`, "GET", undefined, userId); },
  create<T = Record<string, unknown>>(data: Partial<MemberRecord>, userId?: number) { return this.request<T>("members", "POST", data, userId); },
  update<T = Record<string, unknown>>(id: number | string, data: Partial<MemberRecord>, userId?: number) { return this.request<T>(`members/${id}`, "PUT", data, userId); },
  delete<T = Record<string, unknown>>(id: number | string, userId?: number) { return this.request<T>(`members/${id}`, "DELETE", undefined, userId); },
};
