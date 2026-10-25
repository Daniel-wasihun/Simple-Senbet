import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export type SchoolResource = "academic-years" | "school-classes" | "courses" | "teaching-assignments" | "enrollments" | "assessments" | "assessment-results";

export const schoolManagementService = {
  request<T = Record<string, unknown>>(path: string, options: RequestInit | string = {}, body?: unknown, userId?: number): Promise<BackendResponse<T>> {
    const init: RequestInit = typeof options === "string" ? { method: options, ...(body === undefined ? {} : { body: JSON.stringify(body) }) } : options;
    const method = (init.method ?? "GET").toUpperCase();
    const cacheKey = userId === undefined ? undefined : `${userId}:school-management:${path}`;
    return backendApiService.request<T>(`/api/backend/${path}`, init, method === "GET" ? cacheKey : userId === undefined ? undefined : `${userId}:school-management:mutation`);
  },
  list<T = Record<string, unknown>>(resource: SchoolResource, query = "", userId?: number) { return this.request<T>(`${resource}${query}`, "GET", undefined, userId); },
  detail<T = Record<string, unknown>>(resource: SchoolResource, id: number | string, userId?: number) { return this.request<T>(`${resource}/${id}`, "GET", undefined, userId); },
  create<T = Record<string, unknown>>(resource: SchoolResource, data: unknown, userId?: number) { return this.request<T>(resource, "POST", data, userId); },
  update<T = Record<string, unknown>>(resource: Exclude<SchoolResource, "teaching-assignments" | "enrollments">, id: number | string, data: unknown, userId?: number) { return this.request<T>(`${resource}/${id}`, "PUT", data, userId); },
  delete<T = Record<string, unknown>>(resource: Exclude<SchoolResource, "enrollments">, id: number | string, userId?: number) { return this.request<T>(`${resource}/${id}`, "DELETE", undefined, userId); },
  endTeachingAssignment<T = Record<string, unknown>>(id: number | string, endDate: string, userId?: number) {
    return this.request<T>(`teaching-assignments/${id}/end`, "POST", { end_date: endDate }, userId);
  },
  transferStudent<T = Record<string, unknown>>(memberId: number | string, payload: Record<string, unknown>, userId?: number) {
    return this.request<T>(`enrollments/members/${memberId}/transfer`, "POST", payload, userId);
  },
  withdrawStudent<T = Record<string, unknown>>(memberId: number | string, payload: Record<string, unknown>, userId?: number) {
    return this.request<T>(`enrollments/members/${memberId}/withdraw`, "POST", payload, userId);
  },
};
