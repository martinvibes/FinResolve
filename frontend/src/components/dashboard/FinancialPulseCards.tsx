"use client";

import { Wallet, ShieldCheck, TrendingDown } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";

interface PulseCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: string;
  bgColor: string;
}

function PulseCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
  bgColor,
}: PulseCardProps) {
  return (
    <div className={cn("p-5 rounded-2xl", bgColor)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-xl", color.replace("text-", "bg-").replace("-600", "-100"))}>
          {icon}
        </div>
        {trend && trendValue && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" && "bg-green-100 text-green-600",
              trend === "down" && "bg-red-100 text-red-600",
              trend === "neutral" && "bg-slate-100 text-slate-600"
            )}
          >
            {trendValue}
          </span>
        )}
      </div>
      <p className={cn("text-xs font-medium mb-1", color)}>{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function PulseCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-slate-50 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        <div className="w-12 h-5 bg-slate-200 rounded-full" />
      </div>
      <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
      <div className="h-7 w-28 bg-slate-200 rounded" />
    </div>
  );
}

export function FinancialPulseCards() {
  const { profile, isLoading } = useFinancial();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PulseCardSkeleton />
        <PulseCardSkeleton />
        <PulseCardSkeleton />
      </div>
    );
  }

  // Calculate metrics from profile data
  const totalSpending = profile.spendingSummary.reduce((s, c) => s + c.total, 0);
  const totalSaved = profile.goals.reduce((s, g) => s + g.current, 0);
  const monthlyIncome = profile.income?.amount || 0;

  // Derived metrics
  const totalBalance = monthlyIncome - totalSpending + totalSaved;
  const budgetRemaining = monthlyIncome - totalSpending;

  // Calculate days remaining in month
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - today.getDate();
  const daysPassed = today.getDate();

  // Safe to spend per day
  const safeToSpend = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

  // Burn rate (daily spending rate)
  const burnRate = daysPassed > 0 ? totalSpending / daysPassed : 0;

  // Calculate expected vs actual spending for trend
  const expectedSpending = (monthlyIncome / daysInMonth) * daysPassed;
  const spendingDiff = totalSpending - expectedSpending;
  const spendingTrend: "up" | "down" | "neutral" =
    spendingDiff > 1000 ? "down" : spendingDiff < -1000 ? "up" : "neutral";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <PulseCard
        title="Total Balance"
        value={totalBalance > 0 ? formatCurrency(totalBalance) : "—"}
        subtitle={monthlyIncome > 0 ? `Income: ${formatCurrency(monthlyIncome)}` : "Set your income"}
        icon={<Wallet className="w-5 h-5 text-emerald-600" />}
        color="text-emerald-600"
        bgColor="bg-emerald-50"
      />
      <PulseCard
        title="Safe to Spend"
        value={safeToSpend > 0 ? formatCurrency(safeToSpend) : "—"}
        subtitle={daysRemaining > 0 ? `${daysRemaining} days left this month` : "Month ending"}
        icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
        trend={budgetRemaining > 0 ? "up" : budgetRemaining < 0 ? "down" : "neutral"}
        trendValue={budgetRemaining >= 0 ? "On track" : "Over budget"}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <PulseCard
        title="Burn Rate"
        value={burnRate > 0 ? `${formatCurrency(burnRate)}/day` : "—"}
        subtitle={totalSpending > 0 ? `${formatCurrency(totalSpending)} spent so far` : "No spending tracked"}
        icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
        trend={spendingTrend}
        trendValue={
          spendingTrend === "up"
            ? "Under budget"
            : spendingTrend === "down"
              ? "Over budget"
              : "On pace"
        }
        color="text-amber-600"
        bgColor="bg-amber-50"
      />
    </div>
  );
}
