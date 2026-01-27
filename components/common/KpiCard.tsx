import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import clsx from "clsx";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  hint?: string;
}

export default function KpiCard({ title, value, trend, hint }: KpiCardProps) {
  const trendPositive = typeof trend === "number" && trend >= 0;

  return (
    <div className="rounded-xl bg-surface-card p-5 shadow-card">
      <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{title}</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="font-display text-3xl text-text-primary">{value}</p>
          {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
        </div>
        {typeof trend === "number" ? (
          <div
            className={clsx(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              trendPositive
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            )}
          >
            {trendPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        ) : null}
      </div>
    </div>
  );
}
