import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";

export const mockTeamMembers: TeamMember[] = [
  {
    id: "tm-1",
    name: "Kabir Malhotra",
    designation: "Project Manager",
    department: "PMO",
    openTasks: 6,
    overdueTasks: 1
  },
  {
    id: "tm-2",
    name: "Elena Graves",
    designation: "Executive Assistant",
    department: "Chairman Office",
    openTasks: 4,
    overdueTasks: 0
  },
  {
    id: "tm-3",
    name: "Andre Collins",
    designation: "Operations Lead",
    department: "Operations",
    openTasks: 7,
    overdueTasks: 2
  }
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Board Update Draft",
    description: "Compile key metrics for board update.",
    assignedTo: "tm-1",
    assignedToName: "Kabir Malhotra",
    status: "open",
    priority: "high",
    dueDate: "2026-01-30T00:00:00.000Z",
    updatedAt: "2026-01-24T12:00:00.000Z",
    lastRemark: "Waiting on finance metrics."
  },
  {
    id: "task-2",
    title: "Investor Briefing Deck",
    description: "Refine deck visuals and narrative.",
    assignedTo: "tm-2",
    assignedToName: "Elena Graves",
    status: "in_progress",
    priority: "critical",
    dueDate: "2026-01-28T00:00:00.000Z",
    updatedAt: "2026-01-26T09:30:00.000Z",
    lastRemark: "Draft v3 under review."
  },
  {
    id: "task-3",
    title: "Operations Risk Memo",
    description: "Summarize Q1 operational risks.",
    assignedTo: "tm-3",
    assignedToName: "Andre Collins",
    status: "overdue",
    priority: "high",
    dueDate: "2026-01-20T00:00:00.000Z",
    updatedAt: "2026-01-18T10:00:00.000Z",
    lastRemark: "Awaiting legal input."
  },
  {
    id: "task-4",
    title: "Executive Calendar Sync",
    description: "Finalize February calendar.",
    assignedTo: "tm-2",
    assignedToName: "Elena Graves",
    status: "completed",
    priority: "medium",
    dueDate: "2026-01-22T00:00:00.000Z",
    updatedAt: "2026-01-23T11:00:00.000Z",
    lastRemark: "Calendar confirmed."
  },
  {
    id: "task-5",
    title: "Supplier Renewal Review",
    description: "Review renewal terms with procurement.",
    assignedTo: "tm-3",
    assignedToName: "Andre Collins",
    status: "open",
    priority: "medium",
    dueDate: "2026-02-05T00:00:00.000Z",
    updatedAt: "2026-01-19T08:00:00.000Z",
    lastRemark: "Collecting updated pricing."
  }
];
