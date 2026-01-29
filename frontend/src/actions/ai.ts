"use server";

import { opikClient } from "@/lib/opikClient";
import { generateResponse as generateRuleBasedResponse } from "@/lib/aiLogic";
import { type UserFinancialProfile } from "@/lib/types";

// Helper to log to terminal as requested
function terminalLog(message: string, data?: unknown) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `\x1b[36m[FinResolve AI ${timestamp}]\x1b[0m`; // Cyan color
  console.log(`${prefix} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Server Action to generate AI response
 * Wraps the rule-based logic with Opik tracing
 */
export async function generateAIResponse(
  query: string,
  profile: UserFinancialProfile,
) {
  terminalLog(`Processing query: "${query}"`);

  try {
    // Start Opik Trace
    const trace = opikClient.trace({
      name: "financial-advice",
      input: {
        query,
        profile: { name: profile.name, income: profile.income?.amount },
      },
      tags: ["rule-based", "beta"],
    });

    // Create a span for the generation logic
    const span = trace.span({
      name: "rule-based-engine",
      type: "tool",
      input: { query },
    });

    // Calculate response (using existing logic)
    // Note: aiLogic is client-side code but imports types.
    // We might need to copy logic here or ensure aiLogic is isomorphic.
    // aiLogic.ts uses "export function" so it should be fine to import in server file if it doesn't use hooks.
    const response = generateRuleBasedResponse(query, profile);
    console.log(response);

    // Identifies intent - just logging for context
    const tags =
      response.confidence === "low" ? ["unknown"] : ["financial_query"];

    // Log span end
    // Use proper end signature or update method if end() expects void in strict mode
    span.end({
      output: response,
    } as any);

    // Log trace end
    trace.end({
      output: response,
    } as any);

    // Flush Opik buffer (important for serverless/server actions)
    await opikClient.flush();

    terminalLog(
      `Generated response (Confidence: ${response.confidence || "N/A"}):`,
      response.content,
    );
    // terminalLog(`Trace ID: ${trace.id}`); // Trace ID might not be available on creation object synchronously

    return response;
  } catch (error) {
    console.error("AI Generation Error:", error);
    terminalLog("Error generating response", error);
    return {
      content:
        "I'm having trouble connecting to my financial brain right now. Please try again.",
      confidence: "low" as const,
    };
  }
}
