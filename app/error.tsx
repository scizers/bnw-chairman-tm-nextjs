"use client";

import ErrorState from "@/components/common/ErrorState";

export default function AppError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Something went wrong"
      description={error.message}
      onRetry={reset}
    />
  );
}
