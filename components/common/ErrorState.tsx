"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorState({
  title,
  description,
  onRetry
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
      <AlertTriangle className="mx-auto mb-3 text-rose-300" size={26} />
      <p className="text-sm font-semibold text-rose-100">{title}</p>
      {description ? <p className="mt-1 text-xs text-rose-200/80">{description}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-rose-300/40 px-4 py-2 text-xs text-rose-100"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
