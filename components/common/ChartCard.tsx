import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, actions, children }: ChartCardProps) {
  return (
    <div className="rounded-xl bg-surface-card p-6 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-text-primary">{title}</h3>
          {subtitle ? <p className="text-sm text-text-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
