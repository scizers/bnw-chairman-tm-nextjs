import { createServerApi } from "@/lib/api/serverClient";
import type { TeamMember } from "@/types/team";

export const serverTeamMembersApi = {
  list: async () => {
    const api = await createServerApi();
    const { data } = await api.get<TeamMember[]>("/team-members");
    return data;
  }
};
