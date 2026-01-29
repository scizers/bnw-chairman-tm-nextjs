"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import StatusBadge from "@/components/common/StatusBadge";
import TaskRemarksClient from "@/components/tasks/TaskRemarksClient";
import TaskAttachmentsClient from "@/components/tasks/TaskAttachmentsClient";
import { tasksApi, teamMembersApi } from "@/lib/api";
import type { Task } from "@/types/task";
import type { Remark } from "@/types/remark";
import type { TeamMember } from "@/types/team";
import { formatDate } from "@/lib/utils/format";
import { resolveTeamMemberId } from "@/lib/utils/task";

interface TaskDetailModalProps {
  open: boolean;
  taskId?: string;
  onClose: () => void;
}

export default function TaskDetailModal({ open, taskId, onClose }: TaskDetailModalProps) {
  if (!open) {
    return null;
  }

  const [task, setTask] = useState<Task | null>(null);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedTaskId = task?.id ?? task?._id ?? taskId;

  useEffect(() => {
    if (!open || !taskId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [taskData, teamData, remarkData] = await Promise.all([
          tasksApi.getById(taskId),
          teamMembersApi.list(),
          tasksApi.getRemarks(taskId)
        ]);
        if (!active) return;
        setTask(taskData ?? null);
        setTeamMembers(teamData ?? []);
        setRemarks(remarkData ?? []);
      } catch (err) {
        if (active) setError("Unable to load task details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [open, taskId]);

  const assignedToName = useMemo(() => {
    if (!task) return "";
    if (task.assignedToName) return task.assignedToName;
    const member = teamMembers.find(
      (item) => resolveTeamMemberId(item) === task.assignedTo
    );
    return member?.name ?? "";
  }, [task, teamMembers]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      title="Task Details"
      destroyOnHidden
    >
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton lines={3} />
          <LoadingSkeleton lines={6} />
        </div>
      ) : error ? (
        <ErrorState title="Task details unavailable" description={error} />
      ) : !task ? (
        <p className="text-sm text-text-muted">Task not found.</p>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Task</p>
            <h3 className="mt-2 font-display text-2xl text-text-primary">{task.title}</h3>
            <p className="mt-2 text-sm text-text-muted">{task.description || "No description."}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

          {resolvedTaskId ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <TaskAttachmentsClient
                key={`attachments-${resolvedTaskId}`}
                taskId={resolvedTaskId}
                initialAttachments={task.attachments}
              />
              <TaskRemarksClient
                key={`remarks-${resolvedTaskId}`}
                taskId={resolvedTaskId}
                initialRemarks={remarks}
              />
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
