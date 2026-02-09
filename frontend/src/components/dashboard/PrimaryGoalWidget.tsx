"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Check } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";
import { CURRENCIES, type CurrencyCode, type Account } from "@/lib/types";

import { AddGoalModal } from "@/components/modals/AddGoalModal";
import { SaveToGoalModal } from "@/components/modals/SaveToGoalModal";

export function PrimaryGoalWidget() {
  const { profile, updateGoal, addGoal, addSpending, isLoading } =
    useFinancial();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const currency = profile.currency;

  const handleAddGoal = (data: {
    title: string;
    targetAmount: string;
    deadline: string;
    color: string;
  }) => {
    addGoal({
      id: crypto.randomUUID(),
      name: data.title,
      target: parseFloat(data.targetAmount || "0"),
      current: 0,
      deadline: data.deadline || undefined,
      priority: "medium", // Default for now
      createdAt: new Date().toISOString(),
    });
    setShowAddGoalModal(false);
  };

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
          <button
            onClick={() => setShowAddGoalModal(true)}
            className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add a goal
          </button>
        </div>
        <AddGoalModal
          isOpen={showAddGoalModal}
          onClose={() => setShowAddGoalModal(false)}
          onAdd={handleAddGoal}
        />
      </div>
    );
  }

  const percentage = Math.min(
    (primaryGoal.current / primaryGoal.target) * 100,
    100,
  );
  const remaining = primaryGoal.target - primaryGoal.current;

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
          {formatCurrency(remaining, currency)} to go
          {primaryGoal.deadline && ` • Due ${primaryGoal.deadline}`}
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">
              {formatCurrency(primaryGoal.current, currency)}
            </span>
            <span className="text-slate-400">
              {formatCurrency(primaryGoal.target, currency)}
            </span>
          </div>
          <div className="relative">
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
          </div>
          <div className="flex justify-end items-center mt-1">
            <p className="text-xs text-slate-500 text-right">
              {percentage.toFixed(0)}% complete
            </p>
          </div>
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

      <SaveToGoalModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        goal={primaryGoal}
      />
    </>
  );
}
