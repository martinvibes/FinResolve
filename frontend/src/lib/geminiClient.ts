import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client with API key
const genAI = new GoogleGenerativeAI("AIzaSyAXRd8ityHrICjBV2KY2K04QmuU3vRzYXM");

// Use gemini-2.5-flash - latest stable model with good free tier
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const GEMINI_MODEL_NAME = "gemini-2.5-flash";
