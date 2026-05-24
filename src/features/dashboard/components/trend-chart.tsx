"use client";
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

type TimelineValue = {
  query?: string;
  value?: string;
  extracted_value?: number;
};

type TimelineEntry = {
  date?: string;
  values?: TimelineValue[];
};

interface TrendChartProps {
  data: TimelineEntry[];
  keywords: readonly string[];
}

const COLORS = ["#328f97", "#16A34A", "#EA580C", "#6B7280", "#DC2626"];

export default function TrendChart({ data, keywords }: TrendChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const visibleKeywords = keywords.slice(0, 5);

  const chartData = visibleKeywords
    .map((keyword, i) => {
      const values = data.flatMap((entry) =>
        (entry.values ?? [])
          .filter((v) => v.query === keyword)
          .map((v) => v.extracted_value ?? 0),
      );
      const avg = values.length
        ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
        : 0;
      return { keyword, avg, color: COLORS[i % COLORS.length] };
    })
    .sort((a, b) => b.avg - a.avg);

  if (!mounted) return <div className="h-56 w-full sm:h-64" />;

  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 32, bottom: 0, left: 8 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#416166" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="keyword"
            width={120}
            tick={{ fontSize: 11, fill: "#416166" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(23,58,64,0.06)" }}
            formatter={(value) => [`${value ?? 0}`, "Média"]}
            contentStyle={{
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#173a40",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              padding: "8px 14px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
            labelStyle={{ color: "#a8d5d9", marginBottom: 2, fontSize: 12 }}
            itemStyle={{ color: "#ffffff" }}
          />
          <Bar dataKey="avg" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
