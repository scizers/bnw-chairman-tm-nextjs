import { clientApi } from "@/lib/api/client";
import type { TeamMember } from "@/types/team";

export interface TeamMemberListQuery {
  name?: string;
  designation?: string;
  sortBy?: "name" | "designation" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface TeamMemberListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export const teamMembersApi = {
  list: async () => {
    const { data } = await clientApi.get<TeamMember[]>("/team-members");
    return data;
  },
  listPaged: async (query: TeamMemberListQuery) => {
    const { data } = await clientApi.get<{ data: TeamMember[]; meta: TeamMemberListMeta }>(
      "/team-members",
      {
        params: query
      }
    );
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
