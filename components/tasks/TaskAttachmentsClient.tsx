"use client";

import { useState } from "react";
import { Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  Download,
  Eye,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  X
} from "lucide-react";
import { tasksApi } from "@/lib/api";
import type { TaskAttachment, TaskAttachmentKind } from "@/types/task";

interface TaskAttachmentsClientProps {
  taskId: string;
  initialAttachments?: Array<TaskAttachment | string>;
}

type UploadRequestOption = Parameters<NonNullable<UploadProps["customRequest"]>>[0];

export default function TaskAttachmentsClient({
  taskId,
  initialAttachments = []
}: TaskAttachmentsClientProps) {
  const normalizeAttachment = (item: TaskAttachment | string): TaskAttachment | null => {
    if (!item) return null;
    if (typeof item === "string") {
      return item ? { fileUrl: item } : null;
    }
    return item.fileUrl ? item : null;
  };

  const [attachments, setAttachments] = useState<TaskAttachment[]>(
    initialAttachments.map(normalizeAttachment).filter(Boolean) as TaskAttachment[]
  );
  const [fileList, setFileList] = useState<UploadFile[]>(
    (initialAttachments
      .map(normalizeAttachment)
      .filter(Boolean) as TaskAttachment[]).map((attachment, index) => {
      const name =
        attachment.fileName ||
        attachment.fileUrl.split("?")[0].split("/").pop() ||
        `Attachment ${index + 1}`;
      return {
        uid: `${index}-${attachment.fileUrl}`,
        name,
        status: "done",
        url: attachment.fileUrl,
        thumbUrl: attachment.thumbnailUrl || undefined,
        attachmentMeta: attachment
      } as UploadFile & { attachmentMeta?: TaskAttachment };
    })
  );
  const [preview, setPreview] = useState<TaskAttachment | null>(null);

  const handleUpload = async (options: UploadRequestOption) => {
    const { file, onError, onSuccess, onProgress } = options;
    const uploadFile = file as File;
    const temp: UploadFile = {
      uid: `${Date.now()}-${uploadFile.name}`,
      name: uploadFile.name,
      status: "uploading"
    };
    setFileList((prev) => [...prev, temp]);

    try {
      const result = await tasksApi.uploadAttachment(uploadFile, (percent) => {
        onProgress?.({ percent });
      });
      const attachment: TaskAttachment = {
        fileUrl: result.url,
        thumbnailUrl: result.thumbnailUrl || undefined,
        mimeType: result.mimeType,
        fileName: result.originalName || uploadFile.name,
        fileKind: result.fileKind as TaskAttachment["fileKind"]
      };
      await tasksApi.addAttachments(taskId, [attachment]);
      const updated: UploadFile & { attachmentMeta?: TaskAttachment } = {
        ...temp,
        status: "done",
        url: result.url,
        thumbUrl: result.thumbnailUrl || undefined,
        attachmentMeta: attachment
      };
      setFileList((prev) => [
        ...prev.filter((item) => item.uid !== temp.uid),
        updated
      ]);
      setAttachments((prev) => [...prev, attachment]);
      onSuccess?.(result, new XMLHttpRequest());
    } catch (err) {
      setFileList((prev) => prev.filter((item) => item.uid !== temp.uid));
      onError?.(err as Error);
    }
  };

  const resolveKind = (item: TaskAttachment): TaskAttachmentKind => {
    if (item.fileKind) return item.fileKind;
    const mimeType = item.mimeType || "";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    const fileUrl = item.fileUrl || "";
    const extension = fileUrl.split("?")[0].split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff"].includes(extension)) return "image";
    if (extension === "pdf") return "pdf";
    if (["doc", "docx"].includes(extension)) return "word";
    if (["xls", "xlsx", "csv"].includes(extension)) return "excel";
    return "other";
  };

  const resolveName = (item: TaskAttachment, index?: number) => {
    const url = item.fileUrl || "";
    return (
      item.fileName ||
      url.split("?")[0].split("/").pop() ||
      `Attachment ${typeof index === "number" ? index + 1 : ""}`.trim()
    );
  };

  const iconForKind = (kind: TaskAttachmentKind) => {
    if (kind === "image") return FileImage;
    if (kind === "pdf") return FileText;
    if (kind === "excel") return FileSpreadsheet;
    if (kind === "word") return FileText;
    return File;
  };

  const renderPreview = (item: TaskAttachment, kind: TaskAttachmentKind, name: string) => {
    if (kind === "image") {
      return <img src={item.fileUrl} alt={name} className="max-h-[60vh] w-full rounded-xl object-contain" />;
    }
    if (kind === "pdf") {
      return (
        <iframe
          title={name}
          src={item.fileUrl}
          className="h-[60vh] w-full rounded-xl border border-border-subtle bg-black/20"
        />
      );
    }
    return (
      <div className="flex h-[40vh] items-center justify-center rounded-xl border border-border-subtle bg-black/20">
        <p className="text-sm text-text-muted">Preview not available.</p>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-muted p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Attachments</p>
      {attachments.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {attachments.map((item, index) => {
            const kind = resolveKind(item);
            const name = resolveName(item, index);
            const Icon = iconForKind(kind);
            const thumbUrl = item.thumbnailUrl || (kind === "image" ? item.fileUrl : "");
            return (
              <div
                key={`${item.fileUrl || "attachment"}-${index}`}
                className="group relative flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-card p-3"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-black/30">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon className="h-7 w-7 text-text-muted" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreview(item)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Preview ${name}`}
                  >
                    <Eye className="h-5 w-5 text-white" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-text-primary">{name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                    {kind === "other" ? "file" : kind}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-xs text-text-muted">No attachments yet.</p>
      )}

      <div className="mt-4">
        <Upload listType="text" customRequest={handleUpload} fileList={fileList} showUploadList={false}>
          <button
            type="button"
            className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
          >
            Upload files
          </button>
        </Upload>
      </div>

      {preview ? (() => {
        const kind = resolveKind(preview);
        const name = resolveName(preview);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setPreview(null)}
              aria-label="Close preview"
            />
            <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Attachment</p>
                  <h3 className="mt-1 text-lg text-text-primary">{name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-full border border-border-subtle p-2 text-text-muted hover:text-text-primary"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4">{renderPreview(preview, kind, name)}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={preview.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
                <a
                  href={preview.fileUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-black"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}
