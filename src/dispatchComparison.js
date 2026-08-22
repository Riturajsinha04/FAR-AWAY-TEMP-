const action = (trainId, actionName, additionalDelayMin, reasoning) => ({ trainId, action: actionName, additionalDelayMin, reasoning });

// Transparent demo model, not a signal-control or routing system. The constants
// represent clearly stated operational penalties so the UI can compare outcomes.
export function buildDispatchComparison(state) {
  const trains = state.trains;
  const byId = (id) => trains.find((train) => train.id === id);
  const freight = byId("64532");
  const passenger = byId("12926");
  const shatabdi = byId("12012");
  const mail = byId("14034");
  const express = byId("22446");

  const legacyActions = [
    action(freight.id, "HALT_AT_OUTER_SIGNAL", 28, "Full stop before the rising Kurukshetra approach; braking and restart penalty for low-priority movement."),
    action(passenger.id, "HALT_AT_OUTER_SIGNAL", 15, "Held to protect the reserved AMB-KRL-UP path for the higher-priority Shatabdi."),
    action(shatabdi.id, "RUN_THROUGH", 0, "Main line is cleared by holding following traffic."),
    action(mail.id, "CAUTION_APPROACH", 8, "Receives a restrictive approach because TSR occupancy and platform movements propagate."),
    action(express.id, "CAUTION_APPROACH", 6, "Regulated at the opposing approach while conflicts clear.")
  ];
  const aiSteps = [
    { timeOffsetMin: 0, targetTrainId: freight.id, command: "SPEED_REGULATION", targetLineOrLoop: "Kurukshetra approach", targetSpeedKmh: 25, delayImpactMin: 5, justification: "Reduce speed before the conflict instead of stopping the heavy movement on the rising gradient." },
    { timeOffsetMin: 4, targetTrainId: passenger.id, command: "LOOP_DIVERSION", targetLineOrLoop: "Kurukshetra Loop 2", targetSpeedKmh: 30, delayImpactMin: 6, justification: "Use available loop capacity to preserve the main-line path." },
    { timeOffsetMin: 10, targetTrainId: shatabdi.id, command: "RUN_THROUGH", targetLineOrLoop: "AMB-KRL-UP Main", targetSpeedKmh: 95, delayImpactMin: 0, justification: "Pass after the looped passenger clears the protected overlap." },
    { timeOffsetMin: 15, targetTrainId: mail.id, command: "SPEED_REGULATION", targetLineOrLoop: "KRL-PNP-UP TSR approach", targetSpeedKmh: 30, delayImpactMin: 3, justification: "Enter the TSR at its permitted speed without queuing at a signal." },
    { timeOffsetMin: 18, targetTrainId: express.id, command: "RUN_THROUGH", targetLineOrLoop: "AMB-KRL-DN Main", targetSpeedKmh: 75, delayImpactMin: 2, justification: "Release opposing movement once the block reservation is clear." }
  ];
  const legacyDelay = legacyActions.reduce((total, item) => total + item.additionalDelayMin, 0);
  const aiDelay = aiSteps.reduce((total, item) => total + item.delayImpactMin, 0);

  return {
    sectorMetadata: {
      sectorLengthKm: 100,
      activeConstraints: [
        `${state.operationalContext.temporarySpeedRestriction.speedKmh} km/h TSR, km ${state.operationalContext.temporarySpeedRestriction.fromKm}-${state.operationalContext.temporarySpeedRestriction.toKm}`,
        state.operationalContext.gradient.operationalImpact,
        `${state.operationalContext.freightBrakingDistanceKm} km loaded-freight braking distance`
      ],
      bottleneckSummary: "AMB-KRL-UP reservation overlap combined with the Kurukshetra TSR approach."
    },
    trainStates: trains.map(({ id, name, priority, currentPositionKm, currentSpeedKmh, delayMinutes }) => ({ trainId: id, trainName: name, priorityClass: priority, currentPositionKm, currentSpeedKmh, initialDelayMin: delayMinutes })),
    legacyDispatchOutcome: { strategyDescription: "Reactive outer-signal halts clear the main line but create stop-and-restart detention.", trainActions: legacyActions, totalCumulativeDelayAddedMin: legacyDelay, networkCongestionScore: "HIGH" },
    aiOptimizedDispatchOutcome: { strategyDescription: "Preemptive speed regulation and loop use avoid the freight full-stop penalty while preserving protected paths.", dispatchSteps: aiSteps, totalDelaySavedMin: legacyDelay - aiDelay, throughputEfficiencyGainPct: Math.round(((legacyDelay - aiDelay) / legacyDelay) * 100), keyBenefits: ["Avoids loaded-freight stop on rising gradient", "Uses Kurukshetra Loop 2 before queue formation", "Keeps TSR entry controlled rather than signal-held"] },
    modelDisclaimer: "Deterministic hackathon simulation only. All real train movements require authorised railway operating procedures and human control."
  };
}
