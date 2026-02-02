"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/common/ErrorState";
import { teamMembersApi } from "@/lib/api";

export default function TeamMemberCreateClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    designation: "",
    department: "",
    email: "",
    isActive: true
  });

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.designation.trim().length > 0 &&
      form.email.trim().length > 0
    );
  }, [form]);

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const created = await teamMembersApi.create({
        name: form.name.trim(),
        designation: form.designation.trim(),
        department: form.department.trim() || undefined,
        email: form.email.trim(),
        isActive: form.isActive
      });
      const id = created?.id ?? created?._id;
      router.push(id ? `/team/${id}` : "/team");
    } catch (err) {
      setError("Failed to create team member.");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <ErrorState title="Unable to add team member" description={error} />;
  }

  return (
    <div className="rounded-xl bg-surface-card p-6 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Name</label>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Designation</label>
          <input
            value={form.designation}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, designation: event.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Department</label>
          <input
            value={form.department}
            onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Active</label>
          <select
            value={form.isActive ? "true" : "false"}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))
            }
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
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
          {saving ? "Saving..." : "Add Team Member"}
        </button>
      </div>
    </div>
  );
}
