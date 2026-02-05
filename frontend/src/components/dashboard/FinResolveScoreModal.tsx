"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import {
  calculateFinResolveScore,
  generateScoreRecommendation,
  getScoreColor,
} from "@/lib/scoreCalculation";
import { cn } from "@/lib/utils";

interface FinResolveScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function ScoreRing({ score, size = 140, strokeWidth = 10 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#modalScoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
        <defs>
          <linearGradient
            id="modalScoreGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              className={cn(
                score >= 85
                  ? "text-emerald-500"
                  : score >= 70
                    ? "text-blue-500"
                    : score >= 55
                      ? "text-amber-500"
                      : score >= 40
                        ? "text-orange-500"
                        : "text-red-500"
              )}
              stopColor="currentColor"
            />
            <stop
              offset="100%"
              className={cn(
                score >= 85
                  ? "text-teal-500"
                  : score >= 70
                    ? "text-cyan-500"
                    : score >= 55
                      ? "text-yellow-500"
                      : score >= 40
                        ? "text-amber-500"
                        : "text-orange-500"
              )}
              stopColor="currentColor"
            />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("text-4xl font-bold", colors.text)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-slate-500 font-medium">/100</span>
      </div>
    </div>
  );
}

interface SubScoreItemProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  delay?: number;
}

function SubScoreItem({ label, score, icon, delay = 0 }: SubScoreItemProps) {
  const colors = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-3"
    >
      <div
        className={cn(
          "p-2 rounded-xl",
          score >= 70 ? "bg-slate-100" : "bg-orange-50"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className={cn("text-sm font-bold", colors.text)}>{score}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", colors.gradient)}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: delay + 0.2 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function FinResolveScoreModal({
  isOpen,
  onClose,
}: FinResolveScoreModalProps) {
  const { profile } = useFinancial();

  const { score, recommendation } = useMemo(() => {
    const scoreData = calculateFinResolveScore(profile);
    const recommendationData = generateScoreRecommendation(profile, scoreData);
    return { score: scoreData, recommendation: recommendationData };
  }, [profile]);

  const colors = getScoreColor(score.overall);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-8 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-white mb-1"
              >
                FinResolve Score
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-slate-400"
              >
                Your financial health at a glance
              </motion.p>

              {/* Score Ring */}
              <div className="flex justify-center mt-6">
                <ScoreRing score={score.overall} />
              </div>

              {/* Label Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className={cn(
                  "inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full text-sm font-semibold",
                  score.overall >= 85
                    ? "bg-emerald-500/20 text-emerald-300"
                    : score.overall >= 70
                      ? "bg-blue-500/20 text-blue-300"
                      : score.overall >= 55
                        ? "bg-amber-500/20 text-amber-300"
                        : score.overall >= 40
                          ? "bg-orange-500/20 text-orange-300"
                          : "bg-red-500/20 text-red-300"
                )}
              >
                {score.label}
              </motion.div>
            </div>

            {/* Score Breakdown */}
            <div className="px-6 py-5 space-y-4">
              <SubScoreItem
                label="Spending Control"
                score={score.spendingControl}
                icon={<Wallet className="w-4 h-4 text-slate-600" />}
                delay={0.4}
              />
              <SubScoreItem
                label="Savings Consistency"
                score={score.savingsConsistency}
                icon={<TrendingUp className="w-4 h-4 text-slate-600" />}
                delay={0.5}
              />
              <SubScoreItem
                label="Goal Progress"
                score={score.goalProgress}
                icon={<Target className="w-4 h-4 text-slate-600" />}
                delay={0.6}
              />
              <SubScoreItem
                label="Risk Alerts"
                score={score.riskAlerts}
                icon={<ShieldCheck className="w-4 h-4 text-slate-600" />}
                delay={0.7}
              />
            </div>

            {/* AI Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mx-6 mb-6 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100"
            >
              <div className="flex gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shrink-0 h-fit">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-600 mb-1">
                    AI Recommendation
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {recommendation.primaryAction}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
