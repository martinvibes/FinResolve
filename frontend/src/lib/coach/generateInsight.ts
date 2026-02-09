import { getOpikClient } from "@/lib/opikClient";
import { type UserFinancialProfile } from "@/lib/types";

export interface SpendingInsight {
  type: "spending_spike" | "saving_opportunity" | "routine_check";
  message: string;
  amount?: number;
  category?: string;
  confidence: number;
}

export type InsightTimeframe = "weekly" | "monthly" | "yearly";

export async function generateInsight(
  profile: UserFinancialProfile,
  timeframe: InsightTimeframe = "weekly",
): Promise<SpendingInsight> {
  const opikClient = getOpikClient();
  const trace = opikClient.trace({
    name: `${timeframe}-insight`,
    tags: ["coach", "rule-based", timeframe],
    input: {
      totalSpending: profile.spendingSummary.reduce((a, b) => a + b.total, 0),
      income: profile.income?.amount,
      timeframe,
    },
  });

  const span = trace.span({
    name: "analyze-spending-patterns",
    type: "tool",
  });

  let insight: SpendingInsight;

  // Simple rule-based logic for now
  // In Phase 4, we can connect this to an LLM for more nuance
  const totalSpending = profile.spendingSummary.reduce(
    (acc, curr) => acc + curr.total,
    0,
  );
  const income = profile.income?.amount || 0;
  const foodSpending =
    profile.spendingSummary.find((s) => s.category === "food")?.total || 0;

  const timeframeLabels = {
    weekly: "this week",
    monthly: "this month",
    yearly: "this year",
  };

  const label = timeframeLabels[timeframe];

  try {
    if (income > 0 && totalSpending > income * 0.9) {
      insight = {
        type: "spending_spike",
        message: `You've used ${Math.round(
          (totalSpending / income) * 100,
        )}% of your expected income ${label}. Consider cutting back on non-essentials to stay safe.`,
        amount: totalSpending,
        confidence: 0.9,
      };
    } else if (foodSpending > 50000) {
      insight = {
        type: "saving_opportunity",
        message: `You've spent ${profile.currency !== "USD" ? "₦" : "$"}${foodSpending.toLocaleString()} on food ${label}. Cooking at home more often could help you save significantly.`,
        category: "food",
        amount: foodSpending,
        confidence: 0.85,
      };
    } else {
      insight = {
        type: "routine_check",
        message: `Your spending looks healthy ${label}! You're on track to hit your savings goals if you maintain this pace.`,
        confidence: 0.95,
      };
    }

    // Update span with output, then end it
    span.update({
      output: { ...insight } as Record<string, unknown>,
    });
    span.end();

    // Update trace with output, then end it
    trace.update({
      output: { ...insight } as Record<string, unknown>,
    });
    trace.end();

    await opikClient.flush();

    return insight;
  } catch (error) {
    console.error("Insight generation error", error);
    // Return safe fallback
    return {
      type: "routine_check",
      message: "Check back later for personalized insights.",
      confidence: 0,
    };
  }
}
