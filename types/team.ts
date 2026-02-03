export interface TeamMember {
  id?: string;
  _id?: string;
  name: string;
  designation?: string;
  department?: string;
  departmentId?: string | { _id?: string; id?: string };
  email?: string;
  isActive?: boolean;
  openTasks?: number;
  overdueTasks?: number;
}
