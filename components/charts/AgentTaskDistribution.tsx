"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";

interface AgentTaskDistributionProps {
  data: { label: string; count: number }[];
}

const COLORS = ["#dfb569", "#b4842c", "#9c6b1f", "#f0d9a2"];

export default function AgentTaskDistribution({ data }: AgentTaskDistributionProps) {
  return (
    <div className="h-52">
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
            nameKey="label"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
