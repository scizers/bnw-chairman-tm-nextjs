export interface AuditLog {
  id?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  performedBy?: string;
  createdAt?: string;
  details?: Record<string, unknown>;
}
