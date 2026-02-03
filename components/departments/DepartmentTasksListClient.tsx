"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TasksTableClient from "@/components/tasks/TasksTableClient";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi } from "@/lib/api";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import type { TaskListMeta, TaskListQuery } from "@/lib/api/tasks";
import { attachAssigneeNames, normalizeTasks } from "@/lib/utils/task";

interface DepartmentTasksListClientProps {
  department: string;
  teamMembers: TeamMember[];
  statusFilter?: string[];
  onViewTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function DepartmentTasksListClient({
  department,
  teamMembers,
  statusFilter,
  onViewTask,
  onEditTask
}: DepartmentTasksListClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<TaskListMeta | null>(null);
  const [query, setQuery] = useState<TaskListQuery>({
    sortBy: "updatedAt",
    sortDir: "desc",
    page: 1,
    pageSize: 10
  });
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
    params.department = department;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (q) params.q = q;
    if (dueFrom) params.dueFrom = dueFrom;
    if (dueTo) params.dueTo = dueTo;
    params.sortBy = sortBy;
    params.sortDir = sortDir;
    params.page = query.page ?? 1;
    params.pageSize = query.pageSize ?? 10;

    return params;
  }, [department, query]);

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
      setError("Unable to load tasks for this department.");
    } finally {
      setLoading(false);
    }
  }, [apiQuery, teamMembers]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <ErrorState title="Tasks unavailable" description={error} onRetry={load} />;
  }

  return (
    <TasksTableClient
      tasks={tasks}
      teamMembers={teamMembers}
      pagination={pagination ?? undefined}
      loading={loading}
      hideDepartmentFilter
      fixedDepartment={department}
      forcedStatusFilter={statusFilter}
      useUrlState={false}
      page={query.page}
      pageSize={query.pageSize}
      onQueryChange={(nextQuery) => setQuery(nextQuery)}
      onViewTask={onViewTask}
      onEditTask={onEditTask}
    />
  );
}
