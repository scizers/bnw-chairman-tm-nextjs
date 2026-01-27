import clsx from "clsx";

interface StatusBadgeProps {
  label: string;
}

const toneMap: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-300",
  in_progress: "bg-sky-500/20 text-sky-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  overdue: "bg-rose-500/20 text-rose-300",
  critical: "bg-red-500/25 text-red-200",
  blocked: "bg-purple-500/20 text-purple-200",
  high: "bg-amber-500/20 text-amber-300",
  medium: "bg-sky-500/20 text-sky-300",
  low: "bg-emerald-500/20 text-emerald-300",
  normal: "bg-sky-500/20 text-sky-300"
};

export default function StatusBadge({ label }: StatusBadgeProps) {
  const tone = toneMap[label.toLowerCase()] ?? "bg-white/10 text-text-muted";
  return (
    <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tone)}>
      {label.replace(/_/g, " ")}
    </span>
  );
}
