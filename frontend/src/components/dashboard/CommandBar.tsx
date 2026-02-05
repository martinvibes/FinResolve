"use client";

import { Plus, TrendingUp, PiggyBank, Upload, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onAddExpense: () => void;
  onAnalyze: () => void;
  onSaveNow: () => void;
  onUpload: () => void;
  onViewScore: () => void;
}

export function CommandBar({
  onAddExpense,
  onAnalyze,
  onSaveNow,
  onUpload,
  onViewScore,
}: CommandBarProps) {
  const quickActions = [
    {
      label: "My Score",
      icon: Gauge,
      onClick: onViewScore,
      color: "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-md shadow-purple-200",
      highlight: true,
    },
    {
      label: "Expense",
      icon: Plus,
      onClick: onAddExpense,
      color: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    },
    {
      label: "Analyze",
      icon: TrendingUp,
      onClick: onAnalyze,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      label: "Save Now",
      icon: PiggyBank,
      onClick: onSaveNow,
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    {
      label: "Upload",
      icon: Upload,
      onClick: onUpload,
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
  ];

  return (
    <div className="px-6 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Quick Actions Only */}
        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95",
                action.color,
              )}
            >
              <action.icon className="w-4 h-4" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden md:block text-xs font-medium text-slate-400">
          Fast Actions &bull; Powered by FinResolve AI
        </div>
      </div>
    </div>
  );
}
