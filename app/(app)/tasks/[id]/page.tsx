import TaskRemarksClient from "@/components/tasks/TaskRemarksClient";
import TaskAttachmentsClient from "@/components/tasks/TaskAttachmentsClient";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import Link from "next/link";
import { serverTasksApi, serverTeamMembersApi } from "@/lib/api/server";
import type { Remark } from "@/types/remark";
import { formatDate } from "@/lib/utils/format";
import { attachAssigneeNames, normalizeTasks, resolveTeamMemberId } from "@/lib/utils/task";

interface TaskDetailPageProps {
  params: { id: string };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = params;
  let task = undefined;
  let remarks: Remark[] = [];

  try {
    const [tasksData, teamMembers] = await Promise.all([
      serverTasksApi.list(),
      serverTeamMembersApi.list()
    ]);
    const normalizedTasks = attachAssigneeNames(
      normalizeTasks(tasksData ?? []),
      teamMembers ?? []
    );
    task = normalizedTasks.find((item) => item.id === id || item._id === id);
    if (task) {
      const assignee = (teamMembers ?? []).find(
        (member) => resolveTeamMemberId(member) === task?.assignedTo
      );
      task = {
        ...task,
        assignedToName: task.assignedToName ?? assignee?.name
      };
      remarks = await serverTasksApi.getRemarks(task.id ?? id);
    }
  } catch (error) {
    task = undefined;
    remarks = [];
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
          <h2 className="font-display text-3xl text-text-primary">{task.title}</h2>
          <Link
            href={`/tasks/${task.id ?? id}/edit`}
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
                <p className="mt-2 text-sm text-text-primary">{task.assignedToName || "Unassigned"}</p>
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

          <TaskAttachmentsClient taskId={id} initialAttachments={task.attachments} />
        </div>

        <TaskRemarksClient taskId={id} initialRemarks={remarks} />
      </div>
    </div>
  );
}
