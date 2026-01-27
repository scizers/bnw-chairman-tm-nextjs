export type TaskStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "overdue"
  | "blocked"
  | "critical"
  | string;

export type TaskPriority = "low" | "medium" | "high" | "critical" | string;

export interface Task {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  updatedAt?: string;
  createdAt?: string;
  lastRemarkAt?: string;
  lastRemark?: string;
  attachments?: string[];
}
