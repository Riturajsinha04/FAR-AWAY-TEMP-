import test from "node:test";
import assert from "node:assert/strict";
import { sectorState } from "../src/sectorState.js";
import { detectConflicts, intervalsOverlap } from "../src/conflictEngine.js";
import { buildDispatchComparison } from "../src/dispatchComparison.js";

test("detects the intentional same-block reservation overlap", () => {
  const conflicts = detectConflicts(sectorState);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0].trainIds, ["12012", "12926"]);
  assert.equal(conflicts[0].yieldingTrainId, "12926");
});

test("AI comparison reduces deterministic legacy detention", () => {
  const comparison = buildDispatchComparison(sectorState);
  assert.equal(comparison.legacyDispatchOutcome.totalCumulativeDelayAddedMin, 57);
  assert.equal(comparison.aiOptimizedDispatchOutcome.totalDelaySavedMin, 41);
  assert.equal(comparison.aiOptimizedDispatchOutcome.throughputEfficiencyGainPct, 72);
});

test("does not treat adjacent reservations as a conflict", () => {
  assert.equal(intervalsOverlap({ entry: "2026-01-01T00:00:00Z", exit: "2026-01-01T00:10:00Z" }, { entry: "2026-01-01T00:10:00Z", exit: "2026-01-01T00:20:00Z" }), false);
});
