"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Check } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";

interface SaveNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalName: string;
  onSave: (amount: number) => void;
}

function SaveNowModal({
  isOpen,
  onClose,
  goalName,
  onSave,
}: SaveNowModalProps) {
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (numAmount > 0) {
      setIsSaving(true);
      await new Promise((r) => setTimeout(r, 500)); // Simulate API call
      onSave(numAmount);
      setIsSaving(false);
      setAmount("");
      onClose();
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Save to {goalName}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Add funds to your savings goal
        </p>

        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 mb-1 block">
            Amount
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/[^0-9.]/g, "");
              if (rawValue) {
                const numberValue = parseFloat(rawValue);
                if (!isNaN(numberValue)) {
                  setAmount(numberValue.toLocaleString());
                } else {
                  setAmount(rawValue);
                }
              } else {
                setAmount("");
              }
            }}
            placeholder="0"
            className="w-full px-4 py-3 text-2xl font-semibold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex gap-2 mb-6">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => setAmount(quickAmount.toLocaleString())}
              className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {formatCurrency(quickAmount).replace(".00", "")}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!amount || isSaving}
            className={cn(
              "flex-1 py-3 text-sm font-medium text-white rounded-xl transition-colors flex items-center justify-center gap-2",
              amount && !isSaving
                ? "bg-primary hover:bg-primary/90"
                : "bg-slate-300 cursor-not-allowed",
            )}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function PrimaryGoalWidget() {
  const { profile, updateGoal, isLoading } = useFinancial();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-slate-200 rounded-lg" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-3 bg-slate-200 rounded-full" />
      </div>
    );
  }

  // Get the primary (highest priority) goal
  const primaryGoal = [...profile.goals].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  })[0];

  if (!primaryGoal) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Primary Goal</h3>
        </div>
        <div className="py-6 text-center">
          <p className="text-sm text-slate-500">No goals set yet</p>
          <button className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1 mx-auto">
            <Plus className="w-4 h-4" />
            Add a goal
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.min(
    (primaryGoal.current / primaryGoal.target) * 100,
    100,
  );
  const remaining = primaryGoal.target - primaryGoal.current;

  const handleSave = (amount: number) => {
    // Optimistic UI update
    updateGoal(primaryGoal.id, {
      current: primaryGoal.current + amount,
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const priorityColors = {
    high: "bg-emerald-500",
    medium: "bg-blue-500",
    low: "bg-slate-400",
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              Primary Goal
            </h3>
          </div>
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full text-white",
              priorityColors[primaryGoal.priority],
            )}
          >
            {primaryGoal.priority}
          </span>
        </div>

        <h4 className="text-lg font-bold text-slate-800 mb-1">
          {primaryGoal.name}
        </h4>
        <p className="text-sm text-slate-500 mb-4">
          {formatCurrency(remaining)} to go
          {primaryGoal.deadline && ` • Due ${primaryGoal.deadline}`}
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">
              {formatCurrency(primaryGoal.current)}
            </span>
            <span className="text-slate-400">
              {formatCurrency(primaryGoal.target)}
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                priorityColors[primaryGoal.priority],
              )}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">
            {percentage.toFixed(0)}% complete
          </p>
        </div>

        <button
          onClick={() => setShowSaveModal(true)}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
            justSaved
              ? "bg-emerald-500 text-white"
              : "bg-primary text-white hover:bg-primary/90",
          )}
        >
          {justSaved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Save Now
            </>
          )}
        </button>
      </div>

      <SaveNowModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        goalName={primaryGoal.name}
        onSave={handleSave}
      />
    </>
  );
}
