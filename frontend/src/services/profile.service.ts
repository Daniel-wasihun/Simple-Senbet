import { backendApiService, type BackendResponse } from "@/services/backendApi.service";

export interface ProfileUpdate { name: string; email: string }
export interface PasswordUpdate { current_password: string; password: string; password_confirmation: string }

export const profileService = {
  update(data: ProfileUpdate, userId?: number): Promise<BackendResponse> {
    return backendApiService.request("/api/backend/profile", { method: "PATCH", body: JSON.stringify(data) }, userId === undefined ? undefined : `${userId}:profile:mutation`);
  },
  changePassword(data: PasswordUpdate, userId?: number): Promise<BackendResponse> {
    return backendApiService.request("/api/backend/profile/password", { method: "PUT", body: JSON.stringify(data) }, userId === undefined ? undefined : `${userId}:profile:mutation`);
  },
};
