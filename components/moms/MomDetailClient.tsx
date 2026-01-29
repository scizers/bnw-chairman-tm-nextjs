"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { momsApi } from "@/lib/api";
import type { Mom } from "@/types/mom";
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
            {mom.attachments?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-text-primary">
                {mom.attachments.map((item) => (
                  <li key={item.fileUrl}>
                    <a href={item.fileUrl} className="text-brand-primary" target="_blank">
                      {item.fileUrl}
                    </a>
                  </li>
                ))}
              </ul>
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
    </div>
  );
}
