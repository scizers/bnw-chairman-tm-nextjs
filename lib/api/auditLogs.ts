import { clientApi } from "@/lib/api/client";
import type { AuditLog } from "@/types/audit";

export const auditLogsApi = {
  listByTask: async (taskId: string) => {
    const { data } = await clientApi.get<AuditLog[]>(
      `/audit-logs?entityType=task&entityId=${taskId}`
    );
    return data;
  }
};
