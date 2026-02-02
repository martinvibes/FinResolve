import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Plus } from "lucide-react";

interface StepGoalsProps {
  onComplete: (goals: string[]) => void;
  initialGoals?: string[];
}

const GOAL_OPTIONS = [
  { id: "emergency", label: "Emergency Fund", emoji: "🛡️" },
  { id: "debt", label: "Pay off Debt", emoji: "📉" },
  { id: "home", label: "Save for Home", emoji: "🏠" },
  { id: "wealth", label: "Build Wealth", emoji: "💰" },
  { id: "travel", label: "Travel & Fun", emoji: "✈️" },
  { id: "invest", label: "Start Investing", emoji: "📈" },
  { id: "car", label: "Buy a Car", emoji: "🚗" },
  { id: "retire", label: "Retire Early", emoji: "🌅" },
  { id: "business", label: "Start Business", emoji: "🚀" },
  { id: "education", label: "Education", emoji: "🎓" },
  { id: "wedding", label: "Wedding", emoji: "💍" },
  { id: "charity", label: "Charity/Giving", emoji: "🤝" },
];

export function StepGoals({ onComplete, initialGoals = [] }: StepGoalsProps) {
  const [selected, setSelected] = useState<string[]>(initialGoals);

  const toggleGoal = (label: string) => {
    if (selected.includes(label)) {
      setSelected(selected.filter((g) => g !== label));
    } else {
      if (selected.length < 5) {
        setSelected([...selected, label]);
      }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 },
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full"
      >
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = selected.includes(goal.label);
          return (
            <motion.button
              key={goal.id}
              variants={item}
              onClick={() => toggleGoal(goal.label)}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-5 rounded-2xl border transition-all flex flex-col items-start justify-center gap-4 h-36 ${
                isSelected
                  ? "border-teal-500 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.15)] backdrop-blur-sm"
                  : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700"
              }`}
            >
              <div
                className={`p-3 rounded-full transition-colors ${isSelected ? "bg-teal-500/20" : "bg-slate-800"}`}
              >
                <span className="text-3xl filter drop-shadow-md">
                  {goal.emoji}
                </span>
              </div>

              <span
                className={`font-medium text-sm text-center transition-colors ${isSelected ? "text-white" : "text-slate-400"}`}
              >
                {goal.label}
              </span>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-3 h-3 text-white stroke-[3px]" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onComplete(selected)}
        className={`flex items-center justify-center gap-2 px-10 py-4 text-lg font-medium rounded-full shadow-lg transition-all min-w-[200px] ${
          selected.length > 0
            ? "bg-teal-500 text-white shadow-teal-500/25 hover:bg-teal-600"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
        }`}
      >
        {selected.length > 0 ? `Continue (${selected.length})` : "Skip for now"}
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
