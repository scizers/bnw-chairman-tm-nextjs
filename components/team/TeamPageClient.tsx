"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import TeamTableClient from "@/components/team/TeamTableClient";
import { tasksApi, teamMembersApi } from "@/lib/api";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import { resolveTeamMemberId } from "@/lib/utils/task";

export default function TeamPageClient() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamData, tasksData] = await Promise.all([
        teamMembersApi.list(),
        tasksApi.list()
      ]);
      setTeamMembers(teamData ?? []);
      setTasks(tasksData ?? []);
    } catch (err) {
      setError("Unable to load team data.");
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
    return <ErrorState title="Team feed unavailable" description={error} onRetry={load} />;
  }

  const teamWithCounts = teamMembers.map((member) => {
    const id = resolveTeamMemberId(member);
    const assigned = tasks.filter((task) => task.assignedTo === id);
    const openTasks = assigned.filter((task) =>
      ["open", "in_progress"].includes(task.status)
    ).length;
    const overdueTasks = assigned.filter((task) => task.status === "overdue").length;

    return {
      ...member,
      id,
      openTasks: member.openTasks ?? openTasks,
      overdueTasks: member.overdueTasks ?? overdueTasks
    };
  });

  return teamWithCounts.length ? (
    <TeamTableClient teamMembers={teamWithCounts} />
  ) : (
    <EmptyState title="No team members" description="Add team members to monitor tasks." />
  );
}
