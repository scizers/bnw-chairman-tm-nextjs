"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import TaskRemarksClient from "@/components/tasks/TaskRemarksClient";
import TaskAttachmentsClient from "@/components/tasks/TaskAttachmentsClient";
import { tasksApi, teamMembersApi } from "@/lib/api";
import type { Task } from "@/types/task";
import type { Remark } from "@/types/remark";
import type { TeamMember } from "@/types/team";
import { formatDate } from "@/lib/utils/format";
import { resolveTeamMemberId } from "@/lib/utils/task";

interface TaskDetailClientProps {
  taskId?: string;
}

export default function TaskDetailClient({ taskId }: TaskDetailClientProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [taskData, teamData, remarksData] = await Promise.all([
          tasksApi.getById(taskId),
          teamMembersApi.list(),
          tasksApi.getRemarks(taskId)
        ]);
        if (!active) return;
        setTask(taskData ?? null);
        setTeamMembers(teamData ?? []);
        setRemarks(remarksData ?? []);
      } catch (err) {
        if (!active) return;
        setError("Unable to load task details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [taskId]);

  const assignedToName = useMemo(() => {
    if (!task) return "";
    if (task.assignedToName) return task.assignedToName;
    const member = teamMembers.find(
      (item) => resolveTeamMemberId(item) === task.assignedTo
    );
    return member?.name ?? "";
  }, [task, teamMembers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={3} />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={8} />
          </div>
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={6} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Task feed unavailable" description={error} />;
  }

  if (!task) {
    return (
      <EmptyState
        title="Task not found"
        description="Return to the task list to locate another task."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Detail</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-primary"
            >
              ← Back to tasks
            </Link>
            <h2 className="font-display text-3xl text-text-primary">{task.title}</h2>
          </div>
          <Link
            href={`/tasks/${task.id ?? task._id}/edit`}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
          >
            Edit Task
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Task Information</p>
            <p className="mt-3 text-sm text-text-primary">{task.description || "No description."}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Assigned To</p>
                <p className="mt-2 text-sm text-text-primary">
                  {assignedToName || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</p>
                <div className="mt-2">
                  <StatusBadge label={task.status} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Priority</p>
                <div className="mt-2">
                  <StatusBadge label={task.priority} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Due Date</p>
                <p className="mt-2 text-sm text-text-primary">{formatDate(task.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Start Date</p>
                <p className="mt-2 text-sm text-text-primary">{formatDate(task.startDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Last Remark</p>
                <p className="mt-2 text-sm text-text-primary">
                  {task.lastRemark ||
                    (task.lastRemarkAt ? formatDate(task.lastRemarkAt) : "-")}
                </p>
              </div>
            </div>
          </div>

          <TaskAttachmentsClient
            taskId={task.id ?? task._id ?? taskId ?? ""}
            initialAttachments={task.attachments}
          />
        </div>

        <TaskRemarksClient
          taskId={task.id ?? task._id ?? taskId ?? ""}
          initialRemarks={remarks}
        />
      </div>
    </div>
  );
}
