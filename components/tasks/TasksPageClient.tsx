"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pagination, setPagination] = useState<TaskListMeta | null>(null);
  const [query, setQuery] = useState<TaskListQuery>({
    sortBy: "updatedAt",
    sortDir: "desc",
    page: 1,
    pageSize: 20
  });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const teamMembersRef = useRef<TeamMember[]>([]);
  const lastLoadedQueryKey = useRef<string | null>(null);

  useEffect(() => {
    teamMembersRef.current = teamMembers;
  }, [teamMembers]);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      lastLoadedQueryKey.current = queryKey;
      setLoading(true);
      setError(null);
      try {
        const tasksPromise = tasksApi.listPaged(query);
        const teamPromise = teamLoaded ? Promise.resolve(teamMembersRef.current) : teamMembersApi.list();
        const [tasksResponse, teamData] = await Promise.all([tasksPromise, teamPromise]);
        if (!active) return;
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
        if (active) setError("Unable to load tasks from the API.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryKey, teamLoaded, reloadToken]);

  const handleQueryChange = useCallback((nextQuery: TaskListQuery) => {
    const nextKey = JSON.stringify(nextQuery);
    setQuery((prev) => (JSON.stringify(prev) === nextKey ? prev : nextQuery));
  }, []);

  const handleRetry = useCallback(() => {
    lastLoadedQueryKey.current = null;
    setReloadToken((prev) => prev + 1);
  }, []);

  if (loading && !hasLoaded) {
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
        onRetry={handleRetry}
      />
    );
  }

  const hasActiveFilters =
    Boolean(query.status) ||
    Boolean(query.priority) ||
    Boolean(query.assignedTo) ||
    Boolean(query.department) ||
    Boolean(query.q) ||
    Boolean(query.dueFrom) ||
    Boolean(query.dueTo);

  const totalTasks = pagination?.total ?? tasks.length;
  if (!totalTasks && !hasActiveFilters) {
    return (
      <EmptyState title="No tasks yet" description="Create tasks to begin tracking progress." />
    );
  }

  return (
    <TasksTableClient
      tasks={tasks}
      teamMembers={teamMembers}
      pagination={pagination ?? undefined}
      loading={loading}
      useUrlState={false}
      page={query.page}
      pageSize={query.pageSize}
      initialQuery={query}
      onQueryChange={handleQueryChange}
    />
  );
}
