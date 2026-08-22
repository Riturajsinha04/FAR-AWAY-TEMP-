import "dotenv/config";
import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { sectorState } from "./sectorState.js";
import { detectConflicts } from "./conflictEngine.js";
import { getTriageAdvice } from "./geminiTriage.js";
import { buildDispatchComparison } from "./dispatchComparison.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const snapshot = () => ({ state: sectorState, conflicts: detectConflicts(sectorState) });
app.get("/health", (_req, res) => res.json({ ok: true, service: "railguard-triage" }));
app.get("/api/sector", (_req, res) => res.json(snapshot()));
app.get("/api/conflicts", (_req, res) => res.json({ conflicts: detectConflicts(sectorState) }));
app.get("/api/dispatch-comparison", (_req, res) => res.json(buildDispatchComparison(sectorState)));
app.post("/api/triage", async (_req, res) => res.json(await getTriageAdvice(sectorState, detectConflicts(sectorState))));
app.post("/api/trains/:id/delay", (req, res) => {
  const train = sectorState.trains.find(({ id }) => id === req.params.id);
  const delayMinutes = Number(req.body.delayMinutes);
  if (!train || !Number.isFinite(delayMinutes) || delayMinutes < 0) return res.status(400).json({ error: "Valid train id and non-negative delayMinutes are required." });
  train.delayMinutes = delayMinutes;
  train.status = delayMinutes ? "DELAYED" : "ON_TIME";
  const data = snapshot();
  io.emit("sector:update", data);
  res.json(data);
});
io.on("connection", (socket) => socket.emit("sector:update", snapshot()));
server.listen(process.env.PORT || 3001, () => console.log(`RailGuard API running on :${process.env.PORT || 3001}`));
