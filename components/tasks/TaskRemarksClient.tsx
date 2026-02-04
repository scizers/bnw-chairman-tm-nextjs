"use client";

import { useEffect, useState } from "react";
import { tasksApi } from "@/lib/api";
import type { Remark } from "@/types/remark";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [profile, setProfile] = useState<{ id?: string; name?: string }>({});

  useEffect(() => {
    setProfile(getAuthProfile());
  }, []);

  const handleAddRemark = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await tasksApi.addRemark(taskId, text.trim());
      const newRemark: Remark = {
        id: response?.id ?? response?._id,
        text: text.trim(),
        createdAt: response?.createdAt ?? new Date().toISOString(),
        author: profile.id,
        authorName: profile.name
      };
      setRemarks((prev) => [newRemark, ...prev]);
      setText("");
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
      <div className="space-y-3">
        {remarks.length ? (
          remarks.map((remark, index) => {
            const authorId = remark.author || remark.createdBy;
            const isCurrentUser = authorId && profile.id === authorId;
            const authorName =
              remark.authorName ||
              (isCurrentUser ? profile.name || "You" : undefined) ||
              (authorId ? "Executive Staff" : "Unknown");
            const isLatest = index === 0;
            const remarkId = String(remark.id ?? remark._id ?? "");
            return (
              <div
                key={remark.id ?? remark._id ?? index}
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
                      <button
                        type="button"
                        onClick={() => handleEdit(remark)}
                        className="rounded-full border border-border-subtle px-3 py-1 text-[11px] text-text-primary"
                      >
                        Edit
                      </button>
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
