export interface AuditLog {
  id?: string;
  _id?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
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
