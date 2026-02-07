"use server";

import { opikClient } from "@/lib/opikClient";
import { openai, OPENAI_MODEL_NAME } from "@/lib/openaiClient";
import {
  type UserFinancialProfile,
  type AIAction,
  CATEGORY_META,
  CURRENCIES,
  type SpendingCategory,
} from "@/lib/types";
import { formatCurrency } from "@/lib/parseInput";

// Helper to log to terminal
function terminalLog(message: string, data?: unknown) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `\x1b[36m[FinResolve AI ${timestamp}]\x1b[0m`; // Cyan color
  console.log(`${prefix} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Build system prompt with user's financial context
 */
function buildSystemPrompt(profile: UserFinancialProfile): string {
  const { name, income, spendingSummary, goals, currency } = profile;
  const currencyConfig = CURRENCIES[currency];
  const currencyName = currencyConfig?.name || "US Dollar";
  const currencySymbol = currencyConfig?.symbol || "$";

  // Calculate totals
  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD format
  const daysLeftInMonth =
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() -
    now.getDate();

  // CALCULATE LIVE METRICS FROM RAW DATA
  // This ensures "Where is my money going?" is always accurate for the current month
  const currentMonthExpenses = profile.monthlySpending.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return (
      d.getFullYear() === currentYear &&
      d.getMonth() === currentMonth &&
      t.type === "expense"
    );
  });

  const totalSpending = currentMonthExpenses.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  const monthlyIncome = profile.income?.amount || 0;

  // Calculate Account Assets
  const accounts = profile.accounts || [];
  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const accountsList = accounts
    .map(
      (a) => `- ${a.name}: ${formatCurrency(a.balance, currency)} (${a.type})`,
    )
    .join("\n");

  // Calculate Recurring/Fixed Costs
  const recurringItems = profile.recurringItems || [];
  const committedSpend = recurringItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const recurringList = recurringItems
    .map(
      (r) =>
        `- ${r.name}: ${formatCurrency(r.amount, currency)} (${r.frequency})`,
    )
    .join("\n");

  // Calculate Safe to Spend
  const hasBudgets = (profile.budgets || []).length > 0;
  let budgetLimit = monthlyIncome;
  let budgetSpent = totalSpending;

  if (hasBudgets) {
    budgetLimit = profile.budgets.reduce((sum, b) => sum + b.limit, 0);
    budgetSpent = profile.budgets.reduce((sum, b) => sum + b.spent, 0);
  } else {
    budgetLimit = monthlyIncome - committedSpend;
  }

  const budgetRemaining = Math.max(0, budgetLimit - budgetSpent);
  const safeDailySpend =
    daysLeftInMonth > 0 ? budgetRemaining / daysLeftInMonth : 0;

  // Format top spending categories (Live calculation)
  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amount]) => {
      const meta =
        CATEGORY_META[cat as SpendingCategory] || CATEGORY_META.other;
      return `${meta.emoji} ${meta.label}: ${formatCurrency(amount, currency)}`;
    })
    .join("\n  ");

  // Format goals
  const goalsInfo =
    goals.length > 0
      ? goals
          .map((g) => {
            const progress = ((g.current / g.target) * 100).toFixed(0);
            return `- ${g.name}: ${formatCurrency(g.current, currency)}/${formatCurrency(g.target, currency)} (${progress}%)`;
          })
          .join("\n  ")
      : "No savings goals set yet";

  // --- NEW: HISTORICAL DATA FOR AI ---
  // Group all transactions by Month-Year
  const monthlyHistory: Record<
    string,
    { income: number; expenses: number; topCats: Record<string, number> }
  > = {};
  const allTransactions = [...profile.monthlySpending].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  );

  allTransactions.forEach((t) => {
    if (!t.date) return;
    const d = new Date(t.date);
    const key = `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;

    if (!monthlyHistory[key]) {
      monthlyHistory[key] = { income: 0, expenses: 0, topCats: {} };
    }

    if (t.type === "income") {
      monthlyHistory[key].income += t.amount;
    } else {
      monthlyHistory[key].expenses += t.amount;
      monthlyHistory[key].topCats[t.category] =
        (monthlyHistory[key].topCats[t.category] || 0) + t.amount;
    }
  });

  const historyList = Object.entries(monthlyHistory)
    .slice(0, 6) // Last 6 months with data
    .map(([month, data]) => {
      const topCat = Object.entries(data.topCats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([cat]) => CATEGORY_META[cat as SpendingCategory]?.label)
        .join(", ");
      return `- ${month}: Income ${formatCurrency(data.income, currency)}, Spent ${formatCurrency(data.expenses, currency)}${topCat ? ` (Mainly: ${topCat})` : ""}`;
    })
    .join("\n");

  // Format Recent Transactions (last 40)
  const recentTransactions = allTransactions.slice(0, 40).map((t) => {
    const acc = accounts.find((a) => a.id === t.accountId);
    const date = t.date ? new Date(t.date).toLocaleDateString() : "No date";
    return `- ${date}: ${t.merchantName || t.description} | ${formatCurrency(t.amount, currency)} | ${CATEGORY_META[t.category as SpendingCategory]?.label || t.category} | ${acc?.name || "Unknown Account"}`;
  });

  return `You are FinResolve AI, a friendly and supportive financial coach. You help users understand their money, budget better, and achieve their savings goals.

IMPORTANT - Current Date: ${currentDateStr} (Year: ${currentYear})
When users mention dates without a year (e.g., "March 30", "next month"), ALWAYS assume the current year (${currentYear}) or the next occurrence of that date. Never default to past years.

User's Financial Context:
- Name: ${name || "Friend"}
- Net Worth (Total Cash): ${formatCurrency(netWorth, currency)}
- Monthly Income: ${monthlyIncome > 0 ? formatCurrency(monthlyIncome, currency) : "Not set"}
- Current Month's Spending: ${formatCurrency(totalSpending, currency)}
- Committed Fixed Costs (Bills): ${formatCurrency(committedSpend, currency)}
- 'Safe to Spend' Remainder: ${formatCurrency(budgetRemaining, currency)} (${formatCurrency(safeDailySpend, currency)}/day for ${daysLeftInMonth} days)

Accounts:
${accountsList || "No accounts linked"}

Recurring Bills:
${recurringList || "No recurring bills"}

Top Spending Categories:
  ${topCategories || "No spending data yet"}


Savings Goals:
  ${goalsInfo}

Budgets:
  ${profile.budgets.length > 0 ? profile.budgets.map((b) => `- ${b.category}: ${formatCurrency(b.limit, currency)} limit (${formatCurrency(b.spent, currency)} spent)`).join("\n  ") : "No budgets set yet"}

Historical Summaries:
${historyList || "No historical data available yet"}

Recent Detailed Transactions:
${recentTransactions.join("\n") || "No recent transactions"}

Guidelines:
- Be warm, supportive, and non-judgmental about money
- Use ${currencyName} (${currencySymbol}) for all currency amounts
- Give specific, actionable advice based on their actual financial data when available
- For greetings ("hi", "hello", "hey"): Respond warmly and offer to help with their finances
- For general questions (date, weather, etc.): Answer helpfully, then naturally connect to their financial context (e.g., "It's January 30th! You've got ${daysLeftInMonth} days left to hit your savings goals this month!")
- For financial questions: Use their actual spending/income/goal data to give personalized insights
- Always stay in character as their friendly financial coach
- Keep responses concise but helpful (2-4 sentences for simple queries, more for detailed financial analysis)
- Never give investment advice or legal advice - you're a budgeting coach
- If they haven't shared financial data yet, gently encourage them to share their income/expenses so you can help better
- BUDGET DETECTION: If an expense is logged for a category that does NOT have a budget, mention it and offer to set a limit. (e.g., "I've logged that. You don't have a budget for Shopping yet—would you like to set a monthly limit?")
- If the user clearly states they want to log an expense (e.g., "I spent some money on food" or "I paid for the light bulb"):
  1. FIRST, check if you have all required fields: AMOUNT, CATEGORY, and ACCOUNT.
  2. IF AMOUNT IS MISSING: Do NOT output an action. Ask the user: "How much did you spend on that [category]?"
  3. IF ACCOUNT IS MISSING: Do NOT output an action. Ask the user: "Which account did you use? (e.g., ${profile.accounts.map((a) => a.name).join(", ") || "Cash"})"
  4. IF CATEGORY IS UNCLEAR: Do NOT output an action. Ask the user to clarify.
  5. ONLY IF YOU HAVE ALL THREE (Amount, Category, Account), match the account name to an ID:
     ${profile.accounts.map((a) => `${a.name} (ID: ${a.id})`).join(", ")}
  6. THEN, output the JSON action block at the END of your response.
  
  Format for Expenses:
  [[ACTION]]
  {
    "type": "LOG_EXPENSE",
    "payload": {
      "amount": 5000,
      "category": "food",
      "description": "Food expense",
      "accountId": "ACCOUNT_ID_HERE"
    }
  }
  [[/ACTION]]

  Format for Income/Deposits:
  [[ACTION]]
  {
    "type": "LOG_INCOME",
    "payload": {
      "amount": 50000,
      "category": "gift",
      "description": "Gift from friend",
      "accountId": "ACCOUNT_ID_HERE"
    }
  }
  [[/ACTION]]

  Format for Transfers:
  [[ACTION]]
  {
    "type": "LOG_TRANSFER",
    "payload": {
      "amount": 50000,
      "sourceAccountId": "SOURCE_ACCOUNT_ID",
      "destinationAccountId": "DESTINATION_ACCOUNT_ID",
      "description": "Transfer to savings"
    }
  }
  [[/ACTION]]

  Format for Goals (Saving Money):
  [[ACTION]]
  {
    "type": "UPDATE_GOAL",
    "payload": {
      "amount": 10000,
      "goalName": "Car Savings",
      "goalId": "GOAL_ID",
      "accountId": "ACCOUNT_ID_TO_DEDUCT_FROM"
    }
  }
  [[/ACTION]]

  IMPORTANT for UPDATE_GOAL: You MUST have both the goal AND the account before executing.
  - If user doesn't specify which account, ask: "Which account should I deduct from?" and list accounts.
  - Only execute UPDATE_GOAL when you have: amount, goal (name or ID), AND accountId.

  Format for Creating Goals:
  [[ACTION]]
  {
    "type": "CREATE_GOAL",
    "payload": {
      "name": "New Goal Name",
      "target": 500000,
      "deadline": "${currentYear}-12-31" // Optional - use current year (${currentYear}) for dates
    }
  }
  [[/ACTION]]

  Format for Creating Budgets:
  [[ACTION]]
  {
    "type": "CREATE_BUDGET",
    "payload": {
      "category": "shopping",
      "limit": 20000
    }
  }
  [[/ACTION]]

  Categories: 
  - Expenses: food, transport, utilities, data_airtime, housing, entertainment, shopping, health, education, savings, family, debt, other.
  - Income: salary, business, gift, other.
  
  Guidelines for Transfers & Goals:
  - LOG_TRANSFER: ONLY use for account-to-account transfers (e.g., "move 50k from UBA to Kuda").
  - UPDATE_GOAL: Use when user wants to SAVE money or add to a savings goal. This includes:
    * "save 7000", "I saved 10k", "put 5000 in savings", "transfer to savings"
    * "Add 10k to my Car goal", "put money towards my goal"
    * Any mention of saving money, even without specifying a goal name
  - IMPORTANT: When user says "save", "saved", "transfer to savings" → ALWAYS use UPDATE_GOAL, NOT LOG_TRANSFER.
  - If user wants to save but doesn't specify which goal:
    * If there's only 1 goal, use that goal automatically.
    * If there are multiple goals, ask: "Which goal would you like to save towards?" and list the goals.
  - CREATE_GOAL: Use when user wants to create a NEW goal (e.g., "Create a goal for Buying a Laptop with target 500k").
  - List of active Goals:
    ${profile.goals.map((g) => `- ${g.name} (ID: ${g.id}, Current: ${formatCurrency(g.current, currency)})`).join("\n    ")}
  - Match account/goal names to IDs in the list above.
  - If accounts/goals are not found, ask for clarification.
  
  Guidelines for Actions:
  - CRITICAL: All amounts in JSON actions MUST be in whole units (e.g. 45.00 for 45 Naira/Dollars), NOT in sub-units like cents or kobo.
  - DO NOT multiply amounts by 100.
  - Ensure 'amount' is a number, not a string.

  Example Response (Expense):
  "Got it! I've logged that from your ${profile.accounts[0]?.name || "account"}. 🍔"
  [[ACTION]]
  {
    "type": "LOG_EXPENSE",
    "payload": {
      "amount": 45.0,
      "category": "food",
      "description": "Lunch",
      "accountId": "${profile.accounts[0]?.id || ""}"
    }
  }
  [[/ACTION]]`;
}

/**
 * Server Action to generate AI response using OpenAI
 * Includes Opik tracing for observability
 */
export async function generateAIResponse(
  query: string,
  profile: UserFinancialProfile,
  history: { role: string; content: string }[] = [],
) {
  terminalLog(`Processing query: "${query}"`);
  const startTime = Date.now();

  try {
    // Build the system prompt
    const systemPrompt = buildSystemPrompt(profile);

    // Filter history and map to OpenAI format
    const recentHistory = history.slice(-10).map((msg) => ({
      role: (msg.role === "assistant" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: msg.content,
    }));

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user", content: query },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL_NAME,
      messages: messages,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content || "";
    const latency = Date.now() - startTime;

    // Token usage
    const tokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    // Opik Tracing
    const trace = opikClient.trace({
      name: "financial-advice",
      input: {
        query,
        profile: {
          name: profile.name,
          income: profile.income?.amount,
          totalSpending: profile.spendingSummary.reduce(
            (sum, s) => sum + s.total,
            0,
          ),
          goalsCount: profile.goals.length,
        },
      },
      output: {
        response: responseText,
        latencyMs: latency,
        tokenUsage,
      },
      tags: ["openai", "financial-coach"],
    });

    const span = trace.span({
      name: "openai-generation",
      type: "llm",
      input: {
        messages,
      },
      output: {
        response: responseText,
      },
      metadata: {
        model: OPENAI_MODEL_NAME,
        provider: "openai",
        latencyMs: latency,
        ...tokenUsage,
      },
    });
    span.end();
    trace.end();

    // Flush Opik buffer (optional, best effort)
    try {
      await opikClient.flush();
      terminalLog("Opik flush completed successfully");
    } catch (flushError) {
      console.error("Opik flush error:", flushError);
    }

    terminalLog(
      `Generated response (${latency}ms, ${tokenUsage.totalTokens} tokens):`,
      responseText,
    );

    // Parse for actions
    const actionRegex = /\[\[ACTION\]\]([\s\S]*?)\[\[\/ACTION\]\]/g;
    const matches = [...responseText.matchAll(actionRegex)];

    let cleanContent = responseText;
    const parsedActions: AIAction[] = [];

    if (matches.length > 0) {
      matches.forEach((match) => {
        try {
          const action = JSON.parse(match[1].trim());
          parsedActions.push(action);
          // Remove the action block from the visible response
          cleanContent = cleanContent.replace(match[0], "").trim();
        } catch (e) {
          console.error("Failed to parse AI action:", e);
        }
      });
    }

    return {
      content: cleanContent,
      confidence: "high" as const,
      assumptions: undefined,
      actions: parsedActions, // Helper to return array
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error("AI Generation Error:", error);
    terminalLog("Error generating response", { error, latency });

    return {
      content:
        "I'm having trouble connecting to my financial brain right now. Please try again in a moment! (Check your API Key)",
      confidence: "low" as const,
      assumptions: undefined,
      actions: [],
    };
  }
}
