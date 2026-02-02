import { clientApi } from "@/lib/api/client";
import type { DepartmentSummary } from "@/types/department";

export const departmentsApi = {
  list: async () => {
    const { data } = await clientApi.get<DepartmentSummary[]>("/departments");
    return data;
  }
};
