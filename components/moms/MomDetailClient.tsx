"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import { momsApi } from "@/lib/api";
import type { Mom, MomAttachment, MomAttachmentKind } from "@/types/mom";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";

interface MomDetailClientProps {
  momId: string;
}

export default function MomDetailClient({ momId }: MomDetailClientProps) {
  const router = useRouter();
  const [mom, setMom] = useState<Mom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<MomAttachment | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await momsApi.getById(momId);
      setMom(data ?? null);
    } catch (err) {
      setError("Unable to load MOM details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [momId]);

  const handleDelete = async () => {
    if (!confirm("Delete this MOM?")) return;
    setDeleting(true);
    try {
      await momsApi.remove(momId);
      router.push("/moms");
    } catch (err) {
      setError("Failed to delete MOM.");
    } finally {
      setDeleting(false);
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
    return <ErrorState title="MOM unavailable" description={error} onRetry={load} />;
  }

  if (!mom) {
    return <ErrorState title="MOM not found" description="Return to the list." />;
  }

  const id = mom.id ?? mom._id ?? momId;
  const attachments = mom.attachments || [];

  const resolveKind = (item: MomAttachment): MomAttachmentKind => {
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

  const resolveName = (item: MomAttachment, index?: number) =>
    item.fileName ||
    item.fileUrl.split("?")[0].split("/").pop() ||
    `Attachment ${typeof index === "number" ? index + 1 : ""}`.trim();

  const iconForKind = (kind: MomAttachmentKind) => {
    if (kind === "image") return FileImage;
    if (kind === "pdf") return FileText;
    if (kind === "excel") return FileSpreadsheet;
    if (kind === "word") return FileText;
    return File;
  };

  const renderPreview = (item: MomAttachment, kind: MomAttachmentKind, name: string) => {
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

  const handleRemoveAttachment = async (item: MomAttachment) => {
    if (!item.fileUrl) return;
    if (!confirm("Remove this attachment?")) return;
    setRemoving(item.fileUrl);
    try {
      const next = attachments.filter((entry) => entry.fileUrl !== item.fileUrl);
      const updated = await momsApi.update(id, { attachments: next });
      setMom(updated ?? null);
      if (preview?.fileUrl === item.fileUrl) {
        setPreview(null);
      }
    } catch {
      setError("Failed to remove attachment.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">MOM</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">{mom.title}</h2>
          <p className="mt-2 text-sm text-text-muted">
            {mom.meetingDate ? formatDate(mom.meetingDate) : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/moms/${id}/edit`}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-500/40 px-4 py-2 text-xs text-red-300 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Notes</p>
          <p className="mt-3 whitespace-pre-line text-sm text-text-primary">{mom.rawNotes}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Attendees</p>
            {mom.attendees?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-text-primary">
                {mom.attendees.map((person) => (
                  <li key={person}>• {person}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No attendees listed.</p>
            )}
          </div>

          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Attachments</p>
            {attachments.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {attachments.map((item, index) => {
                  const kind = resolveKind(item);
                  const name = resolveName(item, index);
                  const Icon = iconForKind(kind);
                  const thumbUrl = item.thumbnailUrl || (kind === "image" ? item.fileUrl : "");
                  return (
                    <button
                      key={`${item.fileUrl}-${index}`}
                      type="button"
                      onClick={() => setPreview(item)}
                      className="group relative flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-muted/60 p-3 text-left transition hover:border-border-strong"
                      aria-label={`Preview ${name}`}
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-black/30">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Icon className="h-7 w-7 text-text-muted" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-text-primary">{name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                          {kind === "other" ? "file" : kind}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-border-subtle px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                          View
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRemoveAttachment(item);
                          }}
                          disabled={removing === item.fileUrl}
                          className="rounded-full border border-red-500/40 p-2 text-red-300 disabled:opacity-60"
                          aria-label={`Remove ${name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No attachments added.</p>
            )}
          </div>

          <div className="rounded-xl bg-surface-card p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">AI Summary</p>
            {mom.aiSummary ? (
              <p className="mt-3 text-sm text-text-primary">{mom.aiSummary}</p>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No AI summary yet.</p>
            )}
            {mom.aiExtractedAt ? (
              <p className="mt-2 text-xs text-text-muted">
                Extracted {formatDate(mom.aiExtractedAt)}
              </p>
            ) : null}
          </div>
        </div>
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
