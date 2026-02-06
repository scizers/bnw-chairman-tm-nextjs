export type TaskStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "overdue"
  | "blocked"
  | "critical"
  | string;

export type TaskPriority = "low" | "normal" | "medium" | "high" | "critical" | string;

export type TaskAttachmentKind = "image" | "pdf" | "word" | "excel" | "other";

export interface TaskAttachment {
  fileUrl: string;
  thumbnailUrl?: string;
  mimeType?: string;
  fileName?: string;
  fileKind?: TaskAttachmentKind;
  uploadedAt?: string;
}

export interface Task {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdBy?: string | { _id?: string; id?: string; name?: string };
  createdByName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  updatedAt?: string;
  createdAt?: string;
  lastRemarkAt?: string;
  lastRemark?: string;
  archivedAt?: string | null;
  attachments?: Array<TaskAttachment | string>;
}
