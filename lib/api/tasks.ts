import { clientApi } from "@/lib/api/client";
import type { Remark } from "@/types/remark";
import type { Task } from "@/types/task";

export interface TaskListQuery {
  status?: string;
  priority?: string;
  assignedTo?: string;
  department?: string;
  q?: string;
  dueFrom?: string;
  dueTo?: string;
  archived?: string | boolean;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
  countOnly?: boolean;
}

export interface TaskListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortDir?: string;
}

export interface TaskListResponse {
  data: Task[];
  meta: TaskListMeta;
}

export interface DashboardStats {
  kpis: {
    totalOpen: number;
    overdueTasks: number;
    criticalTasks: number;
    completedThisWeek: number;
    staleTasks: number;
  };
  statusCounts: Array<{ status: string; count: number }>;
  priorityCounts: Array<{ priority: string; count: number }>;
  urgentTasks: Task[];
  pendingCounts: Array<
    {
      id?: string;
      _id?: string;
      name: string;
      designation?: string;
      department?: string;
      email?: string;
      pending: number;
    }
  >;
}

export const tasksApi = {
  list: async () => {
    const { data } = await clientApi.get<Task[]>("/tasks");
    return data;
  },
  listPaged: async (params: TaskListQuery) => {
    const { data } = await clientApi.get<TaskListResponse>("/tasks", { params });
    return data;
  },
  listByTeamMember: async (teamMemberId: string) => {
    const { data } = await clientApi.get<Task[]>(`/tasks/by-team-member/${teamMemberId}`);
    return data;
  },
  count: async (params: TaskListQuery) => {
    const { data } = await clientApi.get<number>("/tasks", {
      params: { ...params, countOnly: true }
    });
    return data;
  },
  getById: async (taskId: string) => {
    const { data } = await clientApi.get<Task>(`/tasks/${taskId}`);
    return data;
  },
  create: async (payload: Partial<Task>) => {
    const { data } = await clientApi.post<Task>("/tasks", payload);
    return data;
  },
  update: async (taskId: string, payload: Partial<Task>) => {
    const { data } = await clientApi.patch<Task>(`/tasks/${taskId}`, payload);
    return data;
  },
  archive: async (taskId: string) => {
    const { data } = await clientApi.post<Task>(`/tasks/${taskId}/archive`);
    return data;
  },
  addAttachments: async (taskId: string, attachments: Array<{ fileUrl: string }>) => {
    const { data } = await clientApi.post(`/tasks/${taskId}/attachments`, { attachments });
    return data;
  },
  addRemark: async (taskId: string, text: string) => {
    const { data } = await clientApi.post(`/tasks/${taskId}/remarks`, { text });
    return data;
  },
  updateRemark: async (taskId: string, remarkId: string, text: string) => {
    const { data } = await clientApi.patch(`/tasks/${taskId}/remarks/${remarkId}`, { text });
    return data;
  },
  deleteRemark: async (taskId: string, remarkId: string) => {
    const { data } = await clientApi.delete<{ success: boolean }>(
      `/tasks/${taskId}/remarks/${remarkId}`
    );
    return data;
  },
  addAudioRemark: async (taskId: string, payload: { audioUrl: string; audioDurationSec: number; audioMimeType: string }) => {
    const { data } = await clientApi.post(`/tasks/${taskId}/remarks/audio`, payload);
    return data;
  },
  getRemarks: async (taskId: string, params?: { authorId?: string; q?: string }) => {
    const { data } = await clientApi.get<Remark[]>(`/tasks/${taskId}/remarks`, {
      params
    });
    return data;
  },
  uploadAttachment: async (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await clientApi.post<{
      url: string;
      thumbnailUrl?: string | null;
      mimeType?: string;
      size?: number;
      filename?: string;
      originalName?: string;
      fileKind?: string;
    }>("/uploads/tasks", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress?.(percent);
      }
    });
    return data;
  },
  getDashboardStats: async () => {
    const { data } = await clientApi.get<DashboardStats>("/tasks/dashboard-stats");
    return data;
  }
};
