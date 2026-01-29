import {
  type UserFinancialProfile,
  type ConfidenceLevel,
  CATEGORY_META,
} from "./types";
import { formatCurrency as formatCurrencyUtil } from "./parseInput";

// ========================================
// AI Logic - Rule-Based Financial Assistant
// ========================================

interface AIResponse {
  content: string;
  confidence?: ConfidenceLevel;
  assumptions?: string[];
}

/**
 * Generate AI response based on user query and financial data
 */
export function generateResponse(
  query: string,
  profile: UserFinancialProfile,
): AIResponse {
  const lowerQuery = query.toLowerCase();

  // Check for different intents
  if (isSpendingQuery(lowerQuery)) {
    return handleSpendingQuery(lowerQuery, profile);
  }

  if (isAffordabilityQuery(lowerQuery)) {
    return handleAffordabilityQuery(lowerQuery, profile);
  }

  if (isSavingsQuery(lowerQuery)) {
    return handleSavingsQuery(lowerQuery, profile);
  }

  if (isIncomeQuery(lowerQuery)) {
    return handleIncomeQuery(profile);
  }

  if (isBudgetQuery(lowerQuery)) {
    return handleBudgetQuery(profile);
  }

  // Default helpful response
  return handleGeneralQuery(query, profile);
}

// Intent detection helpers
function isSpendingQuery(query: string): boolean {
  const keywords = [
    "spending",
    "spend",
    "spent",
    "where is my money",
    "money going",
    "expenses",
    "expense",
  ];
  return keywords.some((k) => query.includes(k));
}

function isAffordabilityQuery(query: string): boolean {
  const keywords = [
    "can i afford",
    "afford",
    "can i buy",
    "enough for",
    "have enough",
  ];
  return keywords.some((k) => query.includes(k));
}

function isSavingsQuery(query: string): boolean {
  const keywords = ["save", "saving", "savings", "goal", "target"];
  return keywords.some((k) => query.includes(k));
}

function isIncomeQuery(query: string): boolean {
  const keywords = ["income", "earn", "salary", "making"];
  return keywords.some((k) => query.includes(k));
}

function isBudgetQuery(query: string): boolean {
  const keywords = ["budget", "left", "remaining", "available"];
  return keywords.some((k) => query.includes(k));
}

// Response handlers
function handleSpendingQuery(
  query: string,
  profile: UserFinancialProfile,
): AIResponse {
  const { spendingSummary, income } = profile;

  if (spendingSummary.length === 0) {
    return {
      content:
        "I don't have much spending data yet! 📊 Would you like to tell me about your typical monthly expenses? You can say something like \"I spend about ₦50k on food\" and I'll help you track it.",
      confidence: undefined,
      assumptions: undefined,
    };
  }

  const totalSpending = spendingSummary.reduce((sum, s) => sum + s.total, 0);
  const topCategories = [...spendingSummary]
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const hasLowConfidence = spendingSummary.some((s) => s.confidence === "low");
  const assumptions: string[] = [];

  if (hasLowConfidence) {
    assumptions.push("Some amounts are rough estimates");
  }

  let content = `Based on what you've shared, here's your spending breakdown:\n\n`;
  content += `**Total Monthly: ${formatCurrencyUtil(totalSpending)}**\n\n`;
  content += `Top spending areas:\n`;

  topCategories.forEach((cat, index) => {
    const meta = CATEGORY_META[cat.category];
    const percentage = income?.amount
      ? ((cat.total / income.amount) * 100).toFixed(0)
      : null;
    content += `${index + 1}. ${meta.emoji} **${meta.label}**: ${formatCurrencyUtil(cat.total)}`;
    if (percentage) {
      content += ` (${percentage}% of income)`;
    }
    content += `\n`;
  });

  if (income?.amount) {
    const remaining = income.amount - totalSpending;
    content += `\n💡 After expenses, you have about ${formatCurrencyUtil(remaining)} remaining monthly.`;
  }

  return {
    content,
    confidence: hasLowConfidence ? "low" : "medium",
    assumptions: assumptions.length > 0 ? assumptions : undefined,
  };
}

function handleAffordabilityQuery(
  query: string,
  profile: UserFinancialProfile,
): AIResponse {
  const { income, spendingSummary, goals } = profile;

  // Try to extract amount from query
  const amountMatch = query.match(/₦?\s*([\d,]+)\s*(k|m)?/i);
  let targetAmount = 0;

  if (amountMatch) {
    targetAmount = parseFloat(amountMatch[1].replace(/,/g, ""));
    const multiplier = amountMatch[2]?.toLowerCase();
    if (multiplier === "k") targetAmount *= 1000;
    if (multiplier === "m") targetAmount *= 1000000;
  }

  if (!income?.amount) {
    return {
      content:
        'I\'d love to help you figure that out! 🤔 First, can you tell me roughly how much you earn monthly? Just say something like "I earn about ₦300k monthly".',
      assumptions: undefined,
    };
  }

  const totalSpending = spendingSummary.reduce((sum, s) => sum + s.total, 0);
  const monthlySurplus = income.amount - totalSpending;
  const assumptions: string[] = [];

  if (income.isEstimate) {
    assumptions.push("Your income is an estimate");
  }
  if (spendingSummary.some((s) => s.confidence === "low")) {
    assumptions.push("Some expenses are rough estimates");
  }

  if (targetAmount > 0) {
    if (targetAmount <= monthlySurplus) {
      return {
        content: `Yes! ✅ You should be able to afford ${formatCurrencyUtil(targetAmount)}. Based on your monthly surplus of ${formatCurrencyUtil(monthlySurplus)}, this fits within your budget. ${goals.length > 0 ? "Just consider your savings goals before spending!" : ""}`,
        confidence: income.isEstimate ? "medium" : "high",
        assumptions: assumptions.length > 0 ? assumptions : undefined,
      };
    } else {
      const monthsNeeded = Math.ceil(targetAmount / monthlySurplus);
      return {
        content: `That might be a stretch right now. 💭\n\nYour monthly surplus is about ${formatCurrencyUtil(monthlySurplus)}. For ${formatCurrencyUtil(targetAmount)}, you'd need to save for about ${monthsNeeded} months, or find ways to reduce spending by ${formatCurrencyUtil(targetAmount - monthlySurplus)} this month.`,
        confidence: "medium",
        assumptions: assumptions.length > 0 ? assumptions : undefined,
      };
    }
  }

  return {
    content: `Right now, you have about ${formatCurrencyUtil(monthlySurplus)} flexibility in your monthly budget after expenses. What are you thinking of buying?`,
    confidence: income.isEstimate ? "low" : "medium",
    assumptions: assumptions.length > 0 ? assumptions : undefined,
  };
}

function handleSavingsQuery(
  query: string,
  profile: UserFinancialProfile,
): AIResponse {
  const { goals, income, spendingSummary } = profile;

  if (goals.length === 0) {
    return {
      content:
        "You haven't set any savings goals yet! 🎯 Would you like to create one? Just tell me what you're saving for and your target amount. For example: \"I want to save ₦500k for an emergency fund\".",
    };
  }

  const totalSpending = spendingSummary.reduce((sum, s) => sum + s.total, 0);
  const monthlySurplus = income?.amount ? income.amount - totalSpending : 0;

  let content = "Here's how your savings goals are looking:\n\n";

  goals.forEach((goal) => {
    const progress = (goal.current / goal.target) * 100;
    const remaining = goal.target - goal.current;
    const monthsToGoal =
      monthlySurplus > 0 ? Math.ceil(remaining / monthlySurplus) : null;

    content += `**${goal.name}**\n`;
    content += `Progress: ${formatCurrencyUtil(goal.current)} / ${formatCurrencyUtil(goal.target)} (${progress.toFixed(0)}%)\n`;
    if (monthsToGoal && monthsToGoal > 0) {
      content += `📅 At your current surplus, you could reach this in ~${monthsToGoal} months\n`;
    }
    content += `\n`;
  });

  return { content };
}

function handleIncomeQuery(profile: UserFinancialProfile): AIResponse {
  const { income } = profile;

  if (!income) {
    return {
      content:
        "I don't have your income on file yet. Would you like to share it? You can say something like \"I earn about ₦400k monthly\" or give a range if you're not sure.",
    };
  }

  return {
    content: `Your recorded monthly income is ${formatCurrencyUtil(income.amount)}. ${income.isEstimate ? "(This is an estimate)" : ""}\n\nWould you like to update this?`,
    confidence: income.confidence,
  };
}

function handleBudgetQuery(profile: UserFinancialProfile): AIResponse {
  const { income, spendingSummary } = profile;

  if (!income?.amount) {
    return {
      content:
        "To help you with budgeting, I need to know your income first. How much do you typically earn monthly?",
    };
  }

  const totalSpending = spendingSummary.reduce((sum, s) => sum + s.total, 0);
  const remaining = income.amount - totalSpending;
  const percentSpent = ((totalSpending / income.amount) * 100).toFixed(0);

  // Get current day of month to estimate weekly budget
  const now = new Date();
  const daysRemaining =
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() -
    now.getDate();
  const dailyBudget = remaining / Math.max(daysRemaining, 1);
  const weeklyBudget = dailyBudget * 7;

  return {
    content: `💰 **Budget Overview**\n\nYou've allocated ${formatCurrencyUtil(totalSpending)} (${percentSpent}% of income) to expenses.\n\n**Remaining this month:** ${formatCurrencyUtil(remaining)}\n**Daily budget:** ~${formatCurrencyUtil(dailyBudget)}\n**Weekly budget:** ~${formatCurrencyUtil(weeklyBudget)}`,
    confidence: income.isEstimate ? "medium" : "high",
    assumptions: income.isEstimate ? ["Income is an estimate"] : undefined,
  };
}

function handleGeneralQuery(
  query: string,
  profile: UserFinancialProfile,
): AIResponse {
  const { hasCompletedOnboarding, name } = profile;
  const greeting = name ? `${name}` : "there";

  if (!hasCompletedOnboarding) {
    return {
      content: `Hey ${greeting}! 👋 I'm here to help you understand your money better. You can ask me things like:\n\n• "Where is my money going?"\n• "Can I afford a ₦100k purchase?"\n• "Help me save ₦50k this month"\n\nOr just tell me about your income and expenses, and I'll help you make sense of it all!`,
    };
  }

  return {
    content: `I'm here to help! You can ask me about:\n\n📊 Your spending patterns\n💰 Whether you can afford something\n🎯 Your savings goals\n📈 Your budget status\n\nWhat would you like to know?`,
  };
}

/**
 * Get greeting message based on time and profile
 */
export function getGreeting(profile: UserFinancialProfile): string {
  const hour = new Date().getHours();
  const name = profile.name || "there";

  let timeGreeting: string;
  if (hour < 12) {
    timeGreeting = "Good morning";
  } else if (hour < 18) {
    timeGreeting = "Good afternoon";
  } else {
    timeGreeting = "Good evening";
  }

  const { income, spendingSummary } = profile;

  if (!income?.amount) {
    return `${timeGreeting}, ${name}! 👋 I'm your financial coach. Ready to help you understand your money better. What's on your mind?`;
  }

  const totalSpending = spendingSummary.reduce((sum, s) => sum + s.total, 0);
  const remaining = income.amount - totalSpending;

  if (remaining > 0) {
    return `${timeGreeting}, ${name}! ☀️ You've got about ${formatCurrencyUtil(remaining)} flexibility this month. How can I help you today?`;
  }

  return `${timeGreeting}, ${name}! Let's take a look at your finances. How can I help?`;
}
