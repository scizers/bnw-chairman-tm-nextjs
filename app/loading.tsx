import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton lines={2} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-surface-card p-6 shadow-card">
            <LoadingSkeleton lines={3} />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    </div>
  );
}
