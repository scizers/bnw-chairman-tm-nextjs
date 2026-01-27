import { Inbox } from "lucide-react";

export default function EmptyState({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center">
      <Inbox className="mx-auto mb-3 text-text-muted" size={28} />
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description ? <p className="mt-1 text-xs text-text-muted">{description}</p> : null}
    </div>
  );
}
