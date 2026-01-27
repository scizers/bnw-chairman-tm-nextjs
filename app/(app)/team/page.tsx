import TeamTableClient from "@/components/team/TeamTableClient";
import EmptyState from "@/components/common/EmptyState";
import { serverTeamMembersApi, serverTasksApi } from "@/lib/api/server";
import type { TeamMember } from "@/types/team";
import type { Task } from "@/types/task";

export default async function TeamPage() {
  let teamMembers: TeamMember[] = [];
  let tasks: Task[] = [];

  try {
    [teamMembers, tasks] = await Promise.all([
      serverTeamMembersApi.list(),
      serverTasksApi.list()
    ]);
  } catch (error) {
    teamMembers = [];
    tasks = [];
  }

  const teamWithCounts = teamMembers.map((member) => {
    const assigned = tasks.filter((task) => task.assignedTo === member.id);
    const openTasks = assigned.filter((task) =>
      ["open", "in_progress"].includes(task.status)
    ).length;
    const overdueTasks = assigned.filter(
      (task) => task.status === "overdue"
    ).length;

    return {
      ...member,
      openTasks: member.openTasks ?? openTasks,
      overdueTasks: member.overdueTasks ?? overdueTasks
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">People</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Team</h2>
        <p className="mt-2 text-sm text-text-muted">
          Track workload and performance across the executive support team.
        </p>
      </div>

      {teamWithCounts.length ? (
        <TeamTableClient teamMembers={teamWithCounts} />
      ) : (
        <EmptyState title="No team members" description="Add team members to monitor tasks." />
      )}
    </div>
  );
}
