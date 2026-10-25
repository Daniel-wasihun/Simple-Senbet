import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export interface AttendanceSessionRecord { id: number; status: "draft" | "submitted" | "closed"; date: string; [key: string]: unknown }
export interface AttendanceFilters { page?: number; per_page?: number; date?: string; class_id?: number | string; status?: string }

export const attendanceService = {
  request<T = Record<string, unknown>>(path: string, options: RequestInit = {}): Promise<BackendResponse<T>> {
    const method = (options.method ?? "GET").toUpperCase();
    return backendApiService.request<T>(path, options, method === "GET" ? undefined : "attendance:mutation");
  },
  list(filters: AttendanceFilters = {}) {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]));
    return backendApiService.request<{ data: AttendanceSessionRecord[]; pagination?: unknown }>(`attendance/sessions?${query}`);
  },
  session(id: number | string) { return backendApiService.request<AttendanceSessionRecord>(`attendance/sessions/${id}`); },
  roster<T = Record<string, unknown>>(id: number | string, section?: string) {
    const query = section ? `?section=${encodeURIComponent(section)}` : "";
    return backendApiService.request<T>(`attendance/sessions/${id}/roster${query}`);
  },
  create(payload: Record<string, unknown>) { return backendApiService.request("attendance/sessions", { method: "POST", body: JSON.stringify(payload) }, "attendance:session"); },
  submit<T = Record<string, unknown>>(id: number | string, payload: unknown) { return backendApiService.request<T>(`attendance/sessions/${id}/submit`, { method: "POST", body: JSON.stringify(payload) }, "attendance:session"); },
  correct<T = Record<string, unknown>>(id: number | string, payload: unknown) { return backendApiService.request<T>(`attendance/sessions/${id}/marks`, { method: "PATCH", body: JSON.stringify(payload) }, "attendance:session"); },
  close(id: number | string) { return backendApiService.request(`attendance/sessions/${id}/close`, { method: "POST" }, "attendance:session"); },
  remove(id: number | string) { return backendApiService.request(`attendance/sessions/${id}`, { method: "DELETE" }, "attendance:session"); },
};
