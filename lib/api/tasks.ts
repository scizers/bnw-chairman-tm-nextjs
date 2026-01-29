import { clientApi } from "@/lib/api/client";
import type { Remark } from "@/types/remark";
import type { Task } from "@/types/task";

export interface TaskListQuery {
  status?: string;
  priority?: string;
  assignedTo?: string;
  q?: string;
  dueFrom?: string;
  dueTo?: string;
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
  addAttachments: async (taskId: string, urls: string[]) => {
    const { data } = await clientApi.post(`/tasks/${taskId}/attachments`, { urls });
    return data;
  },
  addRemark: async (taskId: string, text: string) => {
    const { data } = await clientApi.post(`/tasks/${taskId}/remarks`, { text });
    return data;
  },
  addAudioRemark: async (taskId: string, payload: { audioUrl: string; audioDurationSec: number; audioMimeType: string }) => {
    const { data } = await clientApi.post(`/tasks/${taskId}/remarks/audio`, payload);
    return data;
  },
  getRemarks: async (taskId: string) => {
    const { data } = await clientApi.get<Remark[]>(`/tasks/${taskId}/remarks`);
    return data;
  }
};
