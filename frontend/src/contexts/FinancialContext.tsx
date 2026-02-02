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
  type Account,
  type Budget,
  type RecurringItem,
  createEmptyProfile,
} from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Storage key for localStorage fallback - per user to prevent cross-user data leakage
const getStorageKey = (userId: string | null) =>
  userId ? `finresolve-profile-${userId}` : "finresolve-profile-anonymous";

// Context type
interface FinancialContextType {
  profile: UserFinancialProfile;
  isLoading: boolean;
  isSyncing: boolean;
  updateIncome: (income: IncomeData) => void;
  // Account methods
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  // Budget methods
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  // Recurring methods
  addRecurringItem: (item: RecurringItem) => void;
  updateRecurringItem: (id: string, updates: Partial<RecurringItem>) => void;
  deleteRecurringItem: (id: string) => void;
  // Existing methods
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
  completeOnboarding: () => Promise<void>;
  setUserName: (name: string) => void;
  resetProfile: () => void;
  calculateDataCompleteness: () => number;
}

const FinancialContext = createContext<FinancialContextType | undefined>(
  undefined,
);

// Provider component
export function FinancialProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] =
    useState<UserFinancialProfile>(createEmptyProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load profile from Supabase or localStorage
  useEffect(() => {
    async function loadProfile() {
      // Wait for auth to finish loading
      if (authLoading) return;

      try {
        // If user is authenticated, load their profile from Supabase
        if (user) {
          console.log("Loading profile for user:", user.id);

          const { data: dbProfile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(); // Use maybeSingle to avoid error when no rows

          console.log("Profile query result:", {
            dbProfile: dbProfile
              ? {
                  id: dbProfile.id,
                  user_id: dbProfile.user_id,
                  has_completed_onboarding: dbProfile.has_completed_onboarding,
                }
              : null,
            error,
          });

          if (dbProfile && !error) {
            // Load related data
            const [
              spendingRes,
              summariesRes,
              goalsRes,
              accountsRes,
              budgetsRes,
              recurringRes,
            ] = await Promise.all([
              supabase
                .from("spending_entries")
                .select("*")
                .eq("profile_id", dbProfile.id),
              supabase
                .from("spending_summaries")
                .select("*")
                .eq("profile_id", dbProfile.id),
              supabase
                .from("savings_goals")
                .select("*")
                .eq("profile_id", dbProfile.id),
              supabase
                .from("accounts")
                .select("*")
                .eq("profile_id", dbProfile.id),
              supabase
                .from("budgets")
                .select("*")
                .eq("profile_id", dbProfile.id),
              supabase
                .from("recurring_items")
                .select("*")
                .eq("profile_id", dbProfile.id),
            ]);

            // Convert DB format to app format
            const loadedProfile: UserFinancialProfile = {
              id: dbProfile.id,
              name: dbProfile.name || undefined,
              income: dbProfile.income_amount
                ? {
                    amount: Number(dbProfile.income_amount),
                    confidence: dbProfile.income_confidence as
                      | "high"
                      | "medium"
                      | "low",
                    isEstimate: dbProfile.income_is_estimate,
                    frequency: dbProfile.income_frequency as
                      | "monthly"
                      | "weekly"
                      | "yearly",
                    source: dbProfile.income_source || undefined,
                  }
                : null,
              monthlySpending: (spendingRes.data || []).map((e) => ({
                id: e.id,
                category: e.category as SpendingCategory,
                amount: Number(e.amount),
                confidence: e.confidence as "high" | "medium" | "low",
                source: e.source as "manual" | "upload" | "estimated",
                description: e.description || undefined,
                date: e.date || undefined,
                merchantName: e.merchant_name || undefined,
                accountId: e.account_id || undefined,
                isRecurring: e.is_recurring,
                type: e.type as "expense" | "income" | "transfer",
              })),
              spendingSummary: (summariesRes.data || []).map((s) => ({
                category: s.category as SpendingCategory,
                total: Number(s.total),
                confidence: s.confidence as "high" | "medium" | "low",
                transactionCount: s.transaction_count,
              })),
              goals: (goalsRes.data || []).map((g) => ({
                id: g.id,
                name: g.name,
                target: Number(g.target),
                current: Number(g.current),
                deadline: g.deadline || undefined,
                priority: g.priority as "high" | "medium" | "low",
                createdAt: g.created_at,
              })),
              accounts: (accountsRes.data || []).map((a) => ({
                id: a.id,
                name: a.name,
                type: a.type as any,
                balance: Number(a.balance),
                currency: a.currency,
                isPrimary: a.is_primary,
              })),
              budgets: (budgetsRes.data || []).map((b) => ({
                id: b.id,
                category: b.category as SpendingCategory,
                limit: Number(b.limit_amount),
                period: b.period as any,
                spent:
                  (summariesRes.data || []).find(
                    (s) => s.category === b.category,
                  )?.total || 0,
              })),
              recurringItems: (recurringRes.data || []).map((r) => ({
                id: r.id,
                name: r.name,
                amount: Number(r.amount),
                frequency: r.frequency as any,
                nextDueDate: r.next_due_date || undefined,
                category: (r.category as SpendingCategory) || "other",
                isActive: r.is_active,
              })),
              hasCompletedOnboarding: dbProfile.has_completed_onboarding,
              lastUpdated: dbProfile.updated_at,
              dataCompleteness: dbProfile.data_completeness,
            };

            setProfile(loadedProfile);
            localStorage.setItem(
              getStorageKey(user.id),
              JSON.stringify(loadedProfile),
            );
            console.log("Loaded profile for user:", user.id);
          } else {
            // No profile in Supabase - check localStorage as fallback
            console.log(
              "No profile in Supabase for user, checking localStorage",
            );
            const stored = localStorage.getItem(getStorageKey(user.id));
            if (stored) {
              const localProfile = JSON.parse(stored) as UserFinancialProfile;
              console.log(
                "Found localStorage profile, hasCompletedOnboarding:",
                localProfile.hasCompletedOnboarding,
              );
              // Use local profile and sync to Supabase
              setProfile(localProfile);
            } else {
              console.log("No profile found anywhere, creating new one");
              const newProfile = createEmptyProfile();
              setProfile(newProfile);
            }
          }
        } else {
          // No authenticated user - try localStorage for anonymous usage
          const stored = localStorage.getItem(getStorageKey(null));
          if (stored) {
            const localProfile = JSON.parse(stored) as UserFinancialProfile;
            setProfile(localProfile);
            console.log("Using localStorage profile (not authenticated)");
          }
        }
      } catch (error) {
        console.error("Failed to load financial profile:", error);
        // Try localStorage as fallback
        const stored = localStorage.getItem(getStorageKey(user?.id || null));
        if (stored) {
          setProfile(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user, authLoading]);

  // Save to Supabase and localStorage
  const saveToSupabase = useCallback(
    async (newProfile: UserFinancialProfile) => {
      if (!user?.id) {
        // Not authenticated, just save to localStorage
        localStorage.setItem(getStorageKey(null), JSON.stringify(newProfile));
        return;
      }

      setIsSyncing(true);
      try {
        // Save to localStorage first (immediate)
        localStorage.setItem(
          getStorageKey(user.id),
          JSON.stringify(newProfile),
        );

        // First, check if a profile already exists for this user
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const profileId = existingProfile?.id || newProfile.id;

        // Update the local profile with the correct ID if needed
        if (existingProfile?.id && existingProfile.id !== newProfile.id) {
          newProfile = { ...newProfile, id: existingProfile.id };
          localStorage.setItem(
            getStorageKey(user.id),
            JSON.stringify(newProfile),
          );
        }

        const profileData = {
          id: profileId,
          user_id: user.id,
          name: newProfile.name || null,
          income_amount: newProfile.income?.amount || null,
          income_confidence: newProfile.income?.confidence || null,
          income_is_estimate: newProfile.income?.isEstimate || false,
          income_frequency: newProfile.income?.frequency || "monthly",
          income_source: newProfile.income?.source || null,
          has_completed_onboarding: newProfile.hasCompletedOnboarding,
          data_completeness: newProfile.dataCompleteness,
          updated_at: new Date().toISOString(),
        };
        console.log("Saving profile to Supabase:", {
          id: profileData.id,
          user_id: profileData.user_id,
          has_completed_onboarding: profileData.has_completed_onboarding,
        });

        // Use upsert with id as conflict target (primary key)
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(profileData, { onConflict: "id" });

        if (profileError) {
          console.error("Error saving profile to Supabase:", profileError);
          return;
        }

        // Sync Accounts
        const { data: existingAccounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("profile_id", profileId);

        const existingAccountIds = new Set(
          existingAccounts?.map((a) => a.id) || [],
        );
        const currentAccountIds = new Set(newProfile.accounts.map((a) => a.id));

        const accountsToDelete = [...existingAccountIds].filter(
          (id) => !currentAccountIds.has(id),
        );

        if (accountsToDelete.length > 0) {
          await supabase.from("accounts").delete().in("id", accountsToDelete);
        }

        if (newProfile.accounts.length > 0) {
          const upserts = newProfile.accounts.map((a) => ({
            id: a.id,
            profile_id: profileId,
            name: a.name,
            type: a.type,
            balance: a.balance,
            currency: a.currency,
            is_primary: a.isPrimary,
          }));
          await supabase.from("accounts").upsert(upserts);
        }

        // Sync Budgets
        const { data: existingBudgets } = await supabase
          .from("budgets")
          .select("id")
          .eq("profile_id", profileId);

        const existingBudgetIds = new Set(
          existingBudgets?.map((b) => b.id) || [],
        );
        const currentBudgetIds = new Set(newProfile.budgets.map((b) => b.id));

        const budgetsToDelete = [...existingBudgetIds].filter(
          (id) => !currentBudgetIds.has(id),
        );

        if (budgetsToDelete.length > 0) {
          await supabase.from("budgets").delete().in("id", budgetsToDelete);
        }

        if (newProfile.budgets.length > 0) {
          const upserts = newProfile.budgets.map((b) => ({
            id: b.id,
            profile_id: profileId,
            category: b.category,
            limit_amount: b.limit,
            period: b.period,
          }));
          await supabase.from("budgets").upsert(upserts);
        }

        // Sync Recurring Items
        const { data: existingRecurring } = await supabase
          .from("recurring_items")
          .select("id")
          .eq("profile_id", profileId);

        const existingRecurringIds = new Set(
          existingRecurring?.map((r) => r.id) || [],
        );
        const currentRecurringIds = new Set(
          newProfile.recurringItems.map((r) => r.id),
        );

        const recurringToDelete = [...existingRecurringIds].filter(
          (id) => !currentRecurringIds.has(id),
        );

        if (recurringToDelete.length > 0) {
          await supabase
            .from("recurring_items")
            .delete()
            .in("id", recurringToDelete);
        }

        if (newProfile.recurringItems.length > 0) {
          const upserts = newProfile.recurringItems.map((r) => ({
            id: r.id,
            profile_id: profileId,
            name: r.name,
            amount: r.amount,
            frequency: r.frequency,
            next_due_date: r.nextDueDate || null,
            category: r.category,
            is_active: r.isActive,
          }));
          await supabase.from("recurring_items").upsert(upserts);
        }

        // Sync spending summaries
        if (newProfile.spendingSummary.length > 0) {
          // Delete existing summaries and insert new ones
          await supabase
            .from("spending_summaries")
            .delete()
            .eq("profile_id", newProfile.id);

          const summariesToInsert = newProfile.spendingSummary.map((s) => ({
            profile_id: newProfile.id,
            category: s.category,
            total: s.total,
            confidence: s.confidence,
            transaction_count: s.transactionCount,
          }));

          await supabase.from("spending_summaries").insert(summariesToInsert);
        }

        // Sync goals
        const { data: existingGoals } = await supabase
          .from("savings_goals")
          .select("id")
          .eq("profile_id", newProfile.id);

        const existingGoalIds = new Set(existingGoals?.map((g) => g.id) || []);
        const currentGoalIds = new Set(newProfile.goals.map((g) => g.id));

        // Delete removed goals
        const goalsToDelete = [...existingGoalIds].filter(
          (id) => !currentGoalIds.has(id),
        );
        if (goalsToDelete.length > 0) {
          await supabase.from("savings_goals").delete().in("id", goalsToDelete);
        }

        // Upsert current goals
        if (newProfile.goals.length > 0) {
          const goalsToUpsert = newProfile.goals.map((g) => ({
            id: g.id,
            profile_id: newProfile.id,
            name: g.name,
            target: g.target,
            current: g.current,
            deadline: g.deadline || null,
            priority: g.priority,
            created_at: g.createdAt,
          }));

          await supabase.from("savings_goals").upsert(goalsToUpsert);
        }

        // Sync Spending Entries
        if (newProfile.monthlySpending.length > 0) {
          // For spending entries, we only upsert to avoid deleting historical data
          // that might not be loaded in the current profile (if we only load monthly).
          // However, assuming profile.monthlySpending contains ALL loaded entries we want to persist.
          // Let's stick to upserting the current ones.

          const upserts = newProfile.monthlySpending.map((entry) => ({
            id: entry.id,
            profile_id: profileId,
            category: entry.category,
            amount: entry.amount,
            confidence: entry.confidence,
            source: entry.source,
            description: entry.description || null,
            date: entry.date || null,
            merchant_name: entry.merchantName || null,
            account_id: entry.accountId || null,
            is_recurring: entry.isRecurring || false,
            type: entry.type || "expense",
          }));

          const { error: spendingError } = await supabase
            .from("spending_entries")
            .upsert(upserts);

          if (spendingError) {
            console.error("Error syncing spending entries:", spendingError);
          }
        }

        console.log("Profile synced to Supabase");
      } catch (error) {
        console.error("Failed to sync to Supabase:", error);
      } finally {
        setIsSyncing(false);
      }
    },
    [user],
  );

  // Debounced save effect
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        saveToSupabase(profile);
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timer);
    }
  }, [profile, isLoading, saveToSupabase]);

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

  // --- NEW HELPER METHODS ---

  const addAccount = useCallback((account: Account) => {
    setProfile((p) => ({ ...p, accounts: [...p.accounts, account] }));
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setProfile((p) => ({
      ...p,
      accounts: p.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setProfile((p) => ({
      ...p,
      accounts: p.accounts.filter((a) => a.id !== id),
    }));
  }, []);

  const addBudget = useCallback((budget: Budget) => {
    setProfile((p) => ({ ...p, budgets: [...p.budgets, budget] }));
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setProfile((p) => ({
      ...p,
      budgets: p.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setProfile((p) => ({
      ...p,
      budgets: p.budgets.filter((b) => b.id !== id),
    }));
  }, []);

  const addRecurringItem = useCallback((item: RecurringItem) => {
    setProfile((p) => ({ ...p, recurringItems: [...p.recurringItems, item] }));
  }, []);

  const updateRecurringItem = useCallback(
    (id: string, updates: Partial<RecurringItem>) => {
      setProfile((p) => ({
        ...p,
        recurringItems: p.recurringItems.map((r) =>
          r.id === id ? { ...r, ...updates } : r,
        ),
      }));
    },
    [],
  );

  const deleteRecurringItem = useCallback((id: string) => {
    setProfile((p) => ({
      ...p,
      recurringItems: p.recurringItems.filter((r) => r.id !== id),
    }));
  }, []);

  // Add spending entry
  const addSpending = useCallback((entry: SpendingEntry) => {
    setProfile((prev) => {
      // If linked to an account, deduct balance
      let newAccounts = [...prev.accounts];
      if (entry.accountId) {
        newAccounts = newAccounts.map((acc) => {
          if (acc.id === entry.accountId) {
            return { ...acc, balance: acc.balance - entry.amount };
          }
          return acc;
        });
      }

      return {
        ...prev,
        accounts: newAccounts,
        monthlySpending: [...prev.monthlySpending, entry],
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  // Add spending summary for a category
  const addSpendingSummary = useCallback(
    (
      category: SpendingCategory,
      amount: number,
      confidence: "high" | "medium" | "low",
    ) => {
      setProfile((prev) => {
        // Update summary
        let newSummaries = [...prev.spendingSummary];
        const existingIndex = newSummaries.findIndex(
          (s) => s.category === category,
        );

        if (existingIndex >= 0) {
          newSummaries[existingIndex] = {
            ...newSummaries[existingIndex],
            total: newSummaries[existingIndex].total + amount,
            transactionCount: newSummaries[existingIndex].transactionCount + 1,
          };
        } else {
          newSummaries.push({
            category,
            total: amount,
            confidence,
            transactionCount: 1,
          });
        }

        // Update budget spent too
        const newBudgets = prev.budgets.map((b) => {
          if (b.category === category) {
            return { ...b, spent: b.spent + amount };
          }
          return b;
        });

        return {
          ...prev,
          spendingSummary: newSummaries,
          budgets: newBudgets,
          lastUpdated: new Date().toISOString(),
        };
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

  // Complete onboarding - saves immediately to prevent navigation interruption
  const completeOnboarding = useCallback(async () => {
    const updatedProfile = {
      ...profile,
      hasCompletedOnboarding: true,
      lastUpdated: new Date().toISOString(),
    };
    setProfile(updatedProfile);
    // Save immediately instead of waiting for debounce
    await saveToSupabase(updatedProfile);
    console.log("Onboarding completed and saved to Supabase");
  }, [profile, saveToSupabase]);

  // Set user name
  const setUserName = useCallback((name: string) => {
    setProfile((prev) => ({
      ...prev,
      name,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Reset profile
  const resetProfile = useCallback(async () => {
    const oldProfileId = profile.id;
    const newProfile = createEmptyProfile();
    setProfile(newProfile);
    localStorage.removeItem(getStorageKey(user?.id || null));

    // Delete from Supabase
    try {
      await supabase.from("profiles").delete().eq("id", oldProfileId);
      console.log("Profile deleted from Supabase");
    } catch (error) {
      console.error("Failed to delete from Supabase:", error);
    }
  }, [profile.id, user?.id]);

  return (
    <FinancialContext.Provider
      value={{
        profile,
        isLoading,
        isSyncing,
        updateIncome,
        addAccount,
        updateAccount,
        deleteAccount,
        addBudget,
        updateBudget,
        deleteBudget,
        addRecurringItem,
        updateRecurringItem,
        deleteRecurringItem,
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
