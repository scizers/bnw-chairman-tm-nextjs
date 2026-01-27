"use client";

import { useCallback, useEffect, useState } from "react";
import TasksTableClient from "@/components/tasks/TasksTableClient";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi, teamMembersApi } from "@/lib/api";
import { attachAssigneeNames, normalizeTasks } from "@/lib/utils/task";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";

export default function TasksPageClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, teamData] = await Promise.all([
        tasksApi.list(),
        teamMembersApi.list()
      ]);
      const normalizedTeam = teamData ?? [];
      const normalizedTasks = attachAssigneeNames(
        normalizeTasks(tasksData ?? []),
        normalizedTeam
      );
      setTasks(normalizedTasks);
      setTeamMembers(normalizedTeam);
    } catch (err) {
      setError("Unable to load tasks from the API.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  return tasks.length ? (
    <TasksTableClient tasks={tasks} teamMembers={teamMembers} />
  ) : (
    <EmptyState title="No tasks yet" description="Create tasks to begin tracking progress." />
  );
}
