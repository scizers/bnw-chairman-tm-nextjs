"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "antd";
import ErrorState from "@/components/common/ErrorState";
import { departmentsApi, teamMembersApi } from "@/lib/api";
import type { Department } from "@/types/department";

export default function TeamMemberCreateClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [form, setForm] = useState({
    name: "",
    designation: "",
    departmentId: "",
    email: "",
    isActive: true
  });

  const isEmailValid = useMemo(() => {
    const email = form.email.trim();
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [form.email]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.designation.trim().length > 0 &&
      isEmailValid &&
      form.departmentId.trim().length > 0
    );
  }, [form, isEmailValid]);

  useEffect(() => {
    let active = true;
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        let data = await departmentsApi.listAll();
        if (!data?.length) {
          const summary = await departmentsApi.list();
          data =
            summary?.map((dept) => ({
              _id: dept.id ?? dept._id,
              name: dept.department
            })) ?? [];
        }
        if (!active) return;
        setDepartments(data ?? []);
      } catch {
        if (active) setDepartments([]);
      } finally {
        if (active) setLoadingDepartments(false);
      }
    };
    void loadDepartments();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const created = await teamMembersApi.create({
        name: form.name.trim(),
        designation: form.designation.trim(),
        departmentId: form.departmentId,
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
          <Select
            value={form.departmentId || undefined}
            onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
            showSearch
            optionFilterProp="label"
            options={departments
              .map((dept) => ({
                value: String(dept.id ?? dept._id ?? ""),
                label: dept.name
              }))
              .filter((option) => option.value)}
            placeholder="Select department"
            loading={loadingDepartments}
            size="large"
            className="mt-2 w-full rounded-xl"
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
          {form.email.trim().length > 0 && !isEmailValid ? (
            <p className="mt-2 text-xs text-rose-300">Enter a valid email address.</p>
          ) : null}
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
