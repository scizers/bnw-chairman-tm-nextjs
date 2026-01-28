import TasksPageClient from "@/components/tasks/TasksPageClient";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Center</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Tasks</h2>
        <p className="mt-2 text-sm text-text-muted">
          Review, prioritize, and act on your executive task inventory.
        </p>
      </div>

      <TasksPageClient />
    </div>
  );
}
