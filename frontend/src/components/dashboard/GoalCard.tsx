"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GoalCardProps {
  title: string;
  target: number;
  current: number;
  deadline?: string;
  color?: string;
}

export function GoalCard({
  title,
  target,
  current,
  deadline,
  color = "bg-primary",
}: GoalCardProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border group hover:shadow-md transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
          <p className="text-sm text-gray-400">
            {deadline ? `By ${deadline}` : "No deadline"}
          </p>
        </div>
        <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <div className="mb-2 flex justify-between text-sm font-medium">
        <span className="text-slate-700">₦{current.toLocaleString()}</span>
        <span className="text-gray-400">of ₦{target.toLocaleString()}</span>
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

      <div className="mt-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
        <p className="text-xs text-green-600 font-medium">
          On track! Next deposit: ₦5,000
        </p>
      </div>
    </div>
  );
}
