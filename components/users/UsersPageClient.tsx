"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Input, Modal, Popconfirm, Select, Space, Switch, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { usersApi } from "@/lib/api";
import type { User } from "@/types/user";

interface UserFormState {
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  canAddUsers: boolean;
  password: string;
}

const ROLE_OPTIONS = [
  { value: "chairman", label: "Chairman" },
  { value: "executive", label: "Executive" },
  { value: "sales_report", label: "Sales Report" }
];

const resolveUserId = (user: User) => String(user.id ?? user._id ?? "");

const createEmptyForm = (): UserFormState => ({
  name: "",
  email: "",
  role: "executive",
  isActive: true,
  canAddUsers: false,
  password: ""
});

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function UsersPageClient() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(createEmptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.list();
      setUsers(data ?? []);
    } catch (err) {
      setError("Unable to load users.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const haystack = [user.name, user.email, user.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [users, search]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(createEmptyForm());
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "executive",
      isActive: Boolean(user.isActive ?? true),
      canAddUsers: Boolean(user.canAddUsers ?? false),
      password: ""
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingUser(null);
    setForm(createEmptyForm());
  };

  const canSave = useMemo(() => {
    const hasName = Boolean(form.name.trim());
    const hasEmail = Boolean(form.email.trim()) && isValidEmail(form.email);
    const hasRole = Boolean(form.role);
    const hasPassword = editingUser ? true : Boolean(form.password.trim().length >= 8);
    return hasName && hasEmail && hasRole && hasPassword;
  }, [form, editingUser]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: Partial<User> & { password?: string } = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        isActive: form.isActive,
        canAddUsers: form.canAddUsers
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (editingUser) {
        const userId = resolveUserId(editingUser);
        if (userId) {
          await usersApi.update(userId, payload);
          message.success("User updated.");
        }
      } else {
        await usersApi.create(payload);
        message.success("User created.");
      }
      closeModal();
      await load();
    } catch (err) {
      message.error("Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const userId = resolveUserId(user);
    if (!userId) return;
    try {
      await usersApi.update(userId, { isActive: !user.isActive });
      message.success(user.isActive ? "User deactivated." : "User activated.");
      await load();
    } catch (err) {
      message.error("Unable to update user status.");
    }
  };

  const handleDelete = async (user: User) => {
    const userId = resolveUserId(user);
    if (!userId) return;
    try {
      await usersApi.softDelete(userId);
      message.success("User removed.");
      await load();
    } catch (err) {
      message.error("Unable to remove user.");
    }
  };

  if (loading && !hasLoaded) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="User feed unavailable" description={error} onRetry={load} />;
  }

  if (!users.length) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="No users"
          description="Create the first user to manage access."
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          className="rounded-full shadow-soft"
        >
          Add User
        </Button>
      </div>
    );
  }

  const columns: ColumnsType<User> = [
    {
      key: "name",
      title: "Name",
      render: (row: User) => (
        <div>
          <p className="font-semibold text-text-primary">{row.name}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      )
    },
    {
      key: "role",
      title: "Role",
      render: (row: User) => row.role || "-"
    },
    {
      key: "canAddUsers",
      title: "User Admin",
      render: (row: User) => (row.canAddUsers ? "Yes" : "No")
    },
    {
      key: "status",
      title: "Status",
      render: (row: User) => (
        <span
          className={
            row.isActive
              ? "rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300"
              : "rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300"
          }
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (row: User) => (
        <Space size="small" className="justify-end">
          <Button
            type="default"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleToggleActive(row);
            }}
          >
            {row.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              openEdit(row);
            }}
          />
          <Popconfirm
            title="Remove user?"
            description="This will deactivate the user account."
            okText="Remove"
            okType="danger"
            cancelText="Cancel"
            onConfirm={() => handleDelete(row)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
          placeholder="Search name or email"
          className="min-w-[220px] flex-1"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          className="rounded-full shadow-soft"
        >
          Add User
        </Button>
      </div>

      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey={(record) => resolveUserId(record) || record.email}
          locale={{ emptyText: "No users yet." }}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingUser ? "Edit User" : "Add User"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editingUser ? "Save Changes" : "Create User"}
        okButtonProps={{ disabled: !canSave, loading: saving }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Name</label>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Email</label>
            <Input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="name@company.com"
            />
            {form.email.trim().length > 0 && !isValidEmail(form.email) ? (
              <p className="mt-2 text-xs text-rose-300">Enter a valid email address.</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Role</label>
            <Select
              value={form.role}
              options={ROLE_OPTIONS}
              onChange={(role) => setForm((prev) => ({ ...prev, role }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">User Admin</label>
            <div className="mt-2 flex items-center gap-3">
              <Switch
                checked={form.canAddUsers}
                onChange={(checked) => setForm((prev) => ({ ...prev, canAddUsers: checked }))}
              />
              <span className="text-sm text-text-muted">
                {form.canAddUsers ? "Can manage users" : "No user admin access"}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</label>
            <div className="mt-2 flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <span className="text-sm text-text-muted">
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
              {editingUser ? "Reset Password (optional)" : "Password"}
            </label>
            <Input.Password
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder={editingUser ? "Leave blank to keep current" : "Minimum 8 characters"}
            />
            {!editingUser && form.password.length > 0 && form.password.length < 8 ? (
              <p className="mt-2 text-xs text-rose-300">Minimum 8 characters required.</p>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
