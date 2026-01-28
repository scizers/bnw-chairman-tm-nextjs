"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi, teamMembersApi } from "@/lib/api";
import type { TeamMember } from "@/types/team";

const getDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TaskCreateClient() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    status: "open",
    priority: "low",
    dueDate: getDefaultDueDate()
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const teamData = await teamMembersApi.list();
      setTeamMembers(teamData ?? []);
    } catch (err) {
      setError("Unable to load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.assignedTo.trim().length > 0 &&
      form.status.trim().length > 0 &&
      form.dueDate.trim().length > 0
    );
  }, [form]);

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const created = await tasksApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assignedTo: form.assignedTo,
        status: form.status,
        priority: form.priority,
        dueDate: new Date(form.dueDate).toISOString()
      });
      const id = created?.id ?? created?._id;
      router.push(id ? `/tasks/${id}` : "/tasks");
    } catch (err) {
      setError("Failed to create task. Please try again.");
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
    return <ErrorState title="Unable to create task" description={error} onRetry={load} />;
  }

  return (
    <div className="rounded-xl bg-surface-card p-6 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Task Name</label>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Assignee</label>
          <select
            value={form.assignedTo}
            onChange={(event) => setForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
            required
          >
            <option value="">Select assignee</option>
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
            required
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="blocked">Blocked</option>
            <option value="critical">Critical</option>
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
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Description</label>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-2 min-h-[140px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary"
            placeholder="Optional description"
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
          onClick={handleCreate}
          className="rounded-full bg-brand-primary px-5 py-2 text-xs font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create Task"}
        </button>
      </div>
    </div>
  );
}
