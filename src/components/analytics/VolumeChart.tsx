"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface WeeklyVolumeEntry {
  label: string; // e.g. "Mar 3"
  km: number;
}

interface Props {
  data: WeeklyVolumeEntry[];
}

export function VolumeChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-sm">
        No workout data yet
      </div>
    );
  }

  const maxKm = Math.max(...data.map((d) => d.km), 1);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            domain={[0, Math.ceil(maxKm * 1.1)]}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : 0;
              return [`${num.toFixed(1)} km`, "Volume"] as [string, string];
            }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 12,
            }}
          />
          <Bar dataKey="km" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index === data.length - 1
                    ? "hsl(var(--primary))"
                    : "hsl(var(--primary) / 0.5)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
