import { clientApi } from "@/lib/api/client";
import type { AuditLog } from "@/types/audit";
import type { AuditLogListMeta } from "@/lib/api/auditLogs";

export interface TimelineQuery {
  entityType?: string;
  performedBy?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface TimelineListResponse {
  data: AuditLog[];
  meta: AuditLogListMeta;
}

export const timelineApi = {
  list: async (params?: TimelineQuery) => {
    const { data } = await clientApi.get<TimelineListResponse>("/timeline", { params });
    return data;
  }
};
