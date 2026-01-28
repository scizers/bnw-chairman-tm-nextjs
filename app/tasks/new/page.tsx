import TaskCreateClient from "@/components/tasks/TaskCreateClient";

export default function TaskCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Create Task</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">New Task</h2>
        <p className="mt-2 text-sm text-text-muted">
          Assign ownership and set a clear due date for execution.
        </p>
      </div>

      <TaskCreateClient />
    </div>
  );
}
