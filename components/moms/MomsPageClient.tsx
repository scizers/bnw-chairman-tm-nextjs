"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { momsApi } from "@/lib/api";
import type { Mom } from "@/types/mom";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";

export default function MomsPageClient() {
  const [moms, setMoms] = useState<Mom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await momsApi.list();
      setMoms(data ?? []);
    } catch (err) {
      setError("Unable to load MOMs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="MOM feed unavailable" description={error} onRetry={load} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{moms.length} meetings logged</p>
        <Link
          href="/moms/new"
          className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-black"
        >
          Add MOM
        </Link>
      </div>

      {moms.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface-card p-8 text-center text-sm text-text-muted">
          No MOMs yet. Create the first meeting summary.
        </div>
      ) : (
        <div className="grid gap-4">
          {moms.map((mom) => {
            const id = mom.id ?? mom._id ?? "";
            return (
              <div key={id} className="rounded-xl bg-surface-card p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Meeting</p>
                    <h3 className="mt-2 text-lg font-semibold text-text-primary">{mom.title}</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {mom.meetingDate ? formatDate(mom.meetingDate) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/moms/${id}`}
                      className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-primary"
                    >
                      View
                    </Link>
                    <Link
                      href={`/moms/${id}/edit`}
                      className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-primary"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
                <p className="mt-3 text-sm text-text-muted line-clamp-3">{mom.rawNotes}</p>
                {mom.attendees?.length ? (
                  <p className="mt-3 text-xs text-text-muted">
                    Attendees: {mom.attendees.join(", ")}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
