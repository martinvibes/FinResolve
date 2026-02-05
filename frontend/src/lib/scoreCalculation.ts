// ========================================
// FinResolve Score Calculation Engine
// ========================================

import type { UserFinancialProfile } from "./types";

export interface ScoreBreakdown {
  overall: number;
  label: "Critical" | "Needs Work" | "Stable" | "Strong" | "Excellent";
  spendingControl: number;
  savingsConsistency: number;
  goalProgress: number;
  riskAlerts: number;
}

export interface ScoreRecommendation {
  targetScore: number;
  actions: string[];
  primaryAction: string;
}

/**
 * Calculate the FinResolve financial health score
 * Returns a score from 0-100 with breakdown by category
 */
export function calculateFinResolveScore(
  profile: UserFinancialProfile
): ScoreBreakdown {
  const spendingControl = calculateSpendingControlScore(profile);
  const savingsConsistency = calculateSavingsConsistencyScore(profile);
  const goalProgress = calculateGoalProgressScore(profile);
  const riskAlerts = calculateRiskAlertsScore(profile);

  // Weighted average: Spending (30%), Savings (25%), Goals (25%), Risk (20%)
  const overall = Math.round(
    spendingControl * 0.3 +
      savingsConsistency * 0.25 +
      goalProgress * 0.25 +
      riskAlerts * 0.2
  );

  return {
    overall,
    label: getScoreLabel(overall),
    spendingControl,
    savingsConsistency,
    goalProgress,
    riskAlerts,
  };
}

/**
 * Spending Control Score (0-100)
 * Measures how well user stays within budget
 */
function calculateSpendingControlScore(profile: UserFinancialProfile): number {
  const monthlyIncome = profile.income?.amount || 0;
  if (monthlyIncome === 0) return 50; // Neutral if no income set

  const totalSpending = profile.spendingSummary.reduce(
    (sum, cat) => sum + cat.total,
    0
  );

  // Check budget adherence if budgets exist
  if (profile.budgets.length > 0) {
    const budgetScores = profile.budgets.map((budget) => {
      if (budget.limit === 0) return 100;
      const ratio = budget.spent / budget.limit;
      if (ratio <= 0.8) return 100; // Under 80% = excellent
      if (ratio <= 1.0) return 85; // 80-100% = good
      if (ratio <= 1.2) return 60; // Up to 20% over = warning
      return 30; // More than 20% over = poor
    });
    return Math.round(
      budgetScores.reduce((a, b) => a + b, 0) / budgetScores.length
    );
  }

  // Fallback: Compare spending to income
  const spendingRatio = totalSpending / monthlyIncome;
  if (spendingRatio <= 0.5) return 100; // Spending less than 50%
  if (spendingRatio <= 0.7) return 85; // 50-70%
  if (spendingRatio <= 0.9) return 70; // 70-90%
  if (spendingRatio <= 1.0) return 50; // 90-100%
  return 25; // Over income

}

/**
 * Savings Consistency Score (0-100)
 * Measures regular saving behavior
 */
function calculateSavingsConsistencyScore(
  profile: UserFinancialProfile
): number {
  const monthlyIncome = profile.income?.amount || 0;
  const totalSaved = profile.goals.reduce((sum, g) => sum + g.current, 0);

  // Check savings transactions this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const savingsTransactions = profile.monthlySpending.filter((entry) => {
    if (!entry.date) return false;
    const entryDate = new Date(entry.date);
    return (
      entry.category === "savings" &&
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear
    );
  });

  const monthlySavingsAmount = savingsTransactions.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  // Score based on savings rate
  if (monthlyIncome === 0) {
    // No income set - score based on if they have any savings
    return totalSaved > 0 ? 60 : 40;
  }

  const savingsRate = monthlySavingsAmount / monthlyIncome;

  if (savingsRate >= 0.2) return 100; // Saving 20%+ of income
  if (savingsRate >= 0.15) return 90; // 15-20%
  if (savingsRate >= 0.1) return 80; // 10-15%
  if (savingsRate >= 0.05) return 65; // 5-10%
  if (savingsRate > 0) return 50; // Some savings
  if (totalSaved > 0) return 45; // Has past savings but none this month
  return 30; // No savings behavior
}

/**
 * Goal Progress Score (0-100)
 * Measures progress toward savings goals
 */
function calculateGoalProgressScore(profile: UserFinancialProfile): number {
  if (profile.goals.length === 0) {
    // No goals = neutral score, but encourage setting goals
    return 50;
  }

  const goalScores = profile.goals.map((goal) => {
    const progressPercent = (goal.current / goal.target) * 100;

    // Check if goal has deadline
    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const created = new Date(goal.createdAt);

      const totalDuration = deadline.getTime() - created.getTime();
      const elapsed = now.getTime() - created.getTime();
      const expectedProgress = (elapsed / totalDuration) * 100;

      // Ahead of schedule
      if (progressPercent >= expectedProgress + 10) return 100;
      // On track
      if (progressPercent >= expectedProgress - 10) return 80;
      // Behind but making progress
      if (progressPercent > 0) return 60;
      // No progress
      return 30;
    }

    // No deadline - score based on raw progress
    if (progressPercent >= 100) return 100;
    if (progressPercent >= 75) return 90;
    if (progressPercent >= 50) return 75;
    if (progressPercent >= 25) return 60;
    if (progressPercent > 0) return 45;
    return 30;
  });

  return Math.round(
    goalScores.reduce((a, b) => a + b, 0) / goalScores.length
  );
}

/**
 * Risk Alerts Score (0-100)
 * Lower risk = higher score
 */
function calculateRiskAlertsScore(profile: UserFinancialProfile): number {
  let score = 100;
  const alerts: string[] = [];

  const monthlyIncome = profile.income?.amount || 0;
  const totalSpending = profile.spendingSummary.reduce(
    (sum, cat) => sum + cat.total,
    0
  );
  const totalBalance = profile.accounts.reduce(
    (sum, acc) => sum + acc.balance,
    0
  );

  // Risk 1: No income set
  if (!profile.income || profile.income.amount === 0) {
    score -= 15;
    alerts.push("No income set");
  }

  // Risk 2: Over budget categories
  const overBudgetCount = profile.budgets.filter(
    (b) => b.spent > b.limit
  ).length;
  if (overBudgetCount > 0) {
    score -= Math.min(25, overBudgetCount * 10);
    alerts.push(`${overBudgetCount} over-budget categories`);
  }

  // Risk 3: Spending more than income
  if (monthlyIncome > 0 && totalSpending > monthlyIncome) {
    score -= 20;
    alerts.push("Spending exceeds income");
  }

  // Risk 4: Low account balances (less than 1 month expenses)
  const monthlyExpenses =
    totalSpending > 0 ? totalSpending : monthlyIncome * 0.7;
  if (totalBalance < monthlyExpenses && monthlyExpenses > 0) {
    score -= 15;
    alerts.push("Low emergency buffer");
  }

  // Risk 5: No savings goals
  if (profile.goals.length === 0) {
    score -= 10;
    alerts.push("No savings goals");
  }

  // Risk 6: High recurring costs relative to income
  const recurringTotal = profile.recurringItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  if (monthlyIncome > 0 && recurringTotal / monthlyIncome > 0.5) {
    score -= 10;
    alerts.push("High fixed costs");
  }

  return Math.max(0, score);
}

/**
 * Get label for score
 */
function getScoreLabel(
  score: number
): "Critical" | "Needs Work" | "Stable" | "Strong" | "Excellent" {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Stable";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

/**
 * Generate AI recommendation to improve score
 */
export function generateScoreRecommendation(
  profile: UserFinancialProfile,
  score: ScoreBreakdown
): ScoreRecommendation {
  const actions: string[] = [];
  const targetScore = Math.min(100, score.overall + 15);

  const monthlyIncome = profile.income?.amount || 0;
  const totalSpending = profile.spendingSummary.reduce(
    (sum, cat) => sum + cat.total,
    0
  );

  // Find the weakest area and generate specific recommendations
  const scores = [
    { name: "spendingControl", value: score.spendingControl },
    { name: "savingsConsistency", value: score.savingsConsistency },
    { name: "goalProgress", value: score.goalProgress },
    { name: "riskAlerts", value: score.riskAlerts },
  ].sort((a, b) => a.value - b.value);

  const weakestArea = scores[0];

  // Generate specific actionable recommendations
  if (weakestArea.name === "spendingControl") {
    // Find highest spending category
    const sortedCategories = [...profile.spendingSummary].sort(
      (a, b) => b.total - a.total
    );
    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      const reduction = Math.round(topCategory.total * 0.15);
      if (reduction > 1000) {
        actions.push(
          `Reduce ${topCategory.category} spending by ₦${(reduction / 1000).toFixed(0)}k/week`
        );
      }
    }

    // Check for over-budget categories
    const overBudget = profile.budgets.filter((b) => b.spent > b.limit);
    if (overBudget.length > 0) {
      const worst = overBudget.sort(
        (a, b) => b.spent / b.limit - a.spent / a.limit
      )[0];
      actions.push(`Get ${worst.category} spending under control`);
    }
  }

  if (weakestArea.name === "savingsConsistency") {
    const suggestedSavings = Math.round(monthlyIncome * 0.1);
    if (suggestedSavings > 0) {
      actions.push(
        `Automate ₦${(suggestedSavings / 1000).toFixed(0)}k monthly savings`
      );
    }
    actions.push("Set up a recurring savings transfer");
  }

  if (weakestArea.name === "goalProgress") {
    if (profile.goals.length === 0) {
      actions.push("Create your first savings goal");
    } else {
      const behindGoals = profile.goals.filter((g) => {
        const progress = g.current / g.target;
        return progress < 0.5;
      });
      if (behindGoals.length > 0) {
        actions.push(`Boost your ${behindGoals[0].name} goal progress`);
      }
    }
  }

  if (weakestArea.name === "riskAlerts") {
    if (!profile.income || profile.income.amount === 0) {
      actions.push("Set your monthly income");
    }
    if (profile.budgets.length === 0) {
      actions.push("Create spending budgets");
    }
    if (profile.goals.length === 0) {
      actions.push("Set up an emergency fund goal");
    }
  }

  // Generate primary action summary
  let primaryAction = "";
  if (actions.length >= 2) {
    primaryAction = `To reach ${targetScore} this month, ${actions[0].toLowerCase()} and ${actions[1].toLowerCase()}.`;
  } else if (actions.length === 1) {
    primaryAction = `To reach ${targetScore} this month, ${actions[0].toLowerCase()}.`;
  } else {
    primaryAction =
      score.overall >= 85
        ? "You're doing great! Keep up the good habits."
        : "Keep tracking your spending to improve your score.";
  }

  return {
    targetScore,
    actions,
    primaryAction,
  };
}

/**
 * Get color for score display
 */
export function getScoreColor(score: number): {
  text: string;
  bg: string;
  ring: string;
  gradient: string;
} {
  if (score >= 85) {
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-500",
      ring: "ring-emerald-500",
      gradient: "from-emerald-500 to-teal-500",
    };
  }
  if (score >= 70) {
    return {
      text: "text-blue-600",
      bg: "bg-blue-500",
      ring: "ring-blue-500",
      gradient: "from-blue-500 to-cyan-500",
    };
  }
  if (score >= 55) {
    return {
      text: "text-amber-600",
      bg: "bg-amber-500",
      ring: "ring-amber-500",
      gradient: "from-amber-500 to-yellow-500",
    };
  }
  if (score >= 40) {
    return {
      text: "text-orange-600",
      bg: "bg-orange-500",
      ring: "ring-orange-500",
      gradient: "from-orange-500 to-amber-500",
    };
  }
  return {
    text: "text-red-600",
    bg: "bg-red-500",
    ring: "ring-red-500",
    gradient: "from-red-500 to-orange-500",
  };
}
