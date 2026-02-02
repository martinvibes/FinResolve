import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface StepWelcomeProps {
  onComplete: (name: string) => void;
  initialName?: string;
}

export function StepWelcome({
  onComplete,
  initialName = "",
}: StepWelcomeProps) {
  const [name, setName] = useState(initialName);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-lg flex flex-col items-center gap-12"
      onSubmit={handleSubmit}
    >
      <div className="relative w-full group">
        <label
          htmlFor="name"
          className={`absolute left-0 transition-all duration-500 ease-out pointer-events-none ${
            name || isFocused
              ? "-top-8 text-sm text-teal-400 font-medium tracking-widest uppercase"
              : "top-2 text-3xl md:text-5xl text-slate-500 font-light"
          }`}
        >
          {name || isFocused ? "Your Name" : "What is your name?"}
        </label>

        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus
          className="w-full bg-transparent border-b border-slate-700/50 focus:border-teal-500 text-4xl md:text-6xl font-light text-white py-4 focus:outline-none transition-all duration-500 placeholder:text-slate-800 placeholder:font-thin"
        />

        {/* Glow effect line */}
        <div
          className={`absolute bottom-0 left-0 h-[2px] bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.7)] transition-all duration-700 ease-out ${
            isFocused ? "w-full opacity-100" : "w-0 opacity-0"
          }`}
        />
      </div>

      <AnimatePresence>
        {name.trim() && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="group flex items-center justify-center gap-3 px-12 py-5 bg-white text-slate-900 text-xl font-medium rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all duration-300"
          >
            Let's Start
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
