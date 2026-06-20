"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ChartDataPoint {
  month: string;
  Paid: number;
  Pending: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  currencySymbol: string;
}

export default function RevenueChart({ data, currencySymbol }: RevenueChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-80 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-zinc-400 dark:text-zinc-600 text-sm">Loading chart data...</span>
      </div>
    );
  }

  // Custom tool-tip matching modern Violet aesthetic
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-md">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {currencySymbol}{entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="105%" height="100%" className="-ml-4">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-850" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            className="text-zinc-500 dark:text-zinc-400"
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${currencySymbol}${value}`}
            className="text-zinc-500 dark:text-zinc-400"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Area
            type="monotone"
            dataKey="Paid"
            stroke="#7c3aed"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPaid)"
            name="Paid Revenue"
          />
          <Area
            type="monotone"
            dataKey="Pending"
            stroke="#f43f5e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPending)"
            name="Pending / Overdue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
