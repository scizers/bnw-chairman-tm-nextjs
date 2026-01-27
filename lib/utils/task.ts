import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";

export const resolveTeamMemberId = (member: TeamMember) =>
  member.id ?? member._id ?? "";

export const normalizeTasks = (tasks: Task[]) =>
  tasks.map((task) => ({
    ...task,
    id: task.id ?? task._id
  }));

export const attachAssigneeNames = (tasks: Task[], teamMembers: TeamMember[]) => {
  const teamMap = new Map(
    teamMembers.map((member) => [resolveTeamMemberId(member), member.name])
  );

  return tasks.map((task) => ({
    ...task,
    id: task.id ?? task._id,
    assignedToName: task.assignedToName ?? teamMap.get(task.assignedTo || "")
  }));
};
