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

  return (
    <div className="rounded-xl bg-surface-card p-6 shadow-card">
      <h3 className="font-display text-lg text-text-primary">Remarks Timeline</h3>
      <div className="mt-4 space-y-4">
        {remarks.length ? (
          remarks.map((remark, index) => {
            const authorId = remark.author || remark.createdBy;
            const isCurrentUser = authorId && profile.id === authorId;
            const authorName =
              remark.authorName ||
              (isCurrentUser ? profile.name || "You" : undefined) ||
              (authorId ? "Executive Staff" : "Unknown");
            return (
              <div
                key={remark.id ?? remark._id ?? index}
                className="rounded-xl border border-border-subtle bg-surface-muted p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                  <span className="font-semibold text-text-primary">{authorName}</span>
                  <span>{formatDateTime(remark.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm text-text-primary">{remark.text}</p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-text-muted">No remarks yet.</p>
        )}
      </div>
      <div className="mt-6">
        <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Add Remark</label>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="mt-2 min-h-[120px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary outline-none"
          placeholder="Add executive remark..."
        />
        <button
          type="button"
          disabled={loading}
          onClick={handleAddRemark}
          className="mt-3 rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-black"
        >
          {loading ? "Saving..." : "Add Remark"}
        </button>
      </div>
    </div>
  );
}
