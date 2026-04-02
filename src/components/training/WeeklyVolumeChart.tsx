"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { WeekVolume } from "@/lib/db";

interface Props {
  data: WeekVolume[];
  currentWeek: number;
}

export function WeeklyVolumeChart({ data, currentWeek }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No volume data yet — complete some runs to see your weekly km here.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    name: `W${d.week}`,
    Planned: d.plannedKm,
    Actual: d.actualKm,
    isCurrent: d.week === currentWeek,
  }));

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barCategoryGap="30%"
          barGap={2}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            unit=" km"
            width={52}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
            formatter={(value, name) => [`${value} km`, name as string]}
            labelFormatter={(label) => `Week ${label.replace("W", "")}`}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="Planned"
            fill="var(--muted-foreground)"
            opacity={0.35}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="Actual"
            fill="var(--primary)"
            opacity={0.85}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center">
        Planned vs actual km &middot; Week {currentWeek} of plan
      </p>
    </div>
  );
}
