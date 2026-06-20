"use client";

import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, 
  BarChart, Bar, Cell, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { 
  Calendar, CreditCard, Clock, AlertTriangle, 
  Loader2, ArrowRight, TrendingUp, TrendingDown, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsData {
  summary: {
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    avgPaymentDays: number;
  };
  statusDistribution: Array<{ name: string; value: number }>;
  topClients: Array<{ name: string; amount: number }>;
  revenueOverTime: Array<{ date: string; Paid: number; Pending: number }>;
}

interface AnalyticsClientProps {
  currency: string;
}

const COLORS = {
  PAID: "#10b981",       // Emerald
  SENT: "#3b82f6",       // Blue
  VIEWED: "#6366f1",     // Indigo
  OVERDUE: "#f43f5e",    // Rose
  DRAFT: "#71717a",      // Zinc
  CANCELLED: "#ef4444",  // Red
};

export default function AnalyticsClient({ currency }: AnalyticsClientProps) {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Failed to load analytics details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const currencySymbol = currency === "INR" ? "₹" : "$";

  // Pie chart helper
  const getPieColor = (name: string) => {
    return (COLORS as any)[name] || "#7c3aed";
  };

  // Tooltip formatter for pie chart
  const renderPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-md shadow-sm">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 capitalize">{item.name.toLowerCase()}</p>
          <p className="text-sm font-bold text-zinc-950 dark:text-white mt-0.5">
            {item.value} Invoice{item.value > 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tool-tip matching modern Violet aesthetic for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-md">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
            Paid: {currencySymbol}{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white md:text-3xl">
            Analytics Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Track business financial performance, client revenue and payments speed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="range-select" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Timeframe:</label>
          <select
            id="range-select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={() => fetchAnalytics(range)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-zinc-650 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-96 w-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-violet-550 animate-spin" />
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Paid card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Revenue Collected</p>
                  <h3 className="text-xl font-bold tracking-tight mt-0.5">
                    {formatCurrency(data?.summary.totalPaid || 0, currency)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Total Outstanding card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Awaiting Payment</p>
                  <h3 className="text-xl font-bold tracking-tight mt-0.5">
                    {formatCurrency(data?.summary.totalOutstanding || 0, currency)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Overdue card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Overdue Balance</p>
                  <h3 className="text-xl font-bold tracking-tight mt-0.5">
                    {formatCurrency(data?.summary.totalOverdue || 0, currency)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Average payment speed card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Avg Payment Duration</p>
                  <h3 className="text-xl font-bold tracking-tight mt-0.5">
                    {data?.summary.avgPaymentDays || 0} Day{data?.summary.avgPaymentDays === 1 ? "" : "s"}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Over Time Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-zinc-900 dark:text-white">Revenue Timeline</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Paid vs outstanding timeline over selected period</p>
            
            <div className="h-72 w-full mt-4">
              {data?.revenueOverTime.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  No invoices issued in this period.
                </div>
              ) : (
                <ResponsiveContainer width="105%" height="100%" className="-ml-4">
                  <AreaChart data={data?.revenueOverTime}>
                    <defs>
                      <linearGradient id="colorPaidAnal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorPendingAnal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-150 dark:stroke-zinc-800" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                    <Tooltip formatter={(value) => [`${currencySymbol}${value}`, undefined]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                    <Area type="monotone" dataKey="Paid" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPaidAnal)" name="Paid" />
                    <Area type="monotone" dataKey="Pending" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPendingAnal)" name="Awaiting Payment" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Grid: Client Distribution & Status Distribution */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Clients by PAID Revenue */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
              <h3 className="font-bold text-zinc-900 dark:text-white">Top 5 Clients</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Top clients sorted by paid revenue in the current range</p>

              <div className="h-64 w-full mt-4">
                {data?.topClients.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
                    No paid client revenue found.
                  </div>
                ) : (
                  <ResponsiveContainer width="105%" height="100%" className="-ml-4">
                    <BarChart data={data?.topClients} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-zinc-150 dark:stroke-zinc-800" />
                      <XAxis type="number" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                      <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="amount" fill="#7c3aed" radius={[0, 4, 4, 0]}>
                        {data?.topClients.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#7c3aed" : "#a78bfa"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status Distribution Pie Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
              <h3 className="font-bold text-zinc-900 dark:text-white">Invoice Distribution</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Proportion of invoices by status classification</p>

              <div className="grid grid-cols-5 items-center gap-4 mt-4 h-64">
                <div className="col-span-3 h-full w-full">
                  {data?.statusDistribution.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
                      No invoices found.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={renderPieTooltip} />
                        <Pie
                          data={data?.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data?.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getPieColor(entry.name)} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Pie legend */}
                <div className="col-span-2 space-y-1.5">
                  {data?.statusDistribution.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: getPieColor(entry.name) }} />
                      <span className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350 capitalize truncate">
                        {entry.name.toLowerCase()}: <b className="text-zinc-900 dark:text-white">{entry.value}</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
