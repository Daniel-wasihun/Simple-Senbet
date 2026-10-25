import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export const reportsService = {
  classGradebook<T = Record<string, unknown>>(classId: number | string, query = "", userId?: number): Promise<BackendResponse<T>> {
    const key = userId === undefined ? undefined : `${userId}:reports:class:${classId}:${query}`;
    return backendApiService.request<T>(`/api/backend/report-cards/class/${classId}${query}`, {}, key);
  },
  studentReport<T = Record<string, unknown>>(studentId: number | string, userId?: number): Promise<BackendResponse<T>> {
    const key = userId === undefined ? undefined : `${userId}:reports:student:${studentId}`;
    return backendApiService.request<T>(`/api/backend/report-cards/student/${studentId}`, {}, key);
  },
  exportClassCsv(classId: number | string) { return backendApiService.request(`/api/backend/report-cards/class/${classId}/export/csv`); },
  printableClassReport(classId: number | string) { return backendApiService.request(`/api/backend/report-cards/class/${classId}/export/print`); },
};
