"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";

function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border h-full flex flex-col animate-pulse">
      <div className="h-5 w-48 bg-slate-200 rounded mb-6" />
      <div className="flex-1 min-h-[300px] flex items-end gap-2">
        {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-200 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TrendChart() {
  const { profile, isLoading } = useFinancial();

  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Group spending by day for the current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Create a map of daily spending
  const dailySpending = new Map<number, number>();

  profile.monthlySpending.forEach((entry) => {
    if (entry.date) {
      const date = new Date(entry.date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        dailySpending.set(day, (dailySpending.get(day) || 0) + entry.amount);
      }
    }
  });

  // If no daily data, use summary data distributed across days
  if (dailySpending.size === 0 && profile.spendingSummary.length > 0) {
    const totalSpending = profile.spendingSummary.reduce((s, c) => s + c.total, 0);
    const daysPassed = today.getDate();
    const avgDaily = totalSpending / daysPassed;

    // Create synthetic daily data with some variance
    for (let day = 1; day <= daysPassed; day++) {
      const variance = 0.7 + Math.random() * 0.6; // 70% to 130%
      dailySpending.set(day, avgDaily * variance);
    }
  }

  // Build chart data for last 7 days
  const chartData = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOfMonth = date.getDate();
    const dayName = dayNames[date.getDay()];

    // Current month spending
    const spend = dailySpending.get(dayOfMonth) || 0;

    // Calculate "last month" comparison (using average as baseline)
    const monthlyIncome = profile.income?.amount || 0;
    const dailyBudget = monthlyIncome / 30;

    chartData.push({
      name: dayName,
      spend: Math.round(spend),
      budget: Math.round(dailyBudget),
    });
  }

  const hasData = chartData.some((d) => d.spend > 0);

  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-6 text-slate-800">
          Weekly Spending Trend
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-slate-400">No spending data yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Your spending trend will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">
          Weekly Spending Trend
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-slate-500">Spending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-slate-300" />
            <span className="text-slate-500">Budget</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: "#F1F5F9" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === "spend" ? "Spent" : "Budget",
              ]}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSpend)"
            />
            <Line
              type="monotone"
              dataKey="budget"
              stroke="#CBD5E1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
