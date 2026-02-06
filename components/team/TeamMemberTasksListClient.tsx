"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TasksTableClient from "@/components/tasks/TasksTableClient";
import ErrorState from "@/components/common/ErrorState";
import { departmentsApi, tasksApi } from "@/lib/api";
import type { Department } from "@/types/department";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import type { TaskListMeta, TaskListQuery } from "@/lib/api/tasks";
import { attachAssigneeNames, normalizeTasks } from "@/lib/utils/task";

interface TeamMemberTasksListClientProps {
  teamMemberId: string;
  teamMembers: TeamMember[];
  statusFilter?: string[];
  onViewTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function TeamMemberTasksListClient({
  teamMemberId,
  teamMembers,
  statusFilter,
  onViewTask,
  onEditTask
}: TeamMemberTasksListClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<TaskListMeta | null>(null);
  const [query, setQuery] = useState<TaskListQuery>({
    sortBy: "updatedAt",
    sortDir: "desc",
    page: 1,
    pageSize: 10
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      status: statusFilter?.length ? statusFilter.join(",") : undefined,
      page: 1
    }));
  }, [statusFilter]);

  const apiQuery = useMemo(() => {
    const params: TaskListQuery = {};
    const status = query.status ?? null;
    const priority = query.priority ?? null;
    const q = query.q ?? null;
    const dueFrom = query.dueFrom ?? null;
    const dueTo = query.dueTo ?? null;
    const sortBy = query.sortBy ?? "updatedAt";
    const sortDir = query.sortDir ?? "desc";
    const departmentIds = query.department
      ? query.department.split(",").map((entry) => entry.trim()).filter(Boolean)
      : [];
    const departmentNames = departmentIds
      .map((id) => departments.find((dept) => String(dept.id ?? dept._id) === id)?.name)
      .filter(Boolean) as string[];
    params.assignedTo = teamMemberId;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (q) params.q = q;
    if (dueFrom) params.dueFrom = dueFrom;
    if (dueTo) params.dueTo = dueTo;
    if (departmentNames.length) params.department = departmentNames.join(",");
    params.sortBy = sortBy;
    params.sortDir = sortDir;
    params.page = query.page ?? 1;
    params.pageSize = query.pageSize ?? 10;

    return params;
  }, [teamMemberId, query, departments]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.listPaged(apiQuery);
      const normalizedTasks = attachAssigneeNames(
        normalizeTasks(response?.data ?? []),
        teamMembers
      );
      setTasks(normalizedTasks);
      setPagination(response?.meta ?? null);
    } catch (err) {
      setError("Unable to load tasks for this team member.");
    } finally {
      setLoading(false);
    }
  }, [apiQuery, teamMembers]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        let data = await departmentsApi.listAll();
        if (!data?.length) {
          const summary = await departmentsApi.list();
          data =
            summary?.map((dept) => ({
              _id: dept.id ?? dept._id,
              name: dept.department
            })) ?? [];
        }
        if (!active) return;
        setDepartments(data ?? []);
      } catch {
        if (active) setDepartments([]);
      } finally {
        if (active) setLoadingDepartments(false);
      }
    };
    void loadDepartments();
    return () => {
      active = false;
    };
  }, []);

  const departmentOptions = useMemo(
    () =>
      departments
        .map((dept) => ({
          value: String(dept.id ?? dept._id ?? ""),
          label: dept.name
        }))
        .filter((option) => option.value),
    [departments]
  );

  if (error) {
    return <ErrorState title="Tasks unavailable" description={error} onRetry={load} />;
  }

  return (
    <TasksTableClient
      tasks={tasks}
      teamMembers={teamMembers}
      pagination={pagination ?? undefined}
      loading={loading}
      hideMemberFilter
      departmentOptionsOverride={departmentOptions}
      hideDepartmentFilter={loadingDepartments}
      fixedMemberIds={[teamMemberId]}
      forcedStatusFilter={statusFilter}
      useUrlState={false}
      page={query.page}
      pageSize={query.pageSize}
      onQueryChange={(nextQuery) => setQuery(nextQuery)}
      onTaskStatusUpdated={(taskId, nextStatus) => {
        setTasks((prev) =>
          prev.map((task) =>
            (task.id ?? task._id) === taskId ? { ...task, status: nextStatus } : task
          )
        );
      }}
      onViewTask={onViewTask}
      onEditTask={onEditTask}
    />
  );
}
