"use client";

import { useMemo } from "react";
import type { Mom } from "@/types/mom";

interface MomFormProps {
  value: MomFormState;
  onChange: (next: MomFormState) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export interface MomFormState {
  title: string;
  meetingDate: string;
  attendees: string;
  rawNotes: string;
  attachments: string;
  aiSummary: string;
  aiExtractedAt: string;
}

const splitLines = (value: string) =>
  value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export const buildMomPayload = (state: MomFormState): Partial<Mom> => ({
  title: state.title.trim(),
  meetingDate: state.meetingDate ? new Date(state.meetingDate).toISOString() : undefined,
  attendees: splitLines(state.attendees),
  rawNotes: state.rawNotes.trim(),
  attachments: splitLines(state.attachments).map((fileUrl) => ({ fileUrl })),
  aiSummary: state.aiSummary.trim() || undefined,
  aiExtractedAt: state.aiExtractedAt ? new Date(state.aiExtractedAt).toISOString() : undefined,
});

export default function MomForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  loading,
}: MomFormProps) {
  const canSubmit = useMemo(() => {
    return value.title.trim() && value.meetingDate && value.rawNotes.trim();
  }, [value]);

  const handleChange = (key: keyof MomFormState, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <div className="rounded-xl bg-surface-card p-6 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Title</label>
          <input
            value={value.title}
            onChange={(event) => handleChange("title", event.target.value)}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Meeting Date</label>
          <input
            type="date"
            value={value.meetingDate}
            onChange={(event) => handleChange("meetingDate", event.target.value)}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Attendees</label>
          <textarea
            value={value.attendees}
            onChange={(event) => handleChange("attendees", event.target.value)}
            className="mt-2 min-h-[90px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary"
            placeholder="Add names, one per line or comma separated"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Raw Notes</label>
          <textarea
            value={value.rawNotes}
            onChange={(event) => handleChange("rawNotes", event.target.value)}
            className="mt-2 min-h-[160px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary"
            placeholder="Paste meeting notes"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Attachments</label>
          <textarea
            value={value.attachments}
            onChange={(event) => handleChange("attachments", event.target.value)}
            className="mt-2 min-h-[90px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary"
            placeholder="Paste file URLs, one per line"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">AI Summary</label>
          <textarea
            value={value.aiSummary}
            onChange={(event) => handleChange("aiSummary", event.target.value)}
            className="mt-2 min-h-[90px] w-full rounded-xl border border-border-subtle bg-surface-muted p-3 text-sm text-text-primary"
            placeholder="Optional summary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">AI Extracted At</label>
          <input
            type="date"
            value={value.aiExtractedAt}
            onChange={(event) => handleChange("aiExtractedAt", event.target.value)}
            className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-primary"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          disabled={!canSubmit || loading}
          onClick={onSubmit}
          className="rounded-full bg-brand-primary px-5 py-2 text-xs font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
