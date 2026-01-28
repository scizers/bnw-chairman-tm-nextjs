"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import TasksTableClient from "@/components/tasks/TasksTableClient";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi } from "@/lib/api";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import type { TaskListMeta, TaskListQuery } from "@/lib/api/tasks";
import { attachAssigneeNames, normalizeTasks } from "@/lib/utils/task";

interface TeamMemberTasksListClientProps {
  teamMemberId: string;
  teamMembers: TeamMember[];
  onViewTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function TeamMemberTasksListClient({
  teamMemberId,
  teamMembers,
  onViewTask,
  onEditTask
}: TeamMemberTasksListClientProps) {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<TaskListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params: TaskListQuery = {};
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const q = searchParams.get("q");
    const dueFrom = searchParams.get("dueFrom");
    const dueTo = searchParams.get("dueTo");
    const sortBy = searchParams.get("sortBy") ?? "updatedAt";
    const sortDir = searchParams.get("sortDir") ?? "desc";
    const page = Number(searchParams.get("page") ?? "1");
    const rawPageSize = Number(searchParams.get("pageSize") ?? "10");
    const pageSize = PAGE_SIZE_OPTIONS.includes(rawPageSize) ? rawPageSize : 10;

    params.assignedTo = teamMemberId;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (q) params.q = q;
    if (dueFrom) params.dueFrom = dueFrom;
    if (dueTo) params.dueTo = dueTo;
    params.sortBy = sortBy;
    params.sortDir = sortDir;
    params.page = Number.isFinite(page) && page > 0 ? page : 1;
    params.pageSize = pageSize;

    return params;
  }, [searchParams, teamMemberId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.listPaged(query);
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
  }, [query, teamMembers]);

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
      hideMemberFilter
      fixedMemberIds={[teamMemberId]}
      onViewTask={onViewTask}
      onEditTask={onEditTask}
    />
  );
}
