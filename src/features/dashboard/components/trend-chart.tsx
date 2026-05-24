"use client";
import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

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
  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleKeywords = keywords.slice(0, 5);

  const chartConfig = Object.fromEntries(
    visibleKeywords.map((keyWorld, index) => [
      keyWorld,
      { label: keyWorld, color: COLORS[index % COLORS.length] },
    ]),
  ) satisfies ChartConfig;

  const visibleSet = new Set(visibleKeywords);

  const chartData = data.map((entry) => {
    const point: Record<string, unknown> = {
      date: formatDate(entry.date ?? ""),
    };

    // Initialize all keywords to 0 so absent entries don't show undefined
    visibleKeywords.forEach((keyWorld) => {
      point[keyWorld] = 0;
    });

    // Map by v.query so values are matched to the correct keyword regardless of order
    entry.values?.forEach((value) => {
      if (value.query && visibleSet.has(value.query)) {
        point[value.query] = value.extracted_value ?? 0;
      }
    });

    return point;
  });

  if (!mounted) return <div className="h-56 w-full sm:h-72" />;

  return (
    <ChartContainer config={chartConfig} className="h-56 w-full sm:h-72">
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
      >
        <defs>
          {visibleKeywords.map((keyWorld, i) => (
            <linearGradient
              key={keyWorld}
              id={`gradient-${keyWorld}-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={COLORS[i % COLORS.length]}
                stopOpacity={i === 0 ? 0.2 : 0.12}
              />
              <stop
                offset="95%"
                stopColor={COLORS[i % COLORS.length]}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,58,64,0.08)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#416166" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#416166" }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
        />
        <ChartTooltip
          cursor={{ stroke: "rgba(23,58,64,0.15)", strokeWidth: 1 }}
          content={(props) => (
            <ChartTooltipContent
              {...(props as React.ComponentProps<typeof ChartTooltipContent>)}
              indicator="line"
            />
          )}
        />
        <ChartLegend
          content={(props) => (
            <ChartLegendContent
              {...(props as React.ComponentProps<typeof ChartLegendContent>)}
            />
          )}
        />
        {visibleKeywords.map((keyWorld, i) => (
          <Area
            key={keyWorld}
            type="monotone"
            dataKey={keyWorld}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            fill={`url(#gradient-${keyWorld}-${i})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("–");
  return parts[0]?.trim().slice(0, 6) ?? dateStr;
}
