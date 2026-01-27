export default function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 w-full rounded-full bg-white/10"
        />
      ))}
    </div>
  );
}
