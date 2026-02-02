"use client";

import { useState } from "react";
import { Plus, Target, AlertCircle, CheckCircle2 } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";
import type { Budget, SpendingCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export function BudgetProgress() {
  const { profile, addBudget, deleteBudget } = useFinancial();
  const [showAddForm, setShowAddForm] = useState(false);

  const budgets = profile.budgets || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            Monthly Budgets
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
        >
          + Set Limit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} onDelete={deleteBudget} />
        ))}

        {budgets.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[120px]">
            <span className="text-sm">No budgets set yet.</span>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs text-blue-500 hover:underline"
            >
              Set a spending limit
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <AddBudgetModal
            onClose={() => setShowAddForm(false)}
            onAdd={addBudget}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BudgetCard({
  budget,
  onDelete,
}: {
  budget: Budget;
  onDelete: (id: string) => void;
}) {
  const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
  const isOverBudget = budget.spent > budget.limit;
  const isWarning = percentage > 85 && !isOverBudget;

  const categoryMeta = CATEGORY_META[budget.category] || CATEGORY_META.other;

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm relative group hover:border-slate-200 transition-colors">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDelete(budget.id)}
          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
        >
          <span className="sr-only">Delete</span>
          &times;
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryMeta.emoji}</span>
          <span className="text-sm font-medium text-slate-700">
            {categoryMeta.label}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            isOverBudget
              ? "bg-red-100 text-red-600"
              : isWarning
                ? "bg-amber-100 text-amber-600"
                : "bg-emerald-100 text-emerald-600",
          )}
        >
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isOverBudget
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-blue-500",
          )}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatCurrency(budget.spent)} spent</span>
        <span>of {formatCurrency(budget.limit)}</span>
      </div>
    </div>
  );
}

function AddBudgetModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (b: Budget) => void;
}) {
  const [category, setCategory] = useState<SpendingCategory>("food");
  const [limit, setLimit] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit) return;

    onAdd({
      id: crypto.randomUUID(),
      category,
      limit: Number(limit.replace(/[^0-9.-]+/g, "")),
      period: "monthly",
      spent: 0,
    });
    onClose();
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
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Set Monthly Budget
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as SpendingCategory)
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.emoji} {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Monthly Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">
                  ₦
                </span>
                <input
                  type="text"
                  value={limit}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
                    if (rawValue) {
                      const numberValue = parseFloat(rawValue);
                      if (!isNaN(numberValue)) {
                        setLimit(numberValue.toLocaleString());
                      } else {
                        setLimit(rawValue);
                      }
                    } else {
                      setLimit("");
                    }
                  }}
                  placeholder="50,000"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-900/10"
              >
                Set Budget
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
