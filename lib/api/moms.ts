import { clientApi } from "@/lib/api/client";
import type { Mom } from "@/types/mom";

export const momsApi = {
  list: async () => {
    const { data } = await clientApi.get<Mom[]>("/moms");
    return data;
  },
  getById: async (momId: string) => {
    const { data } = await clientApi.get<Mom>(`/moms/${momId}`);
    return data;
  },
  create: async (payload: Partial<Mom>) => {
    const { data } = await clientApi.post<Mom>("/moms", payload);
    return data;
  },
  update: async (momId: string, payload: Partial<Mom>) => {
    const { data } = await clientApi.patch<Mom>(`/moms/${momId}`, payload);
    return data;
  },
  remove: async (momId: string) => {
    const { data } = await clientApi.delete<{ success: boolean }>(`/moms/${momId}`);
    return data;
  }
};
