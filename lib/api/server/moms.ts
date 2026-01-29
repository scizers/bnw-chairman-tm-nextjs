import { createServerApi } from "@/lib/api/serverClient";
import type { Mom } from "@/types/mom";

export const serverMomsApi = {
  list: async () => {
    const api = await createServerApi();
    const { data } = await api.get<Mom[]>("/moms");
    return data;
  },
  getById: async (momId: string) => {
    const api = await createServerApi();
    const { data } = await api.get<Mom>(`/moms/${momId}`);
    return data;
  }
};
