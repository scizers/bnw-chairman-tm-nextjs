"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TasksTableClient from "@/components/tasks/TasksTableClient";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi, teamMembersApi } from "@/lib/api";
import { attachAssigneeNames, normalizeTasks } from "@/lib/utils/task";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import type { TaskListMeta, TaskListQuery } from "@/lib/api/tasks";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function TasksPageClient() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pagination, setPagination] = useState<TaskListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const teamMembersRef = useRef<TeamMember[]>([]);

  useEffect(() => {
    teamMembersRef.current = teamMembers;
  }, [teamMembers]);

  const query = useMemo(() => {
    const params: TaskListQuery = {};
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const member = searchParams.get("member");
    const q = searchParams.get("q");
    const dueFrom = searchParams.get("dueFrom");
    const dueTo = searchParams.get("dueTo");
    const sortBy = searchParams.get("sortBy") ?? "updatedAt";
    const sortDir = searchParams.get("sortDir") ?? "desc";
    const page = Number(searchParams.get("page") ?? "1");
    const rawPageSize = Number(searchParams.get("pageSize") ?? "10");
    const pageSize = PAGE_SIZE_OPTIONS.includes(rawPageSize) ? rawPageSize : 10;

    if (status && status !== "all") params.status = status;
    if (priority && priority !== "all") params.priority = priority;
    if (member && member !== "all") params.assignedTo = member;
    if (q) params.q = q;
    if (dueFrom) params.dueFrom = dueFrom;
    if (dueTo) params.dueTo = dueTo;
    if (sortBy) params.sortBy = sortBy;
    if (sortDir) params.sortDir = sortDir;
    params.page = Number.isFinite(page) && page > 0 ? page : 1;
    params.pageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;

    return params;
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!hasLoaded) {
      setLoading(true);
    }
    setError(null);
    try {
      const tasksPromise = tasksApi.listPaged(query);
      const teamPromise = teamLoaded ? Promise.resolve(teamMembersRef.current) : teamMembersApi.list();
      const [tasksResponse, teamData] = await Promise.all([tasksPromise, teamPromise]);
      const normalizedTeam = teamData ?? [];
      const normalizedTasks = attachAssigneeNames(
        normalizeTasks(tasksResponse?.data ?? []),
        normalizedTeam
      );
      setTasks(normalizedTasks);
      if (!teamLoaded) {
        setTeamMembers(normalizedTeam);
        setTeamLoaded(true);
      }
      setPagination(tasksResponse?.meta ?? null);
      setHasLoaded(true);
    } catch (err) {
      setError("Unable to load tasks from the API.");
    } finally {
      setLoading(false);
    }
  }, [hasLoaded, query, teamLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Task feed unavailable"
        description={error}
        onRetry={load}
      />
    );
  }

  const statusFilter = searchParams.get("status");
  const priorityFilter = searchParams.get("priority");
  const memberFilter = searchParams.get("member");
  const hasActiveFilters =
    (statusFilter && statusFilter !== "all") ||
    (priorityFilter && priorityFilter !== "all") ||
    (memberFilter && memberFilter !== "all") ||
    searchParams.get("q") ||
    searchParams.get("dueFrom") ||
    searchParams.get("dueTo");

  const totalTasks = pagination?.total ?? tasks.length;
  if (!totalTasks && !hasActiveFilters) {
    return (
      <EmptyState title="No tasks yet" description="Create tasks to begin tracking progress." />
    );
  }

  return (
    <TasksTableClient tasks={tasks} teamMembers={teamMembers} pagination={pagination ?? undefined} />
  );
}
