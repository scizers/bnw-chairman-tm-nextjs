import { clientApi } from "@/lib/api/client";
import type { AuditLog } from "@/types/audit";

export interface AuditLogQuery {
  entityType?: string;
  entityId?: string;
}

export const auditLogsApi = {
  list: async (params?: AuditLogQuery) => {
    const { data } = await clientApi.get<AuditLog[]>("/audit-logs", { params });
    return data;
  },
  listByTask: async (taskId: string) => {
    return auditLogsApi.list({ entityType: "task", entityId: taskId });
  }
};
