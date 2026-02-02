import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Check } from "lucide-react";

import { SpendingCategory } from "@/lib/types";

interface StepExpensesProps {
  onComplete: (
    categories: { category: SpendingCategory; amount: number }[],
  ) => void;
  // We're simplifying this step to just selecting TOP categories for now
  // Amounts will be handled logic-side or defaults
}

const EXPENSE_CATEGORIES: {
  id: SpendingCategory;
  label: string;
  emoji: string;
}[] = [
  { id: "housing", label: "Housing/Rent", emoji: "🏠" },
  { id: "transport", label: "Transport", emoji: "🚌" },
  { id: "food", label: "Food & Groceries", emoji: "🍔" },
  { id: "utilities", label: "Utilities", emoji: "💡" },
  { id: "health", label: "Healthcare", emoji: "🏥" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "family", label: "Family & Kids", emoji: "👨‍👩‍👧" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "debt", label: "Debt Repayment", emoji: "💳" },
  { id: "savings", label: "Savings", emoji: "💰" },
  { id: "other", label: "Other", emoji: "📦" },
];

export function StepExpenses({ onComplete }: StepExpensesProps) {
  const [selected, setSelected] = useState<SpendingCategory[]>([]);

  const toggleCategory = (id: SpendingCategory) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((c) => c !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full"
      >
        {EXPENSE_CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <motion.button
              key={cat.id}
              variants={item}
              onClick={() => toggleCategory(cat.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col items-start justify-center p-4 rounded-2xl transition-all duration-300 border h-28 ${
                isSelected
                  ? "bg-teal-500/20 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                  : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
              }`}
            >
              <span className="text-3xl filter drop-shadow-md mb-2">
                {cat.emoji}
              </span>
              <span
                className={`font-medium transition-colors text-left leading-tight ${isSelected ? "text-white" : "text-slate-400"}`}
              >
                {cat.label}
              </span>

              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white stroke-[3px]" />
                </div>
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
        onClick={() => {
          const result = selected.map((cat) => ({ category: cat, amount: 0 }));
          onComplete(result);
        }}
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
