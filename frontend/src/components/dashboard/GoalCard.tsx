"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Check } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline?: string;
  color?: string;
  showSaveButton?: boolean;
}

export function GoalCard({
  id,
  title,
  target,
  current,
  deadline,
  color = "bg-primary",
  showSaveButton = true,
}: GoalCardProps) {
  const { updateGoal } = useFinancial();
  const [showQuickSave, setShowQuickSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const percentage = Math.min((current / target) * 100, 100);

  const quickAmounts = [1000, 5000, 10000];

  const handleQuickSave = async (amount: number) => {
    setIsSaving(true);
    // Optimistic UI update
    updateGoal(id, { current: current + amount });
    await new Promise((r) => setTimeout(r, 300));
    setIsSaving(false);
    setShowQuickSave(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
          <p className="text-sm text-gray-400">
            {deadline ? `By ${deadline}` : "No deadline"}
          </p>
        </div>
        <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors cursor-pointer">
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <div className="mb-2 flex justify-between text-sm font-medium">
        <span className="text-slate-700">{formatCurrency(current)}</span>
        <span className="text-gray-400">of {formatCurrency(target)}</span>
      </div>

      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-full ${color} rounded-full relative`}
        >
          <div className="absolute right-0 top-0 bottom-0 w-full bg-gradient-to-l from-white/20 to-transparent" />
        </motion.div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <p className="text-xs text-green-600 font-medium">
            {percentage >= 100 ? "Goal reached!" : `${percentage.toFixed(0)}% complete`}
          </p>
        </div>

        {showSaveButton && (
          <div className="relative">
            {showQuickSave ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1"
              >
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickSave(amount)}
                    disabled={isSaving}
                    className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    +{formatCurrency(amount).replace(".00", "").replace("₦", "")}
                  </button>
                ))}
                <button
                  onClick={() => setShowQuickSave(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowQuickSave(true)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  justSaved
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {justSaved ? (
                  <>
                    <Check className="w-3 h-3" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    Save Now
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
