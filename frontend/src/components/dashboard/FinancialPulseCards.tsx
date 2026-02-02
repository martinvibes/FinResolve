import { useState } from "react";
import {
  ShieldCheck,
  TrendingDown,
  Wallet,
  Edit2,
  X,
  Check,
} from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
// Duplicate imports removed

interface PulseCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: string;
  bgColor: string;
  onEdit?: () => void;
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
  onEdit,
}: PulseCardProps) {
  return (
    <div className={cn("p-5 rounded-2xl", bgColor)}>
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "p-2 rounded-xl",
            color.replace("text-", "bg-").replace("-600", "-100"),
          )}
        >
          {icon}
        </div>
        {trend && trendValue && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" && "bg-green-100 text-green-600",
              trend === "down" && "bg-red-100 text-red-600",
              trend === "neutral" && "bg-slate-100 text-slate-600",
            )}
          >
            {trendValue}
          </span>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
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
  const { profile, isLoading, updateIncome } = useFinancial();
  const [showEditIncome, setShowEditIncome] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PulseCardSkeleton />
        <PulseCardSkeleton />
        <PulseCardSkeleton />
      </div>
    );
  }

  // Calculate metrics from profile data
  const totalSpending = profile.spendingSummary.reduce(
    (s, c) => s + c.total,
    0,
  );
  const totalSaved = profile.goals.reduce((s, g) => s + g.current, 0);
  const monthlyIncome = profile.income?.amount || 0;

  // Derived metrics
  const totalBalance = monthlyIncome - totalSpending + totalSaved;
  const budgetRemaining = monthlyIncome - totalSpending;

  // Calculate days remaining in month
  const today = new Date();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const daysRemaining = daysInMonth - today.getDate();
  const daysPassed = today.getDate();

  // Calculate committed expenses (recurring bills)
  const committedSpend = (profile.recurringItems || []).reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  // Determine budget basis
  const hasBudgets = (profile.budgets || []).length > 0;
  let budgetLimit = monthlyIncome;
  let budgetSpent = totalSpending;

  if (hasBudgets) {
    // If user has set budgets, use those limits as the "Safe" baseline
    budgetLimit = profile.budgets.reduce((sum, b) => sum + b.limit, 0);
    budgetSpent = profile.budgets.reduce((sum, b) => sum + b.spent, 0);
  } else {
    // Otherwise, assume Income minus Fixed Costs is the discretionary pool
    budgetLimit = monthlyIncome - committedSpend;
  }

  // Calculate Safe Daily Spend
  const safeToSpendValues = Math.max(0, budgetLimit - budgetSpent);
  const safeToSpend = daysRemaining > 0 ? safeToSpendValues / daysRemaining : 0;

  // Burn rate (daily spending rate)
  const burnRate = daysPassed > 0 ? totalSpending / daysPassed : 0;

  // Calculate expected vs actual spending for trend
  const expectedSpending = (monthlyIncome / daysInMonth) * daysPassed;
  const spendingDiff = totalSpending - expectedSpending;
  const spendingTrend: "up" | "down" | "neutral" =
    spendingDiff > 1000 ? "down" : spendingDiff < -1000 ? "up" : "neutral";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PulseCard
        title="Monthly Income"
        value={monthlyIncome > 0 ? formatCurrency(monthlyIncome) : "Not set"}
        subtitle="Total expected inflow"
        icon={<Wallet className="w-5 h-5 text-emerald-600" />}
        color="text-emerald-600"
        bgColor="bg-emerald-50"
        onEdit={() => setShowEditIncome(true)}
      />

      <PulseCard
        title="Safe to Spend"
        value={safeToSpend > 0 ? `${formatCurrency(safeToSpend)}/day` : "—"}
        subtitle={
          daysRemaining > 0
            ? `${daysRemaining} days left this month`
            : "Month ending"
        }
        icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
        trend={
          budgetRemaining > 0 ? "up" : budgetRemaining < 0 ? "down" : "neutral"
        }
        trendValue={budgetRemaining >= 0 ? "On track" : "Over budget"}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <PulseCard
        title="Burn Rate"
        value={burnRate > 0 ? `${formatCurrency(burnRate)}/day` : "—"}
        subtitle={
          totalSpending > 0
            ? `${formatCurrency(totalSpending)} spent so far`
            : "No spending tracked"
        }
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

      <AnimatePresence>
        {showEditIncome && (
          <EditIncomeModal
            currentAmount={monthlyIncome}
            onClose={() => setShowEditIncome(false)}
            onSave={(amount) => {
              updateIncome({
                amount,
                confidence: "high",
                isEstimate: false,
                frequency: "monthly",
              });
              setShowEditIncome(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditIncomeModal({
  currentAmount,
  onClose,
  onSave,
}: {
  currentAmount: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [value, setValue] = useState(currentAmount.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (!isNaN(num)) {
      onSave(num);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Update Monthly Income
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Monthly Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">
                  ₦
                </span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
                    setValue(rawValue);
                  }}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                This helps us calculate your safe-to-spend limits.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-900/10"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
