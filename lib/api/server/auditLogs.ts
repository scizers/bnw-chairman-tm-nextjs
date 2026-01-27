import { createServerApi } from "@/lib/api/serverClient";
import type { AuditLog } from "@/types/audit";

export const serverAuditLogsApi = {
  listByTask: async (taskId: string) => {
    const api = await createServerApi();
    const { data } = await api.get<AuditLog[]>(
      `/audit-logs?entityType=task&entityId=${taskId}`
    );
    return data;
  }
};
