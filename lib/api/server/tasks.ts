import { createServerApi } from "@/lib/api/serverClient";
import type { Remark } from "@/types/remark";
import type { Task } from "@/types/task";

export const serverTasksApi = {
  list: async () => {
    const api = await createServerApi();
    const { data } = await api.get<Task[]>("/tasks");
    return data;
  },
  listByTeamMember: async (teamMemberId: string) => {
    const api = await createServerApi();
    const { data } = await api.get<Task[]>(`/tasks/by-team-member/${teamMemberId}`);
    return data;
  },
  getRemarks: async (taskId: string) => {
    const api = await createServerApi();
    const { data } = await api.get<Remark[]>(`/tasks/${taskId}/remarks`);
    return data;
  }
};
