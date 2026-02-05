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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
        const teamPromise = teamLoaded
          ? Promise.resolve(teamMembersRef.current)
          : teamMembersApi.list();
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
        if (tasksResponse?.meta) {
          setPage(tasksResponse.meta.page ?? query.page ?? 1);
          setPageSize(tasksResponse.meta.pageSize ?? query.pageSize ?? 20);
        }
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
    setQuery(nextQuery);
  }, []);

  const handleRetry = useCallback(() => {
    lastLoadedQueryKey.current = null;
    setReloadToken((prev) => prev + 1);
  }, []);

  if (loading && !hasLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Tasks (0)</h2>
          <p className="mt-2 text-sm text-text-muted">
            Review, prioritize, and act on your executive task inventory.
          </p>
        </div>
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Tasks (0)</h2>
          <p className="mt-2 text-sm text-text-muted">
            Review, prioritize, and act on your executive task inventory.
          </p>
        </div>
        <ErrorState
          title="Task feed unavailable"
          description={error}
          onRetry={handleRetry}
        />
      </div>
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
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Tasks (0)</h2>
          <p className="mt-2 text-sm text-text-muted">
            Review, prioritize, and act on your executive task inventory.
          </p>
        </div>
        <EmptyState
          title="No tasks yet"
          description="Create tasks to begin tracking progress."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">
          Tasks ({totalTasks})
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Review, prioritize, and act on your executive task inventory.
        </p>
      </div>

      <TasksTableClient
        tasks={tasks}
        teamMembers={teamMembers}
        pagination={pagination ?? undefined}
        loading={loading}
        showResetFilters
        useUrlState={false}
        page={page}
        pageSize={pageSize}
        initialQuery={query}
        onQueryChange={handleQueryChange}
        onReload={handleRetry}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
          setQuery((prev) => ({
            ...prev,
            page: nextPage,
            pageSize: nextPageSize
          }));
        }}
      />
    </div>
  );
}
