export interface AuditLog {
  id?: string;
  _id?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  entity?: {
    type?: string;
    id?: string;
    title?: string;
    text?: string;
    remarkType?: string;
    audioUrl?: string;
    audioDurationSec?: number;
    taskId?: string;
    taskTitle?: string;
    meetingDate?: string;
  };
  performedBy?:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
        email?: string;
      };
  timestamp?: string;
  createdAt?: string;
  previousValue?: unknown;
  newValue?: unknown;
  details?: Record<string, unknown>;
}
