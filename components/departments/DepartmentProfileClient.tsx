"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import KpiCard from "@/components/common/KpiCard";
import DepartmentTasksListClient from "@/components/departments/DepartmentTasksListClient";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { departmentsApi, tasksApi, teamMembersApi } from "@/lib/api";
import type { DepartmentSummary } from "@/types/department";
import type { TeamMember } from "@/types/team";

interface DepartmentProfileClientProps {
  department?: string;
}

const parseListParam = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const isUnassigned = (department: string) => department.trim().toLowerCase() === "unassigned";

export default function DepartmentProfileClient({
  department
}: DepartmentProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<DepartmentSummary | null>(null);
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
    if (!department) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [departmentList, members, totalCount, openCount, overdueCount, inProgressCount, completedCount] =
          await Promise.all([
            departmentsApi.list(),
            teamMembersApi.list(),
            tasksApi.count({ department }),
            tasksApi.count({ department, status: "open" }),
            tasksApi.count({ department, status: "overdue" }),
            tasksApi.count({ department, status: "in_progress" }),
            tasksApi.count({ department, status: "completed" })
          ]);
        if (!active) return;
        const matched = (departmentList ?? []).find(
          (entry) => entry.department.trim() === department
        );
        setSummary(matched ?? null);

        const filteredMembers = (members ?? []).filter((member) => {
          const dept = member.department?.trim() || "Unassigned";
          if (isUnassigned(department)) {
            return !member.department?.trim();
          }
          return dept === department;
        });
        setTeamMembers(filteredMembers);

        setStats({
          total: totalCount ?? 0,
          open: openCount ?? 0,
          overdue: overdueCount ?? 0,
          inProgress: inProgressCount ?? 0,
          completed: completedCount ?? 0
        });
      } catch (err) {
        if (active) setError("Unable to load department profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [department]);

  const activeStatuses = useMemo(
    () => parseListParam(searchParams.get("status")),
    [searchParams]
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={2} />
          </div>
        </div>
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Department view unavailable" description={error} />;
  }

  if (!department) {
    return (
      <EmptyState
        title="Department not found"
        description="Return to the department list to select another view."
      />
    );
  }

  const title = summary?.department ?? department;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-text-primary">{title}</h2>
            <p className="mt-2 text-sm text-text-muted">
              {summary?.memberCount ?? teamMembers.length} members · {summary?.taskCount ?? stats.total} tasks
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Total Tasks"
          value={stats.total}
          onClick={() => updateStatusFilter()}
          active={activeStatuses.length === 0}
        />
        <KpiCard
          title="Open Tasks"
          value={stats.open}
          onClick={() => updateStatusFilter("open")}
          active={activeStatuses.includes("open")}
        />
        <KpiCard
          title="Overdue"
          value={stats.overdue}
          onClick={() => updateStatusFilter("overdue")}
          active={activeStatuses.includes("overdue")}
        />
        <KpiCard
          title="In Progress"
          value={stats.inProgress}
          onClick={() => updateStatusFilter("in_progress")}
          active={activeStatuses.includes("in_progress")}
        />
        <KpiCard
          title="Completed"
          value={stats.completed}
          onClick={() => updateStatusFilter("completed")}
          active={activeStatuses.includes("completed")}
        />
      </div>

      <DepartmentTasksListClient
        department={department}
        teamMembers={teamMembers}
        onViewTask={(taskId) => setActiveTaskId(taskId)}
        onEditTask={(taskId) => router.push(`/tasks/${taskId}/edit`)}
      />

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
