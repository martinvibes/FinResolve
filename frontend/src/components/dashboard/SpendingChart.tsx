"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useFinancial } from "@/contexts/FinancialContext";
import { CATEGORY_META, type SpendingCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/parseInput";

// Color palette for categories
const CATEGORY_COLORS: Record<SpendingCategory, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  utilities: "#8b5cf6",
  housing: "#ec4899",
  entertainment: "#06b6d4",
  shopping: "#10b981",
  health: "#ef4444",
  education: "#f59e0b",
  savings: "#22c55e",
  other: "#6b7280",
  data_airtime: "#0ea5e9",
  family: "#f43f5e",
  debt: "#b91c1c",
  personal_care: "#f472b6",
  investment: "#6366f1",
  tax: "#64748b",
  salary: "#16a34a",
  business: "#0891b2",
  gift: "#db2777",
};

function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-40 h-40 bg-slate-200 rounded-full" />
      </div>
      <div className="flex justify-center gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-200 rounded-full" />
            <div className="w-12 h-3 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpendingChart() {
  const { profile, isLoading } = useFinancial();

  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Transform profile.spendingSummary into chart data
  const chartData = profile.spendingSummary
    .filter((s) => s.total > 0)
    .map((summary) => ({
      name: CATEGORY_META[summary.category].label,
      value: summary.total,
      color: CATEGORY_COLORS[summary.category],
      category: summary.category,
    }))
    .sort((a, b) => b.value - a.value);

  const totalSpending = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          Spending This Month
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-slate-400">No spending data yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Tell me about your expenses or upload a statement
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">
        Spending This Month
      </h3>
      <div className="flex-1 min-h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              position={{ y: 0 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-2xl font-bold text-slate-800">
              {formatCurrency(totalSpending).replace(".00", "")}
            </span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-x-4 gap-y-2 mt-6 flex-wrap">
        {chartData.slice(0, 4).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
