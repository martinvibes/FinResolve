"use server";

import {
  generateInsight,
  type SpendingInsight,
  type InsightTimeframe,
} from "@/lib/coach/generateInsight";
import { type UserFinancialProfile, type SpendingCategory } from "@/lib/types";

export interface DashboardAnalytics {
  totalSpent: number;
  dailyTrend: { day: string; amount: number; fullDate: string }[];
  categoryBreakdown: {
    category: SpendingCategory;
    amount: number;
    percentage: number;
  }[];
  topCategory: { category: SpendingCategory; amount: number } | null;
  insight: SpendingInsight;
}

export async function getInsightAction(
  profile: UserFinancialProfile,
  timeframe: InsightTimeframe = "weekly",
): Promise<DashboardAnalytics> {
  // 1. Get AI Insight
  const aiInsight = await generateInsight(profile, timeframe);

  // 2. Calculate Analytics Locally
  const now = new Date();
  let startDate: Date;

  if (timeframe === "weekly") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const transactions = profile.monthlySpending.filter((t) => {
    const tDate = new Date(t.date || t.createdAt || 0);
    return tDate >= startDate && tDate <= now && t.type !== "income"; // Only expenses
  });

  // Calculate Total
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate Trend Data based on timeframe
  const trendMap = new Map<string, number>();

  if (timeframe === "weekly") {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      trendMap.set(label, 0);
    }
    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt || 0);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      if (trendMap.has(label)) {
        trendMap.set(label, (trendMap.get(label) || 0) + t.amount);
      }
    });
  } else if (timeframe === "monthly") {
    // Current month grouped by week or days
    // Let's go with days but show fewer labels? For now, let's group by date
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (d <= now) {
        const label = d.toLocaleDateString("en-US", { day: "numeric" });
        trendMap.set(label, 0);
      }
    }
    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt || 0);
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        const label = d.toLocaleDateString("en-US", { day: "numeric" });
        trendMap.set(label, (trendMap.get(label) || 0) + t.amount);
      }
    });
  } else {
    // Current year grouped by month
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    months.forEach((m, i) => {
      if (i <= now.getMonth()) {
        trendMap.set(m, 0);
      }
    });
    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt || 0);
      if (d.getFullYear() === now.getFullYear()) {
        const label = months[d.getMonth()];
        trendMap.set(label, (trendMap.get(label) || 0) + t.amount);
      }
    });
  }

  const dailyTrend = Array.from(trendMap.entries()).map(([day, amount]) => ({
    day,
    amount,
    fullDate: day,
  }));

  // Calculate Category Breakdown
  const categoryMap = new Map<SpendingCategory, number>();
  transactions.forEach((t) => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  });

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory =
    categoryBreakdown.length > 0
      ? {
          category: categoryBreakdown[0].category,
          amount: categoryBreakdown[0].amount,
        }
      : null;

  return {
    totalSpent,
    dailyTrend,
    categoryBreakdown,
    topCategory,
    insight: aiInsight,
  };
}
