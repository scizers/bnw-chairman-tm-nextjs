import ChartCard from "@/components/common/ChartCard";
import KpiCard from "@/components/common/KpiCard";
import UrgentTasksTableClient from "@/components/dashboard/UrgentTasksTableClient";
import PendingLoadTableClient from "@/components/dashboard/PendingLoadTableClient";
import TasksStatusChart from "@/components/charts/TasksStatusChart";
import TasksPriorityDonut from "@/components/charts/TasksPriorityDonut";
import EmptyState from "@/components/common/EmptyState";
import { serverTasksApi, serverTeamMembersApi } from "@/lib/api/server";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import { attachAssigneeNames, normalizeTasks } from "@/lib/utils/task";

const daysBetween = (start: Date, end: Date) =>
  Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

export default async function DashboardPage() {
  let tasks: Task[] = [];
  let team: TeamMember[] = [];

  try {
    const [taskData, teamData] = await Promise.all([
      serverTasksApi.list(),
      serverTeamMembersApi.list()
    ]);
    team = teamData ?? [];
    tasks = attachAssigneeNames(normalizeTasks(taskData ?? []), team);
  } catch (error) {
    tasks = [];
    team = [];
  }

  const now = new Date();
  const totalOpen = tasks.filter((task) => task.status === "open").length;
  const overdueTasks = tasks.filter((task) => {
    const due = task.dueDate ? new Date(task.dueDate) : null;
    return task.status === "overdue" || (!!due && due < now && task.status !== "completed");
  });
  const criticalTasks = tasks.filter((task) => task.priority === "critical");
  const completedThisWeek = tasks.filter((task) => {
    if (task.status !== "completed" || !task.updatedAt) return false;
    return daysBetween(new Date(task.updatedAt), now) <= 7;
  });
  const staleTasks = tasks.filter((task) => {
    if (!task.updatedAt) return false;
    return daysBetween(new Date(task.updatedAt), now) >= 3;
  });

  const statusCounts = ["open", "in_progress", "overdue", "completed", "critical"].map(
    (status) => ({
      status,
      count: tasks.filter((task) => task.status === status).length
    })
  );

  const priorityCounts = ["low", "medium", "high", "critical"].map((priority) => ({
    priority,
    count: tasks.filter((task) => task.priority === priority).length
  }));

  const urgentTasks = [...tasks]
    .sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      const aOverdue = a.status === "overdue" || aDue < now.getTime();
      const bOverdue = b.status === "overdue" || bDue < now.getTime();
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      return aDue - bDue;
    })
    .slice(0, 5);

  const pendingCounts = team
    .map((member) => {
      const pending = tasks.filter(
        (task) =>
          task.assignedTo === member.id &&
          ["open", "in_progress", "overdue"].includes(task.status)
      ).length;
      return { ...member, pending };
    })
    .sort((a, b) => b.pending - a.pending);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Executive Overview</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Dashboard</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Open Tasks" value={totalOpen} />
        <KpiCard title="Overdue Tasks" value={overdueTasks.length} />
        <KpiCard title="Critical Tasks" value={criticalTasks.length} />
        <KpiCard title="Completed This Week" value={completedThisWeek.length} />
        <KpiCard title="Tasks Not Updated 3+ Days" value={staleTasks.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Tasks by Status" subtitle="Operational load by workflow stage">
          <TasksStatusChart data={statusCounts} />
        </ChartCard>
        <ChartCard title="Tasks by Priority" subtitle="What needs attention first">
          <TasksPriorityDonut data={priorityCounts} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Most Urgent Tasks" subtitle="Overdue items surfaced first">
          {urgentTasks.length ? (
            <UrgentTasksTableClient tasks={urgentTasks} />
          ) : (
            <EmptyState title="No urgent tasks" description="All tasks are on track." />
          )}
        </ChartCard>

        <ChartCard title="People With Most Pending Tasks" subtitle="Focus on highest load">
          {pendingCounts.length ? (
            <PendingLoadTableClient people={pendingCounts} />
          ) : (
            <EmptyState title="No team load data" description="Assign tasks to see insights." />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
