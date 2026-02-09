"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Check } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";

import { SaveToGoalModal } from "@/components/modals/SaveToGoalModal";
import { type SavingsGoal } from "@/lib/types";

interface GoalCardProps {
  goal: SavingsGoal;
  color?: string;
  showSaveButton?: boolean;
}

export function GoalCard({
  goal,
  color = "bg-primary",
  showSaveButton = true,
}: GoalCardProps) {
  const { profile } = useFinancial();
  const currency = profile.currency;
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const percentage = Math.min((goal.current / goal.target) * 100, 100);

  return (
    <>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border group hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg text-slate-800">
              {goal.name}
            </h3>
            <p className="text-sm text-gray-400">
              {goal.deadline ? (
                `By ${goal.deadline}`
              ) : (
                <span className="invisible">No deadline</span>
              )}
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors cursor-pointer">
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="mb-2 flex justify-between text-sm font-medium">
          <span className="text-slate-700">
            {formatCurrency(goal.current, currency)}
          </span>
          <span className="text-gray-400">
            of {formatCurrency(goal.target, currency)}
          </span>
        </div>

        <div className="relative mb-6">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full ${color} rounded-full relative`}
            >
              <div className="absolute right-0 top-0 bottom-0 w-full bg-linear-to-l from-white/20 to-transparent" />
            </motion.div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-green-500",
                  percentage < 100 && "animate-pulse",
                )}
              ></span>
              <p className="text-xs text-green-600 font-medium">
                {percentage >= 100
                  ? "Goal reached!"
                  : `${percentage.toFixed(0)}% complete`}
              </p>
            </div>
          </div>

          {showSaveButton && (
            <button
              onClick={() => setShowSaveModal(true)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                justSaved
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
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
      </div>

      <SaveToGoalModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        goal={goal}
      />
    </>
  );
}
