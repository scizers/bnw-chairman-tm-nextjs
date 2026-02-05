"use client";

import { useEffect, useMemo, useState } from "react";
import { Input, Popconfirm, Select } from "antd";
import { tasksApi, usersApi } from "@/lib/api";
import type { Remark } from "@/types/remark";
import type { User } from "@/types/user";
import { formatDateTime } from "@/lib/utils/format";
import { getAuthProfile } from "@/lib/auth/token";

interface TaskRemarksClientProps {
  taskId: string;
  initialRemarks: Remark[];
}

export default function TaskRemarksClient({ taskId, initialRemarks }: TaskRemarksClientProps) {
  const [remarks, setRemarks] = useState<Remark[]>(initialRemarks);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id?: string; name?: string }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<{ authorId: string; q: string }>({
    authorId: "",
    q: ""
  });
  const [searchInput, setSearchInput] = useState("");
  const [latestRemarkId, setLatestRemarkId] = useState<string>(() => {
    const latest = initialRemarks?.[0];
    return latest ? String(latest.id ?? latest._id ?? "") : "";
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setProfile(getAuthProfile());
  }, []);

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      try {
        const data = await usersApi.list();
        if (!active) return;
        setUsers(data ?? []);
      } catch {
        if (!active) return;
        setUsers([]);
      }
    };
    void loadUsers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        q: searchInput.trim()
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filtersActive = Boolean(filters.authorId || filters.q);

  useEffect(() => {
    let active = true;
    const loadRemarks = async () => {
      if (!taskId) return;
      setLoadingList(true);
      try {
        const data = await tasksApi.getRemarks(taskId, {
          authorId: filters.authorId || undefined,
          q: filters.q || undefined
        });
        if (!active) return;
        setRemarks(data ?? []);
      } catch {
        if (!active) return;
        setRemarks([]);
      } finally {
        if (active) setLoadingList(false);
      }
    };
    void loadRemarks();
    return () => {
      active = false;
    };
  }, [taskId, filters.authorId, filters.q]);

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      if (!taskId) return;
      try {
        const data = await tasksApi.getRemarks(taskId);
        if (!active) return;
        const latest = data?.[0];
        setLatestRemarkId(latest ? String(latest.id ?? latest._id ?? "") : "");
      } catch {
        if (!active) return;
      }
    };
    void loadAll();
    return () => {
      active = false;
    };
  }, [taskId, refreshKey]);

  const authorOptions = useMemo(
    () =>
      users
        .map((user) => ({
          value: String(user.id ?? user._id ?? ""),
          label: user.name || user.email
        }))
        .filter((option) => option.value && option.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [users]
  );

  const handleAddRemark = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await tasksApi.addRemark(taskId, text.trim());
      const newRemarkId = String(response?.id ?? response?._id ?? "");
      setLatestRemarkId(newRemarkId);
      if (!filtersActive) {
        const newRemark: Remark = {
          id: response?.id ?? response?._id,
          text: text.trim(),
          createdAt: response?.createdAt ?? new Date().toISOString(),
          author: profile.id,
          authorName: profile.name
        };
        setRemarks((prev) => [newRemark, ...prev]);
      }
      setText("");
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      // keep silent for now
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (remark: Remark) => {
    const remarkId = String(remark.id ?? remark._id ?? "");
    if (!remarkId) return;
    setEditingId(remarkId);
    setEditingText(remark.text ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingText.trim()) return;
    setLoading(true);
    try {
      const response = await tasksApi.updateRemark(taskId, editingId, editingText.trim());
      setRemarks((prev) =>
        prev.map((item) => {
          const id = String(item.id ?? item._id ?? "");
          if (id !== editingId) return item;
          return { ...item, text: response?.text ?? editingText.trim() };
        })
      );
      setEditingId(null);
      setEditingText("");
    } catch (err) {
      // keep silent for now
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (remarkId: string) => {
    if (!remarkId) return;
    setDeletingId(remarkId);
    try {
      await tasksApi.deleteRemark(taskId, remarkId);
      setRemarks((prev) =>
        prev.filter((item) => String(item.id ?? item._id ?? "") !== remarkId)
      );
      if (editingId === remarkId) {
        setEditingId(null);
        setEditingText("");
      }
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      // keep silent for now
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-[110px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary outline-none"
          placeholder="Add executive remark..."
        />
        <button
          type="button"
          disabled={loading}
          onClick={handleAddRemark}
          className="mt-2 rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-black"
        >
          {loading ? "Saving..." : "Add Remark"}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.authorId || undefined}
          onChange={(value) =>
            setFilters((prev) => ({ ...prev, authorId: value ? String(value) : "" }))
          }
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Filter by author"
          options={authorOptions}
          className="min-w-[220px]"
        />
        <Input.Search
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          allowClear
          placeholder="Search remark text"
          className="min-w-[220px] flex-1"
        />
      </div>
      <div className="space-y-3">
        {loadingList ? (
          <p className="text-sm text-text-muted">Loading remarks...</p>
        ) : remarks.length ? (
          remarks.map((remark) => {
            const authorId = remark.author || remark.createdBy;
            const isCurrentUser = authorId && profile.id === authorId;
            const authorName =
              remark.authorName ||
              (isCurrentUser ? profile.name || "You" : undefined) ||
              (authorId ? "Executive Staff" : "Unknown");
            const remarkId = String(remark.id ?? remark._id ?? "");
            const isLatest = remarkId && remarkId === latestRemarkId;
            return (
              <div
                key={remark.id ?? remark._id ?? remark.createdAt ?? remark.text}
                className="rounded-xl border border-border-subtle bg-surface-muted p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                  <span className="font-semibold text-text-primary">{authorName}</span>
                  <span>{formatDateTime(remark.createdAt)}</span>
                </div>
                {editingId === remarkId ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      className="min-h-[90px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleSaveEdit}
                        className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-black"
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingText("");
                        }}
                        className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <p className="text-sm text-text-primary">{remark.text}</p>
                      {isLatest ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(remark)}
                            className="rounded-full border border-border-subtle px-3 py-1 text-[11px] text-text-primary"
                          >
                            Edit
                          </button>
                          <Popconfirm
                            title="Delete this remark?"
                            description="This action cannot be undone."
                            okText="Delete"
                            okType="danger"
                            cancelText="Cancel"
                            onConfirm={() => handleDelete(remarkId)}
                            disabled={deletingId === remarkId}
                          >
                            <button
                              type="button"
                              disabled={deletingId === remarkId}
                              className="rounded-full border border-border-subtle px-3 py-1 text-[11px] text-rose-300 disabled:opacity-60"
                            >
                              {deletingId === remarkId ? "Deleting..." : "Delete"}
                            </button>
                          </Popconfirm>
                        </div>
                      ) : null}
                    </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-text-muted">No remarks yet.</p>
        )}
      </div>
    </div>
  );
}
