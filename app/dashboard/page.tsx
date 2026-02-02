"use client";

import { useEffect, useState } from "react";
import ChartCard from "@/components/common/ChartCard";
import KpiCard from "@/components/common/KpiCard";
import UrgentTasksTableClient from "@/components/dashboard/UrgentTasksTableClient";
import PendingLoadTableClient from "@/components/dashboard/PendingLoadTableClient";
import TasksStatusChart from "@/components/charts/TasksStatusChart";
import TasksPriorityDonut from "@/components/charts/TasksPriorityDonut";
import EmptyState from "@/components/common/EmptyState";
import { tasksApi, type DashboardStats } from "@/lib/api/tasks";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const dashboardStats = await tasksApi.getDashboardStats();
        if (!isActive) return;
        setStats(dashboardStats);
      } catch (error) {
        if (!isActive) return;
        setStats(null);
        setHasError(true);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, []);

  const kpis = stats?.kpis;
  const statusCounts = stats?.statusCounts ?? [];
  const priorityCounts = stats?.priorityCounts ?? [];
  const urgentTasks = stats?.urgentTasks ?? [];
  const pendingCounts = stats?.pendingCounts ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Executive Overview</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Dashboard</h2>
        </div>
      </div>

      {hasError ? (
        <EmptyState title="Unable to load dashboard data" description="Please try again." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Open Tasks" value={isLoading ? "—" : kpis?.totalOpen ?? 0} />
        <KpiCard title="Overdue Tasks" value={isLoading ? "—" : kpis?.overdueTasks ?? 0} />
        <KpiCard title="Critical Tasks" value={isLoading ? "—" : kpis?.criticalTasks ?? 0} />
        <KpiCard title="Completed This Week" value={isLoading ? "—" : kpis?.completedThisWeek ?? 0} />
        <KpiCard title="Tasks Not Updated 3+ Days" value={isLoading ? "—" : kpis?.staleTasks ?? 0} />
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
