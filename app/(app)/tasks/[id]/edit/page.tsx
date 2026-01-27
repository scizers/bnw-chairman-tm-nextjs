import TaskEditClient from "@/components/tasks/TaskEditClient";

interface TaskEditPageProps {
  params: { id: string };
}

export default function TaskEditPage({ params }: TaskEditPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Editor</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Edit Task</h2>
        <p className="mt-2 text-sm text-text-muted">
          Update assignments, status, and timelines.
        </p>
      </div>

      <TaskEditClient taskId={params.id} />
    </div>
  );
}
