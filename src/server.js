// src/server.js
// Express API Server for RailGuard AI OCC, Driver Portal, & Passenger Portal Integration

import "dotenv/config";
import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { SIMULATION_STEPS, STATIONS } from "./data/simulationState.js";
import { sectorState } from "./sectorState.js";
import { detectConflicts } from "./conflictEngine.js";
import { getTriageAdvice } from "./geminiTriage.js";
import { buildDispatchComparison } from "./dispatchComparison.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 1. Mandatory CORS & JSON Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Global Active Simulation Step index (0 to 5 for 6 timeline events)
let activeStepIndex = 0;

// Train ID Standardization Alias Map
const TRAIN_ALIAS_MAP = {
  // Standardized IDs
  "T1_Local": ["T1_Local", "64511", "Local 1"],
  "T2_Local": ["T2_Local", "64532", "Local 2"],
  "T3_Express": ["T3_Express", "12926", "Express", "Paschim Express"],
  "T4_Fast": ["T4_Fast", "12012", "Fast Train", "Vande Bharat", "Kalka Shatabdi"],
  "T5_Freight": ["T5_Freight", "BOXN-582", "Heavy Freight", "Freight"]
};

// Helper: Normalize train ID query to standard key
function resolveTrainKey(rawId) {
  if (!rawId) return null;
  const target = String(rawId).trim().toLowerCase();
  for (const [key, aliases] of Object.entries(TRAIN_ALIAS_MAP)) {
    if (aliases.some(alias => alias.toLowerCase() === target)) {
      return key;
    }
  }
  return rawId;
}

// Health Check
app.get("/health", (_req, res) => {
  res.json({ 
    ok: true, 
    service: "railguard-occ-api",
    activeStep: activeStepIndex + 1,
    minute: SIMULATION_STEPS[activeStepIndex]?.minute || 16
  });
});

// ==========================================
// ENDPOINT 1: The Timeline Feed (For Live Map)
// Route: GET /api/occ/timeline
// ==========================================
app.get("/api/occ/timeline", (_req, res) => {
  res.json({
    sector: "100km Ambala-Kurukshetra-Panipat Sector",
    stations: STATIONS,
    total_steps: SIMULATION_STEPS.length,
    active_step: activeStepIndex + 1,
    current_minute: SIMULATION_STEPS[activeStepIndex]?.minute,
    simulation_timeline: SIMULATION_STEPS
  });
});

// ==========================================
// ENDPOINT 2: The Driver Portal Hook (For Loco Pilot App)
// Route: GET /api/driver/messages/:train_id
// ==========================================
app.get("/api/driver/messages/:train_id", (req, res) => {
  const trainKey = resolveTrainKey(req.params.train_id);
  const currentStep = SIMULATION_STEPS[activeStepIndex];
  
  if (!currentStep) {
    return res.status(404).json({ error: "Invalid simulation step" });
  }

  // Filter messages relevant to requested train
  const messages = (currentStep.driver_portal_messages || []).filter(msg => {
    const msgTrainKey = resolveTrainKey(msg.train);
    return msgTrainKey === trainKey || msg.train.toLowerCase().includes(String(req.params.train_id).toLowerCase());
  });

  res.json({
    timestamp: new Date().toISOString(),
    simulation_minute: currentStep.minute,
    time_label: currentStep.timeLabel,
    train_id: req.params.train_id,
    standardized_id: trainKey,
    llm_hit: currentStep.llm_hit,
    active_advisories: messages.length > 0 ? messages : [
      {
        train: req.params.train_id,
        message: "AI ALERT: Proceed on signal aspect. Route clear. Maintain scheduled speed."
      }
    ]
  });
});

// ==========================================
// ENDPOINT 3: The Live Train Status (For Passenger Portal)
// Route: GET /api/passenger/status/:train_id
// ==========================================
app.get("/api/passenger/status/:train_id", (req, res) => {
  const trainKey = resolveTrainKey(req.params.train_id);
  const currentStep = SIMULATION_STEPS[activeStepIndex];

  // Get train state from step
  const rawTrainIdMap = {
    "T1_Local": "64511",
    "T2_Local": "64532",
    "T3_Express": "12926",
    "T4_Fast": "12012",
    "T5_Freight": "BOXN-582"
  };
  const internalId = rawTrainIdMap[trainKey] || req.params.train_id;
  const aiTrain = currentStep.trains.ai[internalId] || {};
  const legacyTrain = currentStep.trains.legacy[internalId] || {};

  const delaySavedMinutes = (legacyTrain.delayMinutes || 0) - (aiTrain.delayMinutes || 0);

  res.json({
    timestamp: new Date().toISOString(),
    minute: currentStep.minute,
    time_label: currentStep.timeLabel,
    train_id: req.params.train_id,
    standardized_id: trainKey,
    train_name: aiTrain.name || req.params.train_id,
    current_position_km: aiTrain.positionKm ?? 0,
    speed_kmh: aiTrain.speedKmh ?? 0,
    status: aiTrain.status || "ON_TIME",
    delay_minutes: aiTrain.delayMinutes ?? 0,
    legacy_delay_minutes: legacyTrain.delayMinutes ?? 0,
    time_saved_by_ai: Math.max(0, delaySavedMinutes),
    llm_rerouting_active: currentStep.llm_hit,
    pnr_update_banner: delaySavedMinutes > 0
      ? `AI Rerouting Active. Recovering ${delaySavedMinutes} mins of delay.`
      : `Train running on schedule.`,
    food_delivery_prediction: {
      station: "Station C (Panipat Jn)",
      original_eta: "08:15 AM",
      updated_eta: aiTrain.delayMinutes === 0 ? "08:00 AM (On-Time)" : `08:00 AM +${aiTrain.delayMinutes}m`,
      vendor_instruction: delaySavedMinutes > 0 
        ? `FOOD VENDOR ALERT: On-time arrival recovered by AI! Prepare order for Coach B4 at 08:00 AM sharp.`
        : `FOOD VENDOR ALERT: Train on-time. Delivery ready at 08:00 AM.`
    }
  });
});

// ==========================================
// AUTONOMOUS AGENTIC DISPATCH ENDPOINTS (GZB-ALJN 106km Sector)
// ==========================================
import { GZB_ALJN_GRAPH } from "./utils/trackGraph.js";
import { runAutonomousAgentDispatch, GEMINI_TOOL_DECLARATIONS, OCC_AGENT_SYSTEM_PROMPT } from "./agenticEngine.js";

app.get("/api/agent/graph", (_req, res) => {
  res.json({
    ok: true,
    graph: GZB_ALJN_GRAPH,
    toolDeclarations: GEMINI_TOOL_DECLARATIONS,
    systemPrompt: OCC_AGENT_SYSTEM_PROMPT
  });
});

app.post("/api/agent/scenario/:id", (req, res) => {
  const rawId = String(req.params.id).toUpperCase();
  const scenarioMap = {
    "1": "SCENARIO_1_LONG_HAUL_FREIGHT",
    "SCENARIO1": "SCENARIO_1_LONG_HAUL_FREIGHT",
    "LONG_HAUL": "SCENARIO_1_LONG_HAUL_FREIGHT",
    "SCENARIO_1_LONG_HAUL_FREIGHT": "SCENARIO_1_LONG_HAUL_FREIGHT",
    "2": "SCENARIO_2_FOGSAFE_IOT",
    "SCENARIO2": "SCENARIO_2_FOGSAFE_IOT",
    "FOGSAFE": "SCENARIO_2_FOGSAFE_IOT",
    "SCENARIO_2_FOGSAFE_IOT": "SCENARIO_2_FOGSAFE_IOT",
    "3": "SCENARIO_3_PANTOGRAPH_FAILURE",
    "SCENARIO3": "SCENARIO_3_PANTOGRAPH_FAILURE",
    "PANTOGRAPH": "SCENARIO_3_PANTOGRAPH_FAILURE",
    "SCENARIO_3_PANTOGRAPH_FAILURE": "SCENARIO_3_PANTOGRAPH_FAILURE",
    "4": "SCENARIO_4_DOMINO_STATION_SKIP",
    "SCENARIO4": "SCENARIO_4_DOMINO_STATION_SKIP",
    "STATION_SKIP": "SCENARIO_4_DOMINO_STATION_SKIP",
    "SCENARIO_4_DOMINO_STATION_SKIP": "SCENARIO_4_DOMINO_STATION_SKIP"
  };

  const targetScenarioKey = scenarioMap[rawId] || "SCENARIO_1_LONG_HAUL_FREIGHT";
  const result = runAutonomousAgentDispatch(targetScenarioKey);

  // Broadcast agent dispatch execution over socket.io
  io.emit("agent:dispatch", result);
  res.json(result);
});

app.post("/api/agent/dispatch", (req, res) => {
  const scenarioId = req.body?.scenarioId || "SCENARIO_1_LONG_HAUL_FREIGHT";
  const result = runAutonomousAgentDispatch(scenarioId);
  io.emit("agent:dispatch", result);
  res.json(result);
});
app.get("/api/occ/step", (_req, res) => {
  res.json({
    activeStepIndex,
    stepNumber: activeStepIndex + 1,
    currentStep: SIMULATION_STEPS[activeStepIndex]
  });
});

app.post("/api/occ/step/next", (_req, res) => {
  activeStepIndex = (activeStepIndex + 1) % SIMULATION_STEPS.length;
  const updatedData = {
    activeStepIndex,
    stepNumber: activeStepIndex + 1,
    currentStep: SIMULATION_STEPS[activeStepIndex]
  };
  io.emit("step:update", updatedData);
  res.json(updatedData);
});

app.post("/api/occ/step/set", (req, res) => {
  const stepIdx = Number(req.body.stepIndex);
  if (Number.isInteger(stepIdx) && stepIdx >= 0 && stepIdx < SIMULATION_STEPS.length) {
    activeStepIndex = stepIdx;
  }
  const updatedData = {
    activeStepIndex,
    stepNumber: activeStepIndex + 1,
    currentStep: SIMULATION_STEPS[activeStepIndex]
  };
  io.emit("step:update", updatedData);
  res.json(updatedData);
});

// Legacy Compatibility Endpoints
const snapshot = () => ({ state: sectorState, conflicts: detectConflicts(sectorState) });
app.get("/api/sector", (_req, res) => res.json(snapshot()));
app.get("/api/conflicts", (_req, res) => res.json({ conflicts: detectConflicts(sectorState) }));
app.get("/api/dispatch-comparison", (_req, res) => res.json(buildDispatchComparison(sectorState)));
app.post("/api/triage", async (_req, res) => res.json(await getTriageAdvice(sectorState, detectConflicts(sectorState))));

io.on("connection", (socket) => {
  socket.emit("step:update", {
    activeStepIndex,
    stepNumber: activeStepIndex + 1,
    currentStep: SIMULATION_STEPS[activeStepIndex]
  });
});

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

function startServer(port) {
  server.listen(port, () => {
    console.log(`🚀 RailGuard OCC & Portal API running on http://localhost:${port}`);
    console.log(`  ├─ GET /api/occ/timeline`);
    console.log(`  ├─ GET /api/driver/messages/:train_id`);
    console.log(`  ├─ GET /api/passenger/status/:train_id`);
    console.log(`  ├─ GET /api/agent/graph`);
    console.log(`  └─ POST /api/agent/scenario/:id (1, 2, 3, 4)`);
  });
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️ Port ${DEFAULT_PORT} is in use by a background process. Trying fallback port ${DEFAULT_PORT + 1}...`);
    startServer(DEFAULT_PORT + 1);
  } else {
    console.error("Server error:", err);
  }
});

startServer(DEFAULT_PORT);
