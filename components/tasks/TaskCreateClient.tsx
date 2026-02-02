"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker, Select } from "antd";
import dayjs from "dayjs";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { tasksApi, teamMembersApi } from "@/lib/api";
import type { TeamMember } from "@/types/team";

const getDefaultDate = (daysFromToday = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDueDate = () => {
  return getDefaultDate(7);
};

const formatDayOffset = (value?: string) => {
  if (!value) return "";
  const today = dayjs().startOf("day");
  const selected = dayjs(value).startOf("day");
  const diff = selected.diff(today, "day");

  if (diff === 0) return "This date is today.";
  if (diff === 1) return "This date is 1 day from today.";
  if (diff > 1) return `This date is ${diff} days from today.`;
  if (diff === -1) return "This date was 1 day ago.";
  return `This date was ${Math.abs(diff)} days ago.`;
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
    startDate: getDefaultDate(),
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
      form.startDate.trim().length > 0 &&
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
        startDate: new Date(form.startDate).toISOString(),
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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Task Name</label>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-lg font-semibold text-text-primary"
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Assignee</label>
          <Select
            value={form.assignedTo || undefined}
            onChange={(value) => setForm((prev) => ({ ...prev, assignedTo: value }))}
            className="mt-2 w-full"
            placeholder="Select assignee"
            size="large"
            showSearch
            optionFilterProp="label"
            options={teamMembers.map((member, index) => {
              const value =
                member.id ?? member._id ?? member.email ?? member.name ?? String(index);
              return {
                value,
                label: member.name ?? "Unnamed"
              };
            })}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</label>
          <Select
            value={form.status}
            onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
            className="mt-2 w-full"
            size="large"
            options={[
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In Progress" },
              { value: "overdue", label: "Overdue" },
              { value: "blocked", label: "Blocked" },
              { value: "critical", label: "Critical" },
              { value: "completed", label: "Completed" }
            ]}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Priority</label>
          <Select
            value={form.priority}
            onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
            className="mt-2 w-full"
            size="large"
            options={[
              { value: "low", label: "Low" },
              { value: "normal", label: "Normal" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" }
            ]}
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Start Date</label>
          <DatePicker
            value={form.startDate ? dayjs(form.startDate) : undefined}
            onChange={(date, dateString) =>
              setForm((prev) => ({ ...prev, startDate: String(dateString) }))
            }
            className="mt-2 w-full"
            size="large"
            allowClear={false}
            format="YYYY-MM-DD"
          />
          <p className="mt-2 text-xs text-text-muted">{formatDayOffset(form.startDate)}</p>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Due Date</label>
          <DatePicker
            value={form.dueDate ? dayjs(form.dueDate) : undefined}
            onChange={(date, dateString) =>
              setForm((prev) => ({ ...prev, dueDate: String(dateString) }))
            }
            className="mt-2 w-full"
            size="large"
            allowClear={false}
            format="YYYY-MM-DD"
          />
          <p className="mt-2 text-xs text-text-muted">{formatDayOffset(form.dueDate)}</p>
        </div>
        <div className="md:col-span-3">
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
