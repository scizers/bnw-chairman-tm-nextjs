"use client";

import { useParams } from "next/navigation";
import TaskEditClient from "@/components/tasks/TaskEditClient";

export default function TaskEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Task Editor</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Edit Task</h2>
        <p className="mt-2 text-sm text-text-muted">
          Update assignments, status, and timelines.
        </p>
      </div>

      <TaskEditClient taskId={id} />
    </div>
  );
}
