import { clientApi } from "@/lib/api/client";
import type { LoginPayload, LoginResponse } from "@/types/auth";

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await clientApi.post<LoginResponse>("/auth/login", payload);
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
