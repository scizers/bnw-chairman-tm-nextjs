import { createServerApi } from "@/lib/api/serverClient";
import type { User } from "@/types/user";

export const serverUsersApi = {
  list: async () => {
    const api = await createServerApi();
    const { data } = await api.get<User[]>("/users");
    return data;
  }
};
