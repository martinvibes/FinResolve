"use client";
import { useEffect, useState } from "react";
import { useFinancial } from "@/contexts/FinancialContext";
import { WeeklyInsight } from "@/components/coach/WeeklyInsight";
import { getInsightAction, type DashboardAnalytics } from "@/actions/insights";
import { type InsightTimeframe } from "@/lib/coach/generateInsight";
import { Loader2, TrendingUp, Wallet, PieChart, Plus } from "lucide-react";
import {
  DailyTrendChart,
  CategoryPieChart,
} from "@/components/insights/InsightsCharts";
import { formatCurrency } from "@/lib/parseInput";
import { CATEGORY_META, type SpendingCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";

export default function InsightsPage() {
  const { profile, isLoading, addSpending } = useFinancial();
  const currency = profile.currency;
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<InsightTimeframe>("weekly");

  const handleAddTransaction = (data: {
    amount: string;
    category: string;
    description: string;
    accountId: string;
  }) => {
    addSpending({
      id: crypto.randomUUID(),
      category: data.category.toLowerCase() as SpendingCategory,
      amount: parseFloat(data.amount),
      confidence: "high",
      source: "manual",
      description: data.description || undefined,
      date: new Date().toISOString(),
      accountId: data.accountId,
      type: "expense",
    });
    // Optimistically update or re-fetch logic could go here
    setIsModalOpen(false);
  };

  useEffect(() => {
    async function loadData() {
      if (profile && profile.hasCompletedOnboarding) {
        setLoading(true);
        try {
          const result = await getInsightAction(profile, timeframe);
          setData(result);
        } catch (error) {
          console.error("Failed to load insight", error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (!isLoading) {
      loadData();
    }
  }, [profile, isLoading, timeframe]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">
          Analyzing your {timeframe}...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No data available for insights yet.</p>
      </div>
    );
  }

  const dailyAverage =
    timeframe === "weekly"
      ? data.totalSpent / 7
      : timeframe === "monthly"
        ? data.totalSpent / new Date().getDate()
        : data.totalSpent / (new Date().getMonth() + 1);

  const timeframeLabels: Record<InsightTimeframe, string> = {
    weekly: "Weekly Insights",
    monthly: "Monthly Insights",
    yearly: "Yearly Insights",
  };

  const timeframeSubtitles: Record<InsightTimeframe, string> = {
    weekly: "Your financial health check for the last 7 days.",
    monthly: "Deep dive into your spending for the current month.",
    yearly: "High-level overview of your wealth journey this year.",
  };

  const trendSubtitles: Record<InsightTimeframe, string> = {
    weekly: "Your daily spending over the last week",
    monthly: "Spending progression through the month",
    yearly: "Your monthly spending trend this year",
  };

  const periodLabels: Record<InsightTimeframe, string> = {
    weekly: "Last 7 days",
    monthly: "Current month",
    yearly: "Current year",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">
            {timeframeLabels[timeframe]}
          </h1>
          <p className="text-slate-500 mt-1">{timeframeSubtitles[timeframe]}</p>
        </header>

        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {(["weekly", "monthly", "yearly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize",
                timeframe === t
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200 scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-800 transition-colors w-fit md:hidden"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTransaction}
      />

      {loading && data ? (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spent */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-primary" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">
              Total Spent
            </p>
            <h3 className="text-3xl font-bold text-slate-900">
              {formatCurrency(data.totalSpent, currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              {periodLabels[timeframe]}
            </p>
          </div>
        </div>

        {/* Daily Average */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-blue-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">
              {timeframe === "yearly" ? "Monthly Average" : "Daily Average"}
            </p>
            <h3 className="text-3xl font-bold text-slate-900">
              {formatCurrency(dailyAverage, currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              {timeframe === "yearly" ? "Per month" : "Per day"}
            </p>
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChart className="w-16 h-16 text-purple-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">
              Top Category
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 truncate">
                {data.topCategory
                  ? CATEGORY_META[data.topCategory.category].label
                  : "None"}
              </h3>
              {data.topCategory && (
                <span className="text-sm font-medium text-slate-500">
                  {formatCurrency(data.topCategory.amount, currency)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">Highest spend area</p>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Spending Trend</h3>
            <p className="text-sm text-slate-500">
              {trendSubtitles[timeframe]}
            </p>
          </div>
          <DailyTrendChart data={data.dailyTrend} currency={currency} />
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Where it went</h3>
            <p className="text-sm text-slate-500">Spending by category</p>
          </div>
          <CategoryPieChart data={data.categoryBreakdown} currency={currency} />

          {/* Legend */}
          <div className="mt-6 space-y-3">
            {data.categoryBreakdown.slice(0, 3).map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: CATEGORY_META[item.category].color,
                    }}
                  />
                  <span className="text-slate-600">
                    {CATEGORY_META[item.category].label}
                  </span>
                </div>
                <span className="font-medium text-slate-900">
                  {formatCurrency(item.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Coach Insight */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">
          Coach's Analysis
        </h3>
        <WeeklyInsight
          insight={data.insight}
          onAccept={() => console.log("Accepted")}
          onReject={() => console.log("Rejected")}
        />
      </div>
    </div>
  );
}
