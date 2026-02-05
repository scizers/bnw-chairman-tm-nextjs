import { clientApi } from "@/lib/api/client";
import type { LoginPayload, LoginResponse } from "@/types/auth";

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await clientApi.post<LoginResponse>("/auth/login", payload);
    return data;
  },
  requestPasswordReset: async (email: string) => {
    const { data } = await clientApi.post<{ message: string }>(
      "/auth/forgot-password",
      { email }
    );
    return data;
  },
  validateResetToken: async (token: string) => {
    const { data } = await clientApi.get<{ valid: boolean }>(
      "/auth/reset-password/validate",
      { params: { token } }
    );
    return data;
  },
  resetPassword: async (token: string, password: string) => {
    const { data } = await clientApi.post<{ message: string }>(
      "/auth/reset-password",
      { token, password }
    );
    return data;
  },
  changePassword: async (password: string) => {
    const { data } = await clientApi.post<{ message: string }>(
      "/auth/change-password",
      { password }
    );
    return data;
  },
  refresh: async (refreshToken: string) => {
    const { data } = await clientApi.post<LoginResponse>("/auth/refresh", { refreshToken });
    return data;
  },
  logout: async (refreshToken?: string) => {
    if (!refreshToken) return;
    await clientApi.post("/auth/logout", { refreshToken });
  }
};
