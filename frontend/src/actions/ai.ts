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
  const budgetRemaining = income?.amount ? income.amount - totalSpending : 0;

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

  // Get current date info
  const now = new Date();
  const daysLeftInMonth =
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() -
    now.getDate();

  return `You are FinResolve AI, a friendly and supportive financial coach. You help users understand their money, budget better, and achieve their savings goals.

User's Financial Context:
- Name: ${name || "Friend"}
- Monthly Income: ${income?.amount ? formatCurrency(income.amount) : "Not provided"}
- Total Monthly Spending: ${totalSpending > 0 ? formatCurrency(totalSpending) : "Not tracked yet"}
- Budget Remaining: ${budgetRemaining > 0 ? formatCurrency(budgetRemaining) : "N/A"}
- Days Left in Month: ${daysLeftInMonth}

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
- If they haven't shared financial data yet, gently encourage them to share their income/expenses so you can help better`;
}

/**
 * Server Action to generate AI response using Gemini
 * Includes Opik tracing for observability
 */
export async function generateAIResponse(
  query: string,
  profile: UserFinancialProfile,
) {
  terminalLog(`Processing query: "${query}"`);
  const startTime = Date.now();

  try {
    // Build the system prompt with financial context
    const systemPrompt = buildSystemPrompt(profile);

    // Call Gemini API first
    const result = await geminiModel.generateContent([
      { text: systemPrompt },
      { text: `User: ${query}` },
    ]);

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

    return {
      content: responseText,
      confidence: "high" as const,
      assumptions: undefined,
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
