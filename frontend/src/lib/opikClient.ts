import { Opik } from "opik";

// Initialize Opik client with full configuration
// Environment variables: OPIK_API_KEY, OPIK_WORKSPACE, OPIK_PROJECT_NAME, OPIK_URL_OVERRIDE
export const opikClient = new Opik({
  projectName: process.env.OPIK_PROJECT_NAME || "FinResolve1",
  apiKey: process.env.OPIK_API_KEY,
  workspaceName: process.env.OPIK_WORKSPACE,
  apiUrl: process.env.OPIK_URL_OVERRIDE || "https://www.comet.com/opik/api",
});

/**
 * Configure Opik for the current session
 * Useful for client-side usage if needed, though strictly Opik SDK is better server-side
 * For now we use it in our server actions or API routes mostly.
 */
export const OP_CONFIG = {
  projectName: "FinResolve1",
};
