import AgentTabsClient from "@/components/team/AgentTabsClient";
import AgentTaskDistribution from "@/components/charts/AgentTaskDistribution";
import KpiCard from "@/components/common/KpiCard";
import EmptyState from "@/components/common/EmptyState";
import { serverTeamMembersApi, serverTasksApi } from "@/lib/api/server";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import { formatRelative } from "@/lib/utils/format";

interface AgentProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentProfilePage({ params }: AgentProfilePageProps) {
  const { id } = await params;
  let member: TeamMember | undefined;
  let tasks: Task[] = [];

  try {
    const teamMembers = await serverTeamMembersApi.list();
    member = teamMembers.find((item) => item.id === id);
    tasks = await serverTasksApi.listByTeamMember(id);
  } catch (error) {
    member = undefined;
    tasks = [];
  }

  if (!member) {
    return (
      <EmptyState
        title="Agent not found"
        description="Return to the team list to locate another profile."
      />
    );
  }

  const openCount = tasks.filter((task) => task.status === "open").length;
  const overdueCount = tasks.filter((task) => task.status === "overdue").length;
  const inProgressCount = tasks.filter((task) => task.status === "in_progress").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  const distribution = [
    { label: "Open", count: openCount },
    { label: "In Progress", count: inProgressCount },
    { label: "Overdue", count: overdueCount },
    { label: "Completed", count: completedCount }
  ];

  const lastRemarkActivity = tasks
    .map((task) => task.updatedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Agent Profile</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">{member.name}</h2>
        <p className="mt-2 text-sm text-text-muted">
          {member.designation || "Team Member"} · {member.department || "Department"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Open Tasks" value={openCount} />
        <KpiCard title="Overdue" value={overdueCount} />
        <KpiCard title="In Progress" value={inProgressCount} />
        <KpiCard title="Completed" value={completedCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <h3 className="font-display text-lg text-text-primary">Task Distribution</h3>
          <AgentTaskDistribution data={distribution} />
          <div className="mt-4 rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-muted">
            Last Remark Activity: {lastRemarkActivity ? formatRelative(lastRemarkActivity) : "No remarks yet"}
          </div>
        </div>

        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <h3 className="font-display text-lg text-text-primary">Assignments Overview</h3>
          <p className="mt-2 text-sm text-text-muted">
            Keep tabs on pending and overdue work for this agent.
          </p>
          <div className="mt-4 space-y-3 text-sm text-text-primary">
            <div className="flex items-center justify-between">
              <span>Pending</span>
              <span className="text-text-muted">{openCount + inProgressCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Overdue</span>
              <span className="text-text-muted">{overdueCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Completion Rate</span>
              <span className="text-text-muted">
                {tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <AgentTabsClient tasks={tasks} />
    </div>
  );
}
