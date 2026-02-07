import { clientApi } from "@/lib/api/client";
import type { AuditLog } from "@/types/audit";

export interface AuditLogQuery {
  entityType?: string;
  entityId?: string;
  performedBy?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  meta: AuditLogListMeta;
}

export const auditLogsApi = {
  list: async (params?: AuditLogQuery) => {
    const { data } = await clientApi.get<AuditLogListResponse>("/audit-logs", { params });
    return data;
  },
  listByTask: async (taskId: string) => {
    const response = await auditLogsApi.list({
      entityType: "task",
      entityId: taskId,
      page: 1,
      pageSize: 100
    });
    return response.data;
  }
};
