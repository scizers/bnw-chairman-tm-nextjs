"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi, teamMembersApi } from "@/lib/api";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import { normalizeTasks } from "@/lib/utils/task";

interface TaskEditClientProps {
  taskId: string;
}

export default function TaskEditClient({ taskId }: TaskEditClientProps) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, teamData] = await Promise.all([
        tasksApi.list(),
        teamMembersApi.list()
      ]);
      const normalized = normalizeTasks(tasksData ?? []);
      const selected = normalized.find((item) => item.id === taskId || item._id === taskId) ?? null;
      setTask(selected);
      setTeamMembers(teamData ?? []);
    } catch (err) {
      setError("Unable to load task details.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    status: "open",
    priority: "normal",
    dueDate: ""
  });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo || "",
      status: task.status || "open",
      priority: task.priority || "normal",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ""
    });
  }, [task]);

  const canSubmit = useMemo(() => form.title.trim().length > 0, [form.title]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    setError(null);
    try {
      await tasksApi.update(task.id ?? taskId, {
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined
      });
      router.push(`/tasks/${task.id ?? taskId}`);
    } catch (err) {
      setError("Failed to update task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Unable to edit task" description={error} onRetry={load} />;
  }

  if (!task) {
    return <ErrorState title="Task not found" description="Return to the task list." />;
  }

  return (
    <div className="rounded-xl bg-surface-card p-6 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Title</label>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Assigned To</label>
          <select
            value={form.assignedTo}
            onChange={(event) => setForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member, index) => {
              const value =
                member.id ?? member._id ?? member.email ?? member.name ?? String(index);
              return (
                <option key={`${value}-${index}`} value={value}>
                  {member.name}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</label>
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Priority</label>
          <select
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Description</label>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-2 min-h-[140px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit || saving}
          onClick={handleSave}
          className="rounded-full bg-brand-primary px-5 py-2 text-xs font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
