"use client";

import { useState } from "react";
import { tasksApi } from "@/lib/api";

interface TaskAttachmentsClientProps {
  taskId: string;
  initialAttachments?: string[];
}

export default function TaskAttachmentsClient({
  taskId,
  initialAttachments = []
}: TaskAttachmentsClientProps) {
  const [attachments, setAttachments] = useState<string[]>(initialAttachments);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await tasksApi.addAttachments(taskId, [url.trim()]);
      setAttachments((prev) => [...prev, url.trim()]);
      setUrl("");
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-muted p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Attachments</p>
      <div className="mt-3 space-y-2 text-sm text-text-primary">
        {attachments.length ? (
          attachments.map((link, index) => (
            <a key={`${link}-${index}`} href={link} className="block truncate text-brand-primary hover:underline">
              {link}
            </a>
          ))
        ) : (
          <p className="text-xs text-text-muted">No attachments yet.</p>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste attachment URL"
          className="flex-1 rounded-xl border border-border-subtle bg-surface-card px-3 py-2 text-xs text-text-primary"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading}
          className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-black"
        >
          {loading ? "Uploading..." : "Add"}
        </button>
      </div>
    </div>
  );
}
