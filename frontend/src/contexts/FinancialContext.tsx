"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type UserFinancialProfile,
  type SpendingEntry,
  type SavingsGoal,
  type IncomeData,
  type SpendingSummary,
  type SpendingCategory,
  createEmptyProfile,
} from "@/lib/types";

// Storage key
const STORAGE_KEY = "finresolve-profile";

// Context type
interface FinancialContextType {
  profile: UserFinancialProfile;
  isLoading: boolean;
  updateIncome: (income: IncomeData) => void;
  addSpending: (entry: SpendingEntry) => void;
  addSpendingSummary: (
    category: SpendingCategory,
    amount: number,
    confidence: "high" | "medium" | "low",
  ) => void;
  updateSpendingSummary: (summaries: SpendingSummary[]) => void;
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  mergeUploadedData: (spending: SpendingEntry[]) => void;
  completeOnboarding: () => void;
  setUserName: (name: string) => void;
  resetProfile: () => void;
  calculateDataCompleteness: () => number;
}

const FinancialContext = createContext<FinancialContextType | undefined>(
  undefined,
);

// Provider component
export function FinancialProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] =
    useState<UserFinancialProfile>(createEmptyProfile());
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserFinancialProfile;
        setProfile(parsed);
      }
    } catch (error) {
      console.error("Failed to load financial profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (error) {
        console.error("Failed to save financial profile:", error);
      }
    }
  }, [profile, isLoading]);

  // Calculate data completeness
  const calculateDataCompleteness = useCallback((): number => {
    let score = 0;
    const weights = {
      income: 30,
      spending: 40,
      goals: 20,
      name: 10,
    };

    if (profile.income) score += weights.income;
    if (profile.spendingSummary.length > 0) {
      score += Math.min(
        weights.spending,
        (profile.spendingSummary.length / 5) * weights.spending,
      );
    }
    if (profile.goals.length > 0) score += weights.goals;
    if (profile.name) score += weights.name;

    return Math.round(score);
  }, [profile]);

  // Update income
  const updateIncome = useCallback((income: IncomeData) => {
    setProfile((prev) => ({
      ...prev,
      income,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Add spending entry
  const addSpending = useCallback((entry: SpendingEntry) => {
    setProfile((prev) => ({
      ...prev,
      monthlySpending: [...prev.monthlySpending, entry],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Add spending summary for a category
  const addSpendingSummary = useCallback(
    (
      category: SpendingCategory,
      amount: number,
      confidence: "high" | "medium" | "low",
    ) => {
      setProfile((prev) => {
        const existing = prev.spendingSummary.find(
          (s) => s.category === category,
        );
        if (existing) {
          // Update existing
          return {
            ...prev,
            spendingSummary: prev.spendingSummary.map((s) =>
              s.category === category
                ? {
                    ...s,
                    total: s.total + amount,
                    transactionCount: s.transactionCount + 1,
                  }
                : s,
            ),
            lastUpdated: new Date().toISOString(),
          };
        } else {
          // Add new
          return {
            ...prev,
            spendingSummary: [
              ...prev.spendingSummary,
              { category, total: amount, confidence, transactionCount: 1 },
            ],
            lastUpdated: new Date().toISOString(),
          };
        }
      });
    },
    [],
  );

  // Update spending summary
  const updateSpendingSummary = useCallback((summaries: SpendingSummary[]) => {
    setProfile((prev) => ({
      ...prev,
      spendingSummary: summaries,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Add goal
  const addGoal = useCallback((goal: SavingsGoal) => {
    setProfile((prev) => ({
      ...prev,
      goals: [...prev.goals, goal],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Update goal
  const updateGoal = useCallback(
    (id: string, updates: Partial<SavingsGoal>) => {
      setProfile((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        lastUpdated: new Date().toISOString(),
      }));
    },
    [],
  );

  // Delete goal
  const deleteGoal = useCallback((id: string) => {
    setProfile((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Merge uploaded data
  const mergeUploadedData = useCallback((spending: SpendingEntry[]) => {
    setProfile((prev) => ({
      ...prev,
      monthlySpending: [...prev.monthlySpending, ...spending],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Set user name
  const setUserName = useCallback((name: string) => {
    setProfile((prev) => ({
      ...prev,
      name,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Reset profile
  const resetProfile = useCallback(() => {
    const newProfile = createEmptyProfile();
    setProfile(newProfile);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <FinancialContext.Provider
      value={{
        profile,
        isLoading,
        updateIncome,
        addSpending,
        addSpendingSummary,
        updateSpendingSummary,
        addGoal,
        updateGoal,
        deleteGoal,
        mergeUploadedData,
        completeOnboarding,
        setUserName,
        resetProfile,
        calculateDataCompleteness,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

// Hook to use financial context
export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error("useFinancial must be used within a FinancialProvider");
  }
  return context;
}
