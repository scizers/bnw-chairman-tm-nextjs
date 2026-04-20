import { clientApi } from "@/lib/api/client";
import type { DailySalesReport } from "@/types/salesReport";

export interface SalesReportListQuery {
  reportDateFrom?: string;
  reportDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: "reportDate" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface SalesReportListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type SalesReportPrefill = {
  salesHeads?: DailySalesReport["salesHeads"];
};

export type SalesReportExportFormat = "excel" | "csv";

const extractFilename = (disposition?: string) => {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const basicMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
  return basicMatch?.[1] ?? null;
};

export const salesReportsApi = {
  list: async (params?: SalesReportListQuery) => {
    const { data } = await clientApi.get<{
      data: DailySalesReport[];
      meta: SalesReportListMeta;
    }>("/sales-reports", { params });
    return data;
  },
  prefill: async () => {
    const { data } = await clientApi.get<SalesReportPrefill>("/sales-reports/prefill");
    return data;
  },
  getById: async (reportId: string) => {
    const { data } = await clientApi.get<DailySalesReport>(`/sales-reports/${reportId}`);
    return data;
  },
  downloadExport: async (reportId: string, format: SalesReportExportFormat = "excel") => {
    const response = await clientApi.get<Blob>(`/sales-reports/${reportId}/export`, {
      params: { format },
      responseType: "blob"
    });
    const disposition = response.headers?.["content-disposition"];
    return {
      blob: response.data,
      filename:
        extractFilename(disposition) ??
        `sales-update.${format === "csv" ? "csv" : "xls"}`
    };
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
