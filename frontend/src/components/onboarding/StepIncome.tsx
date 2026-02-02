import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface StepIncomeProps {
  onComplete: (amount: number) => void;
  initialValue?: number;
}

export function StepIncome({ onComplete, initialValue }: StepIncomeProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue.toLocaleString());
    }
    inputRef.current?.focus();
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digits
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (!rawValue) {
      setValue("");
      return;
    }
    // Format with commas
    const numberValue = parseInt(rawValue, 10);
    setValue(numberValue.toLocaleString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = parseInt(value.replace(/,/g, ""), 10);
    if (cleanValue > 0) {
      onComplete(cleanValue);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg flex flex-col items-center gap-12"
      onSubmit={handleSubmit}
    >
      <div className="relative w-full flex items-center justify-center pixel-antialiased">
        <span className="text-4xl sm:text-6xl text-slate-600 font-extralight mr-4 shrink-0">
          ₦
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="0"
          className="w-auto bg-transparent border-none text-6xl sm:text-8xl font-bold text-white text-center focus:outline-none transition-all placeholder:text-slate-800 min-w-[100px]"
          style={{ width: `${value.length + 1}ch` }}
        />
      </div>

      <p className="text-slate-400 text-lg font-light text-center max-w-xs">
        This is just a baseline. We can refine it later.
      </p>

      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="group mt-8 flex items-center justify-center gap-3 px-10 py-4 bg-teal-500 text-white text-xl font-medium rounded-full shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_50px_rgba(20,184,166,0.5)] transition-all duration-300"
          >
            Continue
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
