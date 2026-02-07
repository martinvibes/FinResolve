import { Opik } from "opik";

// Lazy initialization to prevent top-level crashes if env vars are missing during build/import
let opikInstance: Opik | null = null;

export function getOpikClient() {
  if (!opikInstance) {
    opikInstance = new Opik({
      projectName: process.env.OPIK_PROJECT_NAME || "FinResolve1",
      apiKey: process.env.OPIK_API_KEY || "",
      workspaceName: process.env.OPIK_WORKSPACE || "",
      apiUrl: process.env.OPIK_URL_OVERRIDE || "https://www.comet.com/opik/api",
    });
  }
  return opikInstance;
}

/**
 * Configure Opik for the current session
 * Useful for client-side usage if needed, though strictly Opik SDK is better server-side
 * For now we use it in our server actions or API routes mostly.
 */
export const OP_CONFIG = {
  projectName: "FinResolve1",
};
