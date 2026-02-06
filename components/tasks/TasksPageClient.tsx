"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TasksTableClient from "@/components/tasks/TasksTableClient";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi, teamMembersApi } from "@/lib/api";
import { attachAssigneeNames, normalizeTasks, resolveTeamMemberId } from "@/lib/utils/task";
import { getAuthProfile } from "@/lib/auth/token";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import type { TaskListMeta, TaskListQuery } from "@/lib/api/tasks";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type TasksPageMode = "all" | "my" | "archive";

interface TasksPageClientProps {
  mode?: TasksPageMode;
}

export default function TasksPageClient({ mode = "all" }: TasksPageClientProps) {
  const isMyTasks = mode === "my";
  const isArchive = mode === "archive";
  const { email, name } = getAuthProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pagination, setPagination] = useState<TaskListMeta | null>(null);
  const [query, setQuery] = useState<TaskListQuery>(() => ({
    sortBy: "updatedAt",
    sortDir: "desc",
    page: 1,
    pageSize: 20,
    archived: isArchive ? "true" : "false",
    ...(isMyTasks ? { assignedTo: "me" } : {})
  }));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberLookupError, setMemberLookupError] = useState<string | null>(null);
  const [resolvedMemberId, setResolvedMemberId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const teamMembersRef = useRef<TeamMember[]>([]);
  const lastLoadedQueryKey = useRef<string | null>(null);

  useEffect(() => {
    teamMembersRef.current = teamMembers;
  }, [teamMembers]);

  useEffect(() => {
    setQuery((prev) => {
      const next = { ...prev, archived: isArchive ? "true" : "false" };
      if (isMyTasks) {
        next.assignedTo = resolvedMemberId ?? "me";
      }
      return next;
    });
  }, [isArchive, isMyTasks, resolvedMemberId]);

  useEffect(() => {
    if (!isMyTasks) {
      setMemberLookupError(null);
      setResolvedMemberId(null);
      return;
    }
    if (!teamLoaded) return;
    const normalizedEmail = email?.toLowerCase();
    const normalizedName = name?.trim().toLowerCase();
    if (!normalizedEmail && !normalizedName) {
      setMemberLookupError("Your account email is missing.");
      setResolvedMemberId(null);
      return;
    }
    const member = teamMembersRef.current.find((item) => {
      if (normalizedEmail && item.email?.toLowerCase() === normalizedEmail) {
        return true;
      }
      if (!normalizedEmail && normalizedName) {
        return item.name?.trim().toLowerCase() === normalizedName;
      }
      return false;
    });
    if (!member) {
      setMemberLookupError(
        normalizedEmail
          ? "No team member record matches your account email."
          : "No team member record matches your account name."
      );
      setResolvedMemberId(null);
      return;
    }
    const resolvedId = resolveTeamMemberId(member);
    if (!resolvedId) {
      setMemberLookupError("Matched team member is missing an id.");
      setResolvedMemberId(null);
      return;
    }
    setMemberLookupError(null);
    setResolvedMemberId(resolvedId);
  }, [email, name, isMyTasks, teamLoaded]);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const shouldSkipTasks =
        isMyTasks && (query.assignedTo === "me" || !resolvedMemberId);
      const waitingForMember = shouldSkipTasks && !memberLookupError;
      lastLoadedQueryKey.current = queryKey;
      setLoading(true);
      setError(null);
      try {
        const tasksPromise = shouldSkipTasks ? Promise.resolve(null) : tasksApi.listPaged(query);
        const teamPromise = teamLoaded
          ? Promise.resolve(teamMembersRef.current)
          : teamMembersApi.list();
        const [tasksResponse, teamData] = await Promise.all([tasksPromise, teamPromise]);
        if (!active) return;
        const normalizedTeam = teamData ?? [];
        if (!teamLoaded) {
          setTeamMembers(normalizedTeam);
          setTeamLoaded(true);
        }
        if (tasksResponse) {
          const normalizedTasks = attachAssigneeNames(
            normalizeTasks(tasksResponse?.data ?? []),
            normalizedTeam
          );
          setTasks(normalizedTasks);
          setPagination(tasksResponse?.meta ?? null);
          if (tasksResponse?.meta) {
            setPage(tasksResponse.meta.page ?? query.page ?? 1);
            setPageSize(tasksResponse.meta.pageSize ?? query.pageSize ?? 20);
          }
          setHasLoaded(true);
        }
      } catch (err) {
        if (active) setError("Unable to load tasks from the API.");
      } finally {
        if (active) {
          setLoading(waitingForMember);
        }
      }
    };
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryKey, teamLoaded, reloadToken, isMyTasks, memberLookupError, resolvedMemberId]);

  const handleQueryChange = useCallback(
    (nextQuery: TaskListQuery) => {
      setQuery({
        ...nextQuery,
        archived: isArchive ? "true" : "false",
        ...(isMyTasks ? { assignedTo: resolvedMemberId ?? "me" } : {})
      });
    },
    [isArchive, isMyTasks, resolvedMemberId]
  );

  const handleRetry = useCallback(() => {
    lastLoadedQueryKey.current = null;
    setReloadToken((prev) => prev + 1);
  }, []);

  const headerTitle = isMyTasks
    ? "My Tasks"
    : isArchive
      ? "Archive Tasks"
      : "Tasks";
  const headerDescription = isMyTasks
    ? "Review tasks assigned to you."
    : isArchive
      ? "Reference previously archived tasks."
      : "Review, prioritize, and act on your executive task inventory.";
  const emptyTitle = isMyTasks
    ? "No tasks assigned to you"
    : isArchive
      ? "No archived tasks"
      : "No tasks yet";
  const emptyDescription = isMyTasks
    ? "You're not assigned to any tasks right now."
    : isArchive
      ? "Archived tasks will appear here once you archive them."
      : "Create tasks to begin tracking progress.";

  if (loading && !hasLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">
            {headerTitle} (0)
          </h2>
          <p className="mt-2 text-sm text-text-muted">{headerDescription}</p>
        </div>
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (memberLookupError) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">
            {headerTitle} (0)
          </h2>
          <p className="mt-2 text-sm text-text-muted">{headerDescription}</p>
        </div>
        <ErrorState
          title="Task feed unavailable"
          description={memberLookupError}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">
            {headerTitle} (0)
          </h2>
          <p className="mt-2 text-sm text-text-muted">{headerDescription}</p>
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
    (!isMyTasks && Boolean(query.assignedTo)) ||
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
          <h2 className="mt-2 font-display text-3xl text-text-primary">
            {headerTitle} (0)
          </h2>
          <p className="mt-2 text-sm text-text-muted">{headerDescription}</p>
        </div>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">
          {headerTitle} ({totalTasks})
        </h2>
        <p className="mt-2 text-sm text-text-muted">{headerDescription}</p>
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
        hideMemberFilter={isMyTasks}
        fixedMemberIds={isMyTasks && resolvedMemberId ? [resolvedMemberId] : undefined}
        onQueryChange={handleQueryChange}
        onReload={handleRetry}
        onTaskStatusUpdated={(taskId, nextStatus) => {
          setTasks((prev) =>
            prev.map((task) =>
              (task.id ?? task._id) === taskId ? { ...task, status: nextStatus } : task
            )
          );
        }}
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
