import OpenAI from "openai";

// Lazy initialization to prevent top-level crashes if env vars are missing during build/import
let openaiInstance: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[OpenAI] API Key is missing! Client will likely fail.");
    }
    openaiInstance = new OpenAI({
      apiKey: apiKey || "missing_key",
    });
  }
  return openaiInstance;
}

export const OPENAI_MODEL_NAME = "gpt-4o";
