import { createRequire } from "node:module";
import { buildDeterministicAdvice } from "./conflictEngine.js";

// The SDK currently ships a CommonJS Node entry point alongside its ESM build.
// Loading it this way also works in Node versions whose resolver selects that entry.
const require = createRequire(import.meta.url);
const { GoogleGenAI } = require("@google/genai");

const triageSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          conflictId: { type: "string" }, urgency: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
          action: { type: "string" }, trainId: { type: "string" }, location: { type: "string" },
          rationale: { type: "string" }, operatorConfirmationRequired: { type: "boolean" }
        },
        required: ["conflictId", "urgency", "action", "trainId", "location", "rationale", "operatorConfirmationRequired"]
      }
    },
    disclaimer: { type: "string" }
  },
  required: ["summary", "recommendations", "disclaimer"]
};

export async function getTriageAdvice(state, conflicts) {
  const fallback = { summary: `${conflicts.length} deterministic track conflict(s) require review.`, recommendations: buildDeterministicAdvice(state, conflicts), disclaimer: "Decision support only. The operator retains full signalling and movement authority.", source: "deterministic-fallback" };
  if (!process.env.GEMINI_API_KEY || conflicts.length === 0) return fallback;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are RailGuard AI, a railway operator triage assistant. You do NOT calculate routes, issue movement authority, alter reservations, or make safety decisions. Use only the deterministic facts below to explain conservative, human-confirmed holding advice. Return JSON that matches the supplied schema exactly.\n\nSECTOR_STATE=${JSON.stringify(state)}\n\nDETERMINISTIC_CONFLICTS=${JSON.stringify(conflicts)}`;
  try {
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseJsonSchema: triageSchema, temperature: 0.1 } });
    return { ...JSON.parse(response.text), source: "gemini" };
  } catch (error) {
    return { ...fallback, geminiError: error.message };
  }
}
