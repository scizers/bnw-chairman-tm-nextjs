"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import KpiCard from "@/components/common/KpiCard";
import TeamMemberTasksListClient from "@/components/team/TeamMemberTasksListClient";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { tasksApi, teamMembersApi } from "@/lib/api";
import type { TeamMember } from "@/types/team";
import { resolveTeamMemberId } from "@/lib/utils/task";

interface AgentProfileClientProps {
  teamMemberId?: string;
}

const parseListParam = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export default function AgentProfileClient({ teamMemberId }: AgentProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    overdue: 0,
    inProgress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!teamMemberId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamList, totalCount, openCount, overdueCount, inProgressCount, completedCount] =
          await Promise.all([
            teamMembersApi.list(),
            tasksApi.count({ assignedTo: teamMemberId }),
            tasksApi.count({ assignedTo: teamMemberId, status: "open" }),
            tasksApi.count({ assignedTo: teamMemberId, status: "overdue" }),
            tasksApi.count({ assignedTo: teamMemberId, status: "in_progress" }),
            tasksApi.count({ assignedTo: teamMemberId, status: "completed" })
          ]);
        if (!active) return;
        const selected =
          (teamList ?? []).find((item) => resolveTeamMemberId(item) === teamMemberId) ??
          null;
        setMember(selected);
        setTeamMembers(teamList ?? []);
        setStats({
          total: totalCount ?? 0,
          open: openCount ?? 0,
          overdue: overdueCount ?? 0,
          inProgress: inProgressCount ?? 0,
          completed: completedCount ?? 0
        });
      } catch (err) {
        if (active) setError("Unable to load team member profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [teamMemberId]);

  const openCount = stats.open;
  const overdueCount = stats.overdue;
  const inProgressCount = stats.inProgress;
  const completedCount = stats.completed;
  const totalTasks = stats.total;

  const title = useMemo(() => member?.name ?? "Team Member", [member]);
  const activeStatuses = useMemo(
    () => parseListParam(searchParams.get("status")),
    [searchParams]
  );
  const memberId = useMemo(
    () => (member ? resolveTeamMemberId(member) ?? teamMemberId : teamMemberId),
    [member, teamMemberId]
  );

  const updateStatusFilter = (status?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!status) {
      params.delete("status");
    } else {
      const current = parseListParam(params.get("status"));
      if (current.length === 1 && current[0] === status) {
        params.delete("status");
      } else {
        params.set("status", status);
      }
    }
    params.set("page", "1");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `?${nextQuery}` : "?", { scroll: false });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={3} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={2} />
          </div>
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={2} />
          </div>
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={2} />
          </div>
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={2} />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={6} />
          </div>
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={6} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Team member profile unavailable" description={error} />;
  }

  if (!member) {
    return (
      <EmptyState
        title="Team member not found"
        description="Return to the team list to locate another profile."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-text-primary">{title}</h2>
            <p className="mt-2 text-sm text-text-muted">
              {member.designation || "Team Member"} · {member.department || "Department"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (memberId) router.push(`/team/${memberId}/edit`);
            }}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
          >
            Edit Member
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Total Tasks"
          value={totalTasks}
          onClick={() => updateStatusFilter()}
          active={activeStatuses.length === 0}
        />
        <KpiCard
          title="Open Tasks"
          value={openCount}
          onClick={() => updateStatusFilter("open")}
          active={activeStatuses.includes("open")}
        />
        <KpiCard
          title="Overdue"
          value={overdueCount}
          onClick={() => updateStatusFilter("overdue")}
          active={activeStatuses.includes("overdue")}
        />
        <KpiCard
          title="In Progress"
          value={inProgressCount}
          onClick={() => updateStatusFilter("in_progress")}
          active={activeStatuses.includes("in_progress")}
        />
        <KpiCard
          title="Completed"
          value={completedCount}
          onClick={() => updateStatusFilter("completed")}
          active={activeStatuses.includes("completed")}
        />
      </div>

      {teamMemberId ? (
        <TeamMemberTasksListClient
          teamMemberId={teamMemberId}
          teamMembers={teamMembers}
          onViewTask={(taskId) => setActiveTaskId(taskId)}
          onEditTask={(taskId) => router.push(`/tasks/${taskId}/edit`)}
        />
      ) : null}

      {activeTaskId ? (
        <TaskDetailModal
          open
          taskId={activeTaskId}
          onClose={() => setActiveTaskId(null)}
        />
      ) : null}
    </div>
  );
}
