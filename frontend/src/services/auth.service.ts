import { apiService } from "@/services/api.service";

export const authService = {
  session: () => apiService.localRequest("/api/auth/session"),
  login: (email: string, password: string) => apiService.localRequest("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }),
  logout: () => apiService.localRequest("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" } }),
  register: (data: Record<string, unknown>) => apiService.localRequest("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  forgotPassword: (email: string) => apiService.localRequest("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }),
  resetPassword: (data: Record<string, unknown>) => apiService.localRequest("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
};
