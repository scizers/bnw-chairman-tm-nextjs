import { clientApi } from "@/lib/api/client";
import type { LoginPayload, LoginResponse } from "@/types/auth";

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await clientApi.post<LoginResponse>("/auth/login", payload);
    return data;
  }
};
