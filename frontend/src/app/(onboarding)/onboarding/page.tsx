"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useFinancial } from "@/contexts/FinancialContext";
import { useAuth } from "@/contexts/AuthContext";

// Components
import { WizardLayout } from "@/components/onboarding/WizardLayout";
import { StepWelcome } from "@/components/onboarding/StepWelcome";
import { StepIncome } from "@/components/onboarding/StepIncome";
import { StepExpenses } from "@/components/onboarding/StepExpenses";
import { StepGoals } from "@/components/onboarding/StepGoals";

import { SpendingCategory } from "@/lib/types";

type Step = "welcome" | "income" | "expenses" | "goals";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    profile,
    setUserName,
    updateIncome,
    addSpendingSummary,
    addGoal,
    isLoading,
    completeOnboarding,
  } = useFinancial();

  const [currentStep, setCurrentStep] = useState<Step>("welcome");

  // Check if already onboarded
  useEffect(() => {
    if (!isLoading && profile.hasCompletedOnboarding) {
      router.push("/dashboard");
    }
  }, [profile.hasCompletedOnboarding, router, isLoading]);

  // Derived user name
  const emailName = user?.email?.split("@")[0] || "";

  const handleBack = () => {
    switch (currentStep) {
      case "income":
        setCurrentStep("welcome");
        break;
      case "expenses":
        setCurrentStep("income");
        break;
      case "goals":
        setCurrentStep("expenses");
        break;
    }
  };

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    setCurrentStep("income");
  };

  const handleIncomeComplete = (amount: number) => {
    updateIncome({
      amount,
      confidence: "high",
      isEstimate: false,
      frequency: "monthly",
    });
    setCurrentStep("expenses");
  };

  const handleExpensesComplete = (
    categories: { category: SpendingCategory; amount: number }[],
  ) => {
    // Clear existing (if any retry) and add new
    categories.forEach((c) => {
      addSpendingSummary(c.category, c.amount, "medium");
    });
    setCurrentStep("goals");
  };

  const handleGoalsComplete = async (goals: string[]) => {
    // Add selected goals
    goals.forEach((goal) => {
      addGoal({
        id: crypto.randomUUID(),
        name: goal,
        target: 1000000, // Default target, user can edit later
        current: 0,
        priority: "medium",
        createdAt: new Date().toISOString(),
      });
    });

    await completeOnboarding();
    router.push("/dashboard");
  };

  // Render helpers
  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <WizardLayout
            title="Welcome to FinResolve"
            subtitle="I'm your AI financial coach. Let's get to know you better so I can help you build wealth."
            currentStep={1}
            totalSteps={4}
            showBack={false}
          >
            <StepWelcome
              onComplete={handleWelcomeComplete}
              initialName={profile.name || emailName}
            />
          </WizardLayout>
        );

      case "income":
        return (
          <WizardLayout
            title="Let's start with a baseline"
            subtitle="What is your approximate monthly net income?"
            currentStep={2}
            totalSteps={4}
            onBack={handleBack}
          >
            <StepIncome
              onComplete={handleIncomeComplete}
              initialValue={profile.income?.amount}
            />
          </WizardLayout>
        );

      case "expenses":
        return (
          <WizardLayout
            title="Where does your money go?"
            subtitle="Select the top categories you spend the most on each month."
            currentStep={3}
            totalSteps={4}
            onBack={handleBack}
          >
            <StepExpenses onComplete={handleExpensesComplete} />
          </WizardLayout>
        );

      case "goals":
        return (
          <WizardLayout
            title="What's your main focus?"
            subtitle="Select up to 5 goals that matter most to you right now."
            currentStep={4}
            totalSteps={4}
            onBack={handleBack}
          >
            <StepGoals onComplete={handleGoalsComplete} />
          </WizardLayout>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="h-full w-full"
      >
        {renderStep()}
      </motion.div>
    </AnimatePresence>
  );
}
