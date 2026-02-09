"use client";

import {
  Lightbulb,
  Info,
  ArrowRight,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useFinancial } from "@/contexts/FinancialContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Insight {
  id: string;
  type: "tip" | "literacy" | "nudge";
  title: string;
  content: string;
  concept?: string;
  actionLabel?: string;
}

interface CoachInsightProps {
  onAction?: (actionType: string) => void;
}

export function CoachInsight({ onAction }: CoachInsightProps) {
  const { profile } = useFinancial();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate all applicable insights based on user data
  useEffect(() => {
    const allInsights: Insight[] = [];

    // 1. Literacy Tip: Emergency Fund
    allInsights.push({
      id: "literacy-1",
      type: "literacy",
      title: "What's an Emergency Fund?",
      content:
        "It's a 'financial shock absorber'—cash set aside to cover unexpected expenses like car repairs or medical bills without touching your long-term savings.",
      concept: "Emergency Fund",
      actionLabel: "Start one",
    });

    // 2. Dynamic: Spending Alert (Current Month Only)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthSpending = profile.monthlySpending.filter((s) => {
      const d = s.date ? new Date(s.date) : new Date();
      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        s.type !== "income"
      );
    });

    const totalSpentThisMonth = thisMonthSpending.reduce(
      (sum, s) => sum + s.amount,
      0,
    );
    const monthlyIncome = profile.income?.amount || 0;

    if (totalSpentThisMonth > monthlyIncome * 0.7 && monthlyIncome > 0) {
      allInsights.push({
        id: "nudge-spend",
        type: "nudge",
        title: "Monthly Spending Alert",
        content: `You've used ${((totalSpentThisMonth / monthlyIncome) * 100).toFixed(0)}% of your income this month. Consider slowing down on non-essentials to stay on track.`,
        actionLabel: "View breakdown",
      });
    }

    // 3. Dynamic: Top Spending Category
    if (thisMonthSpending.length > 0) {
      const byCategory: Record<string, number> = {};
      thisMonthSpending.forEach((s) => {
        byCategory[s.category] = (byCategory[s.category] || 0) + s.amount;
      });

      const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
      if (topCat && topCat[1] > monthlyIncome * 0.2) {
        allInsights.push({
          id: "nudge-top-cat",
          type: "nudge",
          title: `High ${topCat[0]} Spending`,
          content: `You've spent a significant portion of your budget on ${topCat[0]} this month. Could you find ways to trim this down?`,
          actionLabel: "Manage budgets",
        });
      }
    }

    // 4. Literacy Tip: 50/30/20 Rule
    allInsights.push({
      id: "literacy-2",
      type: "literacy",
      title: "The 50/30/20 Rule",
      content:
        "A simple budget plan: 50% for Needs, 30% for Wants, and 20% for Savings. It helps you balance living for today while building for tomorrow.",
      concept: "50/30/20 Rule",
    });

    // 5. Dynamic: Goal Progress
    const primaryGoal = profile.goals.find((g) => g.priority === "high");
    if (primaryGoal) {
      const percent = (primaryGoal.current / primaryGoal.target) * 100;
      if (percent > 0 && percent < 100) {
        allInsights.push({
          id: "goal-progress",
          type: "tip",
          title: `Keep it up!`,
          content: `You're ${percent.toFixed(0)}% of the way to your "${primaryGoal.name}" goal. Every contribution counts!`,
          actionLabel: "Add savings",
        });
      }
    } else if (profile.goals.length === 0) {
      allInsights.push({
        id: "nudge-2",
        type: "nudge",
        title: "Dream Big!",
        content:
          "Users with specific savings goals save 2x faster. What are you building towards? A new house? A business? Let's name it.",
        actionLabel: "Set a goal",
      });
    }

    // 6. Tip: Investment
    allInsights.push({
      id: "literacy-3",
      type: "literacy",
      title: "Compound Interest",
      content:
        "Albert Einstein called it the 'eighth wonder of the world'. It's interest earned on interest, helping your wealth grow exponentially over time.",
      concept: "Investing",
    });

    // 7. Data Completeness
    if (profile.dataCompleteness < 50) {
      allInsights.push({
        id: "data-nudge",
        type: "tip",
        title: "Better Insights",
        content:
          "The more data I have, the better advice I can give. Add your recurring subscriptions or link another account for a full picture.",
        actionLabel: "Update profile",
      });
    }

    setInsights(allInsights);
  }, [profile]);

  const currentInsight = insights[currentIndex];

  if (!currentInsight) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const typeStyles = {
    tip: "bg-amber-50 border-amber-100 text-amber-800",
    literacy: "bg-indigo-50 border-indigo-100 text-indigo-800",
    nudge: "bg-emerald-50 border-emerald-100 text-emerald-800",
  };

  const Icon = {
    tip: Lightbulb,
    literacy: Info,
    nudge: Sparkles,
  }[currentInsight.type];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentInsight.id}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative p-5 rounded-3xl border overflow-hidden group min-h-[140px]",
          typeStyles[currentInsight.type],
        )}
      >
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {insights.length > 1 && (
            <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-black/5 rounded-full text-[10px] font-bold opacity-60">
              <button
                onClick={handlePrev}
                className="hover:text-current transition-colors"
                title="Previous tip"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span>
                {currentIndex + 1} / {insights.length}
              </span>
              <button
                onClick={handleNext}
                className="hover:text-current transition-colors"
                title="Next tip"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-start">
          <div
            className={cn(
              "p-2.5 rounded-2xl",
              currentInsight.type === "literacy"
                ? "bg-indigo-100/50"
                : currentInsight.type === "nudge"
                  ? "bg-emerald-100/50"
                  : "bg-amber-100/50",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 pr-12">
            <h4 className="font-bold text-sm mb-1">{currentInsight.title}</h4>
            <div className="min-h-[3rem]">
              <p className="text-sm opacity-90 leading-relaxed">
                {currentInsight.content}
              </p>
            </div>

            {currentInsight.actionLabel && (
              <button
                onClick={() => onAction?.(currentInsight.actionLabel!)}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold hover:underline"
              >
                {currentInsight.actionLabel}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
      </motion.div>
    </AnimatePresence>
  );
}
