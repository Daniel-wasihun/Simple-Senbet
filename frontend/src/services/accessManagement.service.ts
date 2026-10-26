import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export type AccessResource = "users" | "roles" | "permissions";

export const accessManagementService = {
  request<T = Record<string, unknown>>(path: string, options: RequestInit | string = {}, body?: unknown, userId?: number): Promise<BackendResponse<T>> {
    const init: RequestInit = typeof options === "string" ? { method: options, ...(body === undefined ? {} : { body: JSON.stringify(body) }) } : options;
    const method = (init.method ?? "GET").toUpperCase();
    const cleanPath = path.replace(/^https?:\/\/[^/]+/i, "").replace(/^(\/?(api\/backend|api|backend)(\/|[?]|$))+/i, "$3").replace(/^\/+/, "");
    const cacheKey = userId === undefined ? undefined : `${userId}:access-management:${cleanPath}`;
    return backendApiService.request<T>(cleanPath, init, method === "GET" ? cacheKey : userId === undefined ? undefined : `${userId}:access-management:mutation`);
  },
  list<T = Record<string, unknown>>(resource: AccessResource, query = "", userId?: number) { return this.request<T>(`${resource}${query}`, "GET", undefined, userId); },
  detail<T = Record<string, unknown>>(resource: "users" | "roles", id: number | string, userId?: number) { return this.request<T>(`${resource}/${id}`, "GET", undefined, userId); },
  create<T = Record<string, unknown>>(resource: AccessResource, data: unknown, userId?: number) { return this.request<T>(resource, "POST", data, userId); },
  update<T = Record<string, unknown>>(resource: AccessResource, id: number | string, data: unknown, userId?: number) { return this.request<T>(`${resource}/${id}`, "PUT", data, userId); },
  delete<T = Record<string, unknown>>(resource: AccessResource, id: number | string, userId?: number) { return this.request<T>(`${resource}/${id}`, "DELETE", undefined, userId); },
  assignUserRoles<T = Record<string, unknown>>(userId: number | string, roleIds: number[], actorId?: number) {
    return this.request<T>(`users/${userId}/roles`, "PUT", { role_ids: roleIds }, actorId);
  },
  rolePermissions<T = Record<string, unknown>>(roleId: number | string, actorId?: number) {
    return this.request<T>(`roles/${roleId}/permissions`, "GET", undefined, actorId);
  },
  syncRolePermissions<T = Record<string, unknown>>(roleId: number | string, permissionIds: number[], actorId?: number) {
    return this.request<T>(`roles/${roleId}/permissions`, "PUT", { permission_ids: permissionIds }, actorId);
  },
};
