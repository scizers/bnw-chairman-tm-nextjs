import { clientApi } from "@/lib/api/client";
import type { TeamMember } from "@/types/team";

export const teamMembersApi = {
  list: async () => {
    const { data } = await clientApi.get<TeamMember[]>("/team-members");
    return data;
  },
  getById: async (teamMemberId: string) => {
    const { data } = await clientApi.get<TeamMember>(`/team-members/${teamMemberId}`);
    return data;
  },
  create: async (payload: Partial<TeamMember>) => {
    const { data } = await clientApi.post<TeamMember>("/team-members", payload);
    return data;
  },
  update: async (teamMemberId: string, payload: Partial<TeamMember>) => {
    const { data } = await clientApi.patch<TeamMember>(
      `/team-members/${teamMemberId}`,
      payload
    );
    return data;
  },
  softDelete: async (teamMemberId: string) => {
    const { data } = await clientApi.delete(`/team-members/${teamMemberId}`);
    return data;
  }
};
