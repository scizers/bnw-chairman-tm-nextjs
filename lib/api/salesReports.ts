import { clientApi } from "@/lib/api/client";
import type { DailySalesReport } from "@/types/salesReport";

export const salesReportsApi = {
  list: async () => {
    const { data } = await clientApi.get<DailySalesReport[]>("/sales-reports");
    return data;
  },
  getById: async (reportId: string) => {
    const { data } = await clientApi.get<DailySalesReport>(`/sales-reports/${reportId}`);
    return data;
  },
  create: async (payload: Partial<DailySalesReport>) => {
    const { data } = await clientApi.post<DailySalesReport>("/sales-reports", payload);
    return data;
  },
  update: async (reportId: string, payload: Partial<DailySalesReport>) => {
    const { data } = await clientApi.put<DailySalesReport>(`/sales-reports/${reportId}`, payload);
    return data;
  },
  remove: async (reportId: string) => {
    const { data } = await clientApi.delete<{ success: boolean }>(
      `/sales-reports/${reportId}`
    );
    return data;
  }
};
