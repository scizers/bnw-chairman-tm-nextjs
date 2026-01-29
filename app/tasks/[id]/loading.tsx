import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function TaskDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={3} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={8} />
        </div>
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    </div>
  );
}
