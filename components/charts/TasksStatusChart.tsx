"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface TasksStatusChartProps {
  data: { status: string; count: number }[];
}

export default function TasksStatusChart({ data }: TasksStatusChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="status" stroke="#cbbfa6" fontSize={12} />
          <YAxis stroke="#cbbfa6" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#f8f5ef"
            }}
          />
          <Bar dataKey="count" fill="#dfb569" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
