"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Upload, CheckCircle2 } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useFinancial } from "@/contexts/FinancialContext";
import {
  parseFinancialInput,
  parseMultipleAmounts,
  formatCurrency,
} from "@/lib/parseInput";
import { type OnboardingStage, type OnboardingMessage } from "@/lib/types";

// Onboarding stages configuration
const STAGE_CONFIG: Record<
  OnboardingStage,
  { prompt: string; followUp?: string }
> = {
  welcome: {
    prompt:
      "Hey there! 👋 I'm your AI financial coach. I'm here to help you understand your money better — no spreadsheets, no complex forms.\n\nTo get started, what should I call you?",
  },
  income: {
    prompt:
      'Nice to meet you, {name}! 💫\n\nLet\'s start with the basics. Roughly how much do you earn monthly? Don\'t worry about being exact — estimates like "about ₦300k" or "between ₦200k-400k" work great!',
    followUp:
      'Got it! I\'ve noted that down. 📝\n\nNow, what are your biggest monthly expenses? You can list a few, like "I spend about ₦50k on food, ₦30k on transport"',
  },
  expenses: {
    prompt:
      'Now tell me about your typical monthly expenses. Which categories do you spend the most on? You can say things like:\n• "I spend about ₦80k on food"\n• "Rent is ₦150k"\n• "Transport costs around ₦40k"',
    followUp:
      "Great! Anything else you spend regularly on? (Just say \"that's all\" if you're done)",
  },
  goals: {
    prompt:
      "Awesome! 🎯 Last question: Do you have any savings goals? Maybe you're saving for something specific, or building an emergency fund?\n\nJust say \"skip\" if you'd rather set goals later.",
  },
  complete: {
    prompt:
      "Perfect! I've got a picture of your finances now. 🎉\n\nRemember, you don't need perfect data to start — we can refine things as we go. Ready to see your dashboard?",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const {
    profile,
    updateIncome,
    addSpendingSummary,
    setUserName,
    completeOnboarding,
    addGoal,
  } = useFinancial();
  const [stage, setStage] = useState<OnboardingStage>("welcome");
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [_userName, setLocalUserName] = useState("");
  const [expenseCount, setExpenseCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const addAssistantMessage = useCallback(
    (content: string) => {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content,
            timestamp: new Date().toISOString(),
            metadata: { stage },
          },
        ]);
        setIsTyping(false);
      }, 600);
    },
    [stage],
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      addAssistantMessage(STAGE_CONFIG.welcome.prompt);
    }
  }, [addAssistantMessage]);

  // Check if already onboarded
  useEffect(() => {
    if (profile.hasCompletedOnboarding) {
      router.push("/dashboard");
    }
  }, [profile.hasCompletedOnboarding, router]);

  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSend = (content: string) => {
    addUserMessage(content);

    // Process based on current stage
    switch (stage) {
      case "welcome":
        handleNameInput(content);
        break;
      case "income":
        handleIncomeInput(content);
        break;
      case "expenses":
        handleExpenseInput(content);
        break;
      case "goals":
        handleGoalInput(content);
        break;
      case "complete":
        handleComplete();
        break;
    }
  };

  const handleNameInput = (content: string) => {
    const name = content.trim().split(" ")[0]; // Get first name
    setLocalUserName(name);
    setUserName(name);

    setTimeout(() => {
      const prompt = STAGE_CONFIG.income.prompt.replace("{name}", name);
      addAssistantMessage(prompt);
      setStage("income");
    }, 500);
  };

  const handleIncomeInput = (content: string) => {
    const parsed = parseFinancialInput(content);

    if (parsed.amount) {
      updateIncome({
        amount: parsed.amount,
        confidence: parsed.confidence,
        isEstimate: parsed.hasModifier || parsed.confidence !== "high",
        frequency: "monthly",
      });

      setTimeout(() => {
        addAssistantMessage(
          `Got it! ${formatCurrency(parsed.amount!)} monthly. ${
            parsed.hasModifier ? "(I've noted this as an estimate)" : ""
          }\n\n${STAGE_CONFIG.expenses.prompt}`,
        );
        setStage("expenses");
      }, 500);
    } else {
      setTimeout(() => {
        addAssistantMessage(
          'I didn\'t quite catch that. Could you tell me your approximate monthly income? Something like "₦300k" or "about 250 thousand" works!',
        );
      }, 500);
    }
  };

  const handleExpenseInput = (content: string) => {
    const lowerContent = content.toLowerCase();

    // Check if user is done
    if (
      lowerContent.includes("that's all") ||
      lowerContent.includes("thats all") ||
      lowerContent.includes("done") ||
      lowerContent.includes("nothing else") ||
      lowerContent.includes("no more")
    ) {
      setTimeout(() => {
        addAssistantMessage(STAGE_CONFIG.goals.prompt);
        setStage("goals");
      }, 500);
      return;
    }

    // Parse multiple amounts
    const parsedItems = parseMultipleAmounts(content);

    if (parsedItems.length > 0) {
      let addedCount = 0;

      parsedItems.forEach((item) => {
        if (item.amount && item.category) {
          addSpendingSummary(item.category, item.amount, item.confidence);
          addedCount++;
        } else if (item.amount) {
          // Amount without clear category
          addSpendingSummary("other", item.amount, item.confidence);
          addedCount++;
        }
      });

      setExpenseCount((prev) => prev + addedCount);

      if (addedCount > 0) {
        setTimeout(() => {
          if (expenseCount + addedCount < 3) {
            addAssistantMessage(
              `Added ${addedCount} expense${addedCount > 1 ? "s" : ""}! ✓\n\nAnything else? (housing, utilities, entertainment?) Say \"that's all\" when you're done.`,
            );
          } else {
            addAssistantMessage(
              `Great, that's ${expenseCount + addedCount} categories tracked! 📊\n\n${STAGE_CONFIG.goals.prompt}`,
            );
            setStage("goals");
          }
        }, 500);
      } else {
        setTimeout(() => {
          addAssistantMessage(
            'I noticed some mentions but couldn\'t parse amounts clearly. Try something like "₦50k on food" or "transport is about 30k".',
          );
        }, 500);
      }
    } else {
      setTimeout(() => {
        addAssistantMessage(
          'Could you include amounts? For example: "I spend ₦80k on rent, ₦40k on food"',
        );
      }, 500);
    }
  };

  const handleGoalInput = (content: string) => {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes("skip") || lowerContent.includes("later")) {
      setTimeout(() => {
        addAssistantMessage(STAGE_CONFIG.complete.prompt);
        setStage("complete");
      }, 500);
      return;
    }

    const parsed = parseFinancialInput(content);

    if (parsed.amount) {
      // Try to extract goal name
      const goalPatterns = [
        /(?:save|saving)\s+(?:for|towards?)\s+(?:an?\s+)?(.+?)(?:\s+of|\s*$)/i,
        /(?:want|need)\s+(?:to\s+)?(?:buy|get|have)\s+(?:an?\s+)?(.+?)(?:\s+costing|\s*$)/i,
      ];

      let goalName = "Savings Goal";
      for (const pattern of goalPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          goalName = match[1].trim();
          break;
        }
      }

      addGoal({
        id: crypto.randomUUID(),
        name: goalName,
        target: parsed.amount,
        current: 0,
        priority: "medium",
        createdAt: new Date().toISOString(),
      });

      setTimeout(() => {
        addAssistantMessage(
          `Perfect! I've set a goal for "${goalName}" at ${formatCurrency(parsed.amount!)}. 🎯\n\n${STAGE_CONFIG.complete.prompt}`,
        );
        setStage("complete");
      }, 500);
    } else {
      setTimeout(() => {
        addAssistantMessage(
          'What\'s your savings target? You can say "I want to save ₦500k for an emergency fund" or just "skip" to set goals later.',
        );
      }, 500);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    router.push("/dashboard");
  };

  const handleSkipToUpload = () => {
    // TODO: Open upload modal
    router.push("/dashboard?upload=true");
  };

  // Progress indicator
  const stages: OnboardingStage[] = [
    "welcome",
    "income",
    "expenses",
    "goals",
    "complete",
  ];
  const currentIndex = stages.indexOf(stage);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold">F</span>
          </div>
          <span className="font-bold text-slate-900">FinResolve</span>
        </div>

        <button
          onClick={handleSkipToUpload}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload statement instead
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ChatMessage role={msg.role} content={msg.content} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4"
            >
              <div className="flex bg-primary/10 w-8 h-8 rounded-full items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          {stage === "complete" ? (
            <button
              onClick={handleComplete}
              className="w-full py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <ChatInput onSend={handleSend} disabled={isTyping} />
          )}
        </div>
      </div>
    </div>
  );
}
