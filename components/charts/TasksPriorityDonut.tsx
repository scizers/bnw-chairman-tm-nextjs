"use client";

import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface TasksPriorityDonutProps {
  data: { priority: string; count: number }[];
}

const COLORS = ["#dfb569", "#f0d9a2", "#b4842c", "#f05d5e"];

export default function TasksPriorityDonut({ data }: TasksPriorityDonutProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#f8f5ef"
            }}
          />
          <Pie
            data={data}
            dataKey="count"
            nameKey="priority"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.priority} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
