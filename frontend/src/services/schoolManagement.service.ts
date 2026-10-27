import { backendApiService, type BackendResponse } from "@/services/backendApi.service";
import { apiService } from "./api.service";
export interface schoolClassApi{
  id:number | string,
  name:{
    en:string,
    am:string,
    om:string,
  },
  code:string,
  number_of_sections:number,
  passing_score:number,
  next_class_id:number | null | string,
  is_active:boolean,
  created_at:any,
  updated_at:any,


}
export type SchoolResource = "academic-years" | "school-classes" | "courses" | "teaching-assignments" | "assessments" | "assessment-results";

export const schoolManagementService = {
  request<T = Record<string, unknown>>(path: string, options: RequestInit | string = {}, body?: unknown, userId?: number): Promise<BackendResponse<T>> {
    const init: RequestInit = typeof options === "string" ? { method: options, ...(body === undefined ? {} : { body: JSON.stringify(body) }) } : options;
    const method = (init.method ?? "GET").toUpperCase();
    const cleanPath = path.replace(/^https?:\/\/[^/]+/i, "").replace(/^(\/?(api\/backend|api|backend)(\/|[?]|$))+/i, "$3").replace(/^\/+/, "");
    const cacheKey = userId === undefined ? undefined : `${userId}:school-management:${cleanPath}`;
    return backendApiService.request<T>(cleanPath, init, method === "GET" ? cacheKey : userId === undefined ? undefined : `${userId}:school-management:mutation`);
  },
  list<T = Record<string, unknown>>(resource: SchoolResource, query = "", userId?: number) { return this.request<T>(`${resource}${query}`, "GET", undefined, userId); },
  detail<T = Record<string, unknown>>(resource: SchoolResource, id: number | string, userId?: number) { return this.request<T>(`${resource}/${id}`, "GET", undefined, userId); },
  create<T = Record<string, unknown>>(resource: SchoolResource, data: unknown, userId?: number) { return this.request<T>(resource, "POST", data, userId); },
  update<T = Record<string, unknown>>(resource: Exclude<SchoolResource, "teaching-assignments">, id: number | string, data: unknown, userId?: number) { return this.request<T>(`${resource}/${id}`, "PUT", data, userId); },
  delete<T = Record<string, unknown>>(resource: SchoolResource, id: number | string, userId?: number) { return this.request<T>(`${resource}/${id}`, "DELETE", undefined, userId); },
  endTeachingAssignment<T = Record<string, unknown>>(id: number | string, endDate: string, userId?: number) {
    return this.request<T>(`teaching-assignments/${id}/end`, "POST", { end_date: endDate }, userId);
  },
};




