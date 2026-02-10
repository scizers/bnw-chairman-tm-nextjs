import { clientApi } from "@/lib/api/client";
import type { Department, DepartmentSummary } from "@/types/department";

export interface DepartmentListQuery {
  q?: string;
  sortBy?: "department" | "memberCount" | "taskCount" | "openTasks" | "overdueTasks";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface DepartmentListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
}

export const departmentsApi = {
  listAll: async () => {
    const { data } = await clientApi.get<Department[]>("/departments/all");
    return data;
  },
  list: async () => {
    const { data } = await clientApi.get<DepartmentSummary[]>("/departments");
    return data;
  },
  listPaged: async (query: DepartmentListQuery) => {
    const { data } = await clientApi.get<{ data: DepartmentSummary[]; meta: DepartmentListMeta }>(
      "/departments",
      { params: query }
    );
    return data;
  },
  create: async (payload: CreateDepartmentPayload) => {
    const { data } = await clientApi.post<Department>("/departments", payload);
    return data;
  }
};
