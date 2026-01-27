import { clientApi } from "@/lib/api/client";
import type { User } from "@/types/user";

export const usersApi = {
  list: async () => {
    const { data } = await clientApi.get<User[]>("/users");
    return data;
  },
  create: async (payload: Partial<User>) => {
    const { data } = await clientApi.post<User>("/users", payload);
    return data;
  },
  update: async (userId: string, payload: Partial<User>) => {
    const { data } = await clientApi.patch<User>(`/users/${userId}`, payload);
    return data;
  },
  softDelete: async (userId: string) => {
    const { data } = await clientApi.delete(`/users/${userId}`);
    return data;
  }
};
