"use client";

import { useMemo } from "react";
import { Select, Upload } from "antd";
import type { UploadFile, UploadRequestOption } from "antd/es/upload/interface";
import type { Mom } from "@/types/mom";
import { momsApi } from "@/lib/api";

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
  attendees: string[];
  rawNotes: string;
  attachments: UploadFile[];
}

export const buildMomPayload = (state: MomFormState): Partial<Mom> => ({
  title: state.title.trim(),
  meetingDate: state.meetingDate ? new Date(state.meetingDate).toISOString() : undefined,
  attendees: state.attendees.map((entry) => entry.trim()).filter(Boolean),
  rawNotes: state.rawNotes.trim(),
  attachments: state.attachments
    .map((file) => file.url || file.thumbUrl || null)
    .filter((fileUrl): fileUrl is string => Boolean(fileUrl))
    .map((fileUrl) => ({ fileUrl })),
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

  const handleUpload = async (options: UploadRequestOption) => {
    const { file, onError, onSuccess, onProgress } = options;
    const uploadFile = file as File;
    const temp: UploadFile = {
      uid: `${Date.now()}-${uploadFile.name}`,
      name: uploadFile.name,
      status: "uploading",
    };
    onChange({ ...value, attachments: [...value.attachments, temp] });

    try {
      const result = await momsApi.uploadAttachment(uploadFile, (percent) => {
        onProgress?.({ percent });
      });
      const updated: UploadFile = {
        ...temp,
        status: "done",
        url: result.url,
      };
      onChange({
        ...value,
        attachments: [...value.attachments.filter((item) => item.uid !== temp.uid), updated],
      });
      onSuccess?.(result, new XMLHttpRequest());
    } catch (err) {
      onChange({
        ...value,
        attachments: value.attachments.filter((item) => item.uid !== temp.uid),
      });
      onError?.(err as Error);
    }
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
          <Select
            mode="tags"
            value={value.attendees}
            onChange={(next) => onChange({ ...value, attendees: next })}
            placeholder="Add names"
            className="mt-2 w-full"
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
          <Upload
            listType="text"
            customRequest={handleUpload}
            fileList={value.attachments}
            onRemove={(file) =>
              onChange({
                ...value,
                attachments: value.attachments.filter((item) => item.uid !== file.uid),
              })
            }
          >
            <button
              type="button"
              className="mt-2 rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
            >
              Upload files
            </button>
          </Upload>
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
