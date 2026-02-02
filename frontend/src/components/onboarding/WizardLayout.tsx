import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface WizardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
}

export function WizardLayout({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  showBack = true,
}: WizardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden selection:bg-teal-500/30">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-indigo-900/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1.1, 1, 1.1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] bg-teal-900/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Back Button */}
      {showBack && onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="absolute top-8 left-8 p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      )}

      {/* Main Content Container */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center z-10">
        {/* Progress Rail (Top) */}
        <div className="w-full max-w-xs flex gap-2 mb-16 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i + 1 <= currentStep
                  ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                  : "bg-slate-800"
              }`}
              initial={false}
              animate={{
                backgroundColor: i + 1 <= currentStep ? "#14b8a6" : "#1e293b",
              }}
            />
          ))}
        </div>

        {/* Header Text */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          key={title}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-extralight text-white mb-6 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed font-light">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Dynamic Step Content */}
        <div className="w-full relative min-h-[350px] flex flex-col items-center justify-start">
          {children}
        </div>
      </div>
    </div>
  );
}
