export interface DepartmentSummary {
  id?: string;
  _id?: string;
  department: string;
  memberCount: number;
  taskCount: number;
  openTasks: number;
  overdueTasks: number;
}

export interface Department {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  headUserId?: string;
  createdAt?: string;
}
