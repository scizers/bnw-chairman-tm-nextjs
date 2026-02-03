"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "antd";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { departmentsApi, teamMembersApi } from "@/lib/api";
import type { Department } from "@/types/department";
import type { TeamMember } from "@/types/team";

interface TeamMemberEditClientProps {
  teamMemberId: string;
}

export default function TeamMemberEditClient({ teamMemberId }: TeamMemberEditClientProps) {
  const router = useRouter();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
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
    const trimmed = form.email.trim();
    if (!trimmed) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }, [form.email]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamMembersApi.getById(teamMemberId);
      setMember(data ?? null);
    } catch (err) {
      setError("Unable to load team member.");
    } finally {
      setLoading(false);
    }
  }, [teamMemberId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!member) return;
    const deptValue = member.departmentId as unknown as
      | { _id?: string; id?: string }
      | string
      | undefined;
    const resolvedDepartmentId =
      typeof deptValue === "string" ? deptValue : String(deptValue?._id ?? deptValue?.id ?? "");
    setForm({
      name: member.name ?? "",
      designation: member.designation ?? "",
      departmentId: resolvedDepartmentId,
      email: member.email ?? "",
      isActive: member.isActive ?? true
    });
  }, [member]);

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

  useEffect(() => {
    if (!member) return;
    if (form.departmentId) return;
    if (!member.department || !departments.length) return;
    const matched = departments.find(
      (dept) => dept.name?.trim() === member.department?.trim()
    );
    if (!matched) return;
    setForm((prev) => ({ ...prev, departmentId: String(matched.id ?? matched._id ?? "") }));
  }, [member, departments, form.departmentId]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.designation.trim().length > 0 &&
      isEmailValid &&
      String(form.departmentId || "").trim().length > 0
    );
  }, [form, isEmailValid]);

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await teamMembersApi.update(teamMemberId, {
        name: form.name.trim(),
        designation: form.designation.trim(),
        departmentId: String(form.departmentId || "").trim() || undefined,
        email: form.email.trim(),
        isActive: form.isActive
      });
      router.push(`/team/${teamMemberId}`);
    } catch (err) {
      setError("Failed to update team member.");
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
    return <ErrorState title="Unable to edit team member" description={error} onRetry={load} />;
  }

  if (!member) {
    return <ErrorState title="Team member not found" description="Return to the team list." />;
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
            onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Department</label>
          <Select
            value={form.departmentId || undefined}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, departmentId: value ? String(value) : "" }))
            }
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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
