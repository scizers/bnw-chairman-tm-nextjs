"use client";

import { useParams } from "next/navigation";
import TaskDetailClient from "@/components/tasks/TaskDetailClient";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return <TaskDetailClient taskId={id} />;
}
