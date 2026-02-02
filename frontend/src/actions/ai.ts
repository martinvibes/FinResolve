"use server";

import { opikClient } from "@/lib/opikClient";
import { geminiModel, GEMINI_MODEL_NAME } from "@/lib/geminiClient";
import { type UserFinancialProfile, CATEGORY_META } from "@/lib/types";
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
  const { name, income, spendingSummary, goals } = profile;

  // Calculate totals
  const totalSpending = spendingSummary.reduce((sum, s) => sum + s.total, 0);
  const monthlyIncome = income?.amount || 0;

  // Calculate Account Assets
  const accounts = profile.accounts || [];
  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const accountsList = accounts
    .map((a) => `- ${a.name}: ${formatCurrency(a.balance)} (${a.type})`)
    .join("\n");

  // Calculate Recurring/Fixed Costs
  const recurringItems = profile.recurringItems || [];
  const committedSpend = recurringItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const recurringList = recurringItems
    .map((r) => `- ${r.name}: ${formatCurrency(r.amount)} (${r.frequency})`)
    .join("\n");

  // Calculate Safe to Spend (Logic aligned with FinancialPulseCards)
  // Determine budget basis
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

  // Get current date info
  const now = new Date();
  const daysLeftInMonth =
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() -
    now.getDate();

  const safeDailySpend =
    daysLeftInMonth > 0 ? budgetRemaining / daysLeftInMonth : 0;

  // Format top spending categories
  const topCategories = [...spendingSummary]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((s) => {
      const meta = CATEGORY_META[s.category];
      return `${meta.emoji} ${meta.label}: ${formatCurrency(s.total)}`;
    })
    .join("\n  ");

  // Format goals
  const goalsInfo =
    goals.length > 0
      ? goals
          .map((g) => {
            const progress = ((g.current / g.target) * 100).toFixed(0);
            return `- ${g.name}: ${formatCurrency(g.current)}/${formatCurrency(g.target)} (${progress}%)`;
          })
          .join("\n  ")
      : "No savings goals set yet";

  return `You are FinResolve AI, a friendly and supportive financial coach. You help users understand their money, budget better, and achieve their savings goals.

User's Financial Context:
- Name: ${name || "Friend"}
- Net Worth (Total Cash): ${formatCurrency(netWorth)}
- Monthly Income: ${monthlyIncome > 0 ? formatCurrency(monthlyIncome) : "Not set"}
- Total Monthly Spending: ${formatCurrency(totalSpending)}
- Committed Fixed Costs (Bills): ${formatCurrency(committedSpend)}
- 'Safe to Spend' Remainder: ${formatCurrency(budgetRemaining)} (${formatCurrency(safeDailySpend)}/day for ${daysLeftInMonth} days)

Accounts:
${accountsList || "No accounts linked"}

Recurring Bills:
${recurringList || "No recurring bills"}

Top Spending Categories:
  ${topCategories || "No spending data yet"}


Savings Goals:
  ${goalsInfo}

Guidelines:
- Be warm, supportive, and non-judgmental about money
- Use Nigerian Naira (₦) for all currency amounts
- Give specific, actionable advice based on their actual financial data when available
- For greetings ("hi", "hello", "hey"): Respond warmly and offer to help with their finances
- For general questions (date, weather, etc.): Answer helpfully, then naturally connect to their financial context (e.g., "It's January 30th! You've got ${daysLeftInMonth} days left to hit your savings goals this month!")
- For financial questions: Use their actual spending/income/goal data to give personalized insights
- Always stay in character as their friendly financial coach
- Keep responses concise but helpful (2-4 sentences for simple queries, more for detailed financial analysis)
- Never give investment advice or legal advice - you're a budgeting coach
- If they haven't shared financial data yet, gently encourage them to share their income/expenses so you can help better
- If the user clearly states they want to log an expense (e.g., "I spent 5k on food"):
  1. FIRST, check if they specified which account they used (e.g. "from my generic bank", "cash", "credit card").
  2. IF NOT, ask them: "Which account did you use? (e.g., [List user's account names])"
  3. IF THEY HAVE specified the account (or if they only have one account), match it to one of the Account IDs below:
     ${profile.accounts.map((a) => `${a.name} (ID: ${a.id})`).join(", ")}
  4. THEN, output a JSON action block at the END of your response.
  
  Format:
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
  Categories: food, transport, utilities, data_airtime, housing, entertainment, shopping, health, education, savings, family, debt, other.
  
  Example Response:
  "Got it! I've logged that from your ${profile.accounts[0]?.name || "account"}. 🍔"
  [[ACTION]]
  {
    "type": "LOG_EXPENSE",
    "payload": {
      "amount": 5000,
      "category": "food",
      "description": "Food",
      "accountId": "${profile.accounts[0]?.id || ""}"
    }
  }
  [[/ACTION]]`;
}

/**
 * Server Action to generate AI response using Gemini
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
    // Build the system prompt with financial context
    const systemPrompt = buildSystemPrompt(profile);

    // Limit history to last 10 messages to avoid token context limits
    // and map to Gemini format
    const recentHistory = history.slice(-10).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Construct the full prompt structure
    // Gemini expects: [System Prompt, ...History, Current Query]
    // However, for generateContent with system instructions, we often put it in the config or as the first part.
    // The previous implementation passed system prompt as text.
    // Let's stick to the previous pattern but insert history in between.

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] }, // System prompt disguised as user message or just context
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to act as FinResolve AI." }],
      }, // Ack to prime the model
      ...recentHistory,
      { role: "user", parts: [{ text: `User: ${query}` }] },
    ];

    // Call Gemini API
    const result = await geminiModel.generateContent({
      contents: contents,
    });

    const response = result.response;
    const responseText = response.text();
    const latency = Date.now() - startTime;

    // Get token usage if available
    const usageMetadata = response.usageMetadata;
    const tokenUsage = {
      promptTokens: usageMetadata?.promptTokenCount || 0,
      completionTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
    };

    // Now create Opik trace WITH output (SDK requires output at creation time)
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
      tags: ["gemini", "financial-coach"],
    });

    // Create span WITH output included
    const span = trace.span({
      name: "gemini-generation",
      type: "llm",
      input: {
        query,
        systemPrompt: systemPrompt,
      },
      output: {
        response: responseText,
      },
      metadata: {
        model: GEMINI_MODEL_NAME,
        provider: "google",
        latencyMs: latency,
        promptTokens: tokenUsage.promptTokens,
        completionTokens: tokenUsage.completionTokens,
        totalTokens: tokenUsage.totalTokens,
      },
    });
    span.end();
    trace.end();

    // Flush Opik buffer
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
    const actionMatch = responseText.match(
      /\[\[ACTION\]\]([\s\S]*?)\[\[\/ACTION\]\]/,
    );
    let cleanContent = responseText;
    let parsedAction: any = undefined;

    if (actionMatch) {
      try {
        parsedAction = JSON.parse(actionMatch[1].trim());
        // Remove the action block from the visible response
        cleanContent = responseText.replace(actionMatch[0], "").trim();
      } catch (e) {
        console.error("Failed to parse AI action:", e);
      }
    }

    return {
      content: cleanContent,
      confidence: "high" as const,
      assumptions: undefined,
      action: parsedAction,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error("AI Generation Error:", error);
    terminalLog("Error generating response", { error, latency });

    return {
      content:
        "I'm having trouble connecting to my financial brain right now. Please try again in a moment!",
      confidence: "low" as const,
      assumptions: undefined,
    };
  }
}
