"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { App, Dropdown, Tabs } from "antd";
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
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [task, setTask] = useState<Task | null>(null);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedTaskId = task?.id ?? task?._id ?? taskId ?? "";

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

  const assignedToDepartment = useMemo(() => {
    if (!task) return "";
    const member = teamMembers.find(
      (item) => resolveTeamMemberId(item) === task.assignedTo
    );
    return member?.department?.trim() ?? "";
  }, [task, teamMembers]);

  const handleArchive = () => {
    if (!resolvedTaskId) return;
    modal.confirm({
      title: "Archive Task",
      content: "Do you really want to archive this task?",
      okText: "Yes",
      cancelText: "No",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tasksApi.archive(resolvedTaskId);
          message.success("Task archived.");
          router.push("/tasks/archive");
        } catch (err) {
          message.error("Unable to archive task. Please try again.");
          throw err;
        }
      }
    });
  };

  const menuItems = [
    { key: "edit", label: "Edit Task" },
    { key: "archive", label: "Archive Task", danger: true }
  ];


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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/tasks"
            aria-label="Back to task list"
            className="relative -top-[2px] inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-text-primary"
          >
            <ArrowLeft size={16} />
          </Link>
          <h2 className="mb-[10px] font-display text-3xl text-text-primary">
            {task.title}
          </h2>
        </div>
        <Dropdown
          placement="bottomRight"
          trigger={["click"]}
          menu={{
            items: menuItems,
            onClick: ({ key }) => {
              if (key === "edit") {
                router.push(`/tasks/${resolvedTaskId}/edit`);
                return;
              }
              if (key === "archive") {
                handleArchive();
              }
            }
          }}
        >
          <button
            type="button"
            disabled={!resolvedTaskId}
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Task Actions
            <ChevronDown size={14} />
          </button>
        </Dropdown>
      </div>

      <div className="rounded-xl bg-surface-card p-4 shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Description</p>
        <p className="mt-2 text-sm text-text-primary">{task.description || "No description."}</p>

        <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr]">
          <div>
            <p className="mb-0 text-xs uppercase tracking-[0.2em] text-text-muted">Assigned To</p>
            <p className="mb-0 mt-1 text-sm text-text-primary">
              {assignedToName || "Unassigned"}
            </p>
            <p className="text-xs text-text-muted">
              {assignedToDepartment || "Department"}
            </p>
          </div>
          <div>
            <p className="mb-0 text-xs uppercase tracking-[0.2em] text-text-muted">Added By</p>
            <p className="mt-1 text-sm text-text-primary">
              {task.createdByName ||
                (typeof task.createdBy === "object" ? task.createdBy?.name : "") ||
                "—"}
            </p>
          </div>
          <div>
            <p className="mb-0 text-xs uppercase tracking-[0.2em] text-text-muted">Due Date</p>
            <p className="mt-1 text-sm text-text-primary">{formatDate(task.dueDate)}</p>
          </div>
          <div>
            <p className="mb-0 text-xs uppercase tracking-[0.2em] text-text-muted">Start Date</p>
            <p className="mt-1 text-sm text-text-primary">{formatDate(task.startDate)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <StatusBadge label={task.priority} />
              <StatusBadge label={task.status} />
            </div>
            {task.lastRemarkAt ? (
              <p className="text-xs text-text-muted">
                Last remark: {formatDate(task.lastRemarkAt)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-surface-card p-4 shadow-card">
        <Tabs
          items={[
            {
              key: "remarks",
              label: "Remarks",
              children: (
                <TaskRemarksClient
                  taskId={task.id ?? task._id ?? taskId ?? ""}
                  initialRemarks={remarks}
                />
              )
            },
            {
              key: "attachments",
              label: "Attachments",
              children: (
                <TaskAttachmentsClient
                  taskId={task.id ?? task._id ?? taskId ?? ""}
                  initialAttachments={task.attachments}
                />
              )
            }
          ]}
        />
      </div>
    </div>
  );
}
