const toMillis = (value) => new Date(value).getTime();

export function intervalsOverlap(first, second) {
  return toMillis(first.entry) < toMillis(second.exit) && toMillis(second.entry) < toMillis(first.exit);
}

export function detectConflicts(state) {
  const conflicts = [];
  for (let i = 0; i < state.trains.length; i += 1) {
    for (let j = i + 1; j < state.trains.length; j += 1) {
      const trainA = state.trains[i];
      const trainB = state.trains[j];
      for (const occupationA of trainA.occupation) {
        for (const occupationB of trainB.occupation) {
          if (occupationA.blockId !== occupationB.blockId || !intervalsOverlap(occupationA, occupationB)) continue;
          const overlapStart = new Date(Math.max(toMillis(occupationA.entry), toMillis(occupationB.entry))).toISOString();
          const overlapEnd = new Date(Math.min(toMillis(occupationA.exit), toMillis(occupationB.exit))).toISOString();
          const minutes = Math.ceil((toMillis(overlapEnd) - toMillis(overlapStart)) / 60000);
          const yieldingTrain = trainA.priority === trainB.priority
            ? (trainA.delayMinutes >= trainB.delayMinutes ? trainA : trainB)
            : (trainA.priority > trainB.priority ? trainA : trainB);
          const protectedTrain = yieldingTrain.id === trainA.id ? trainB : trainA;
          conflicts.push({
            id: `${occupationA.blockId}:${trainA.id}:${trainB.id}`,
            severity: minutes >= 15 ? "HIGH" : "MEDIUM",
            blockId: occupationA.blockId,
            trainIds: [trainA.id, trainB.id],
            overlap: { start: overlapStart, end: overlapEnd, minutes },
            protectedTrainId: protectedTrain.id,
            yieldingTrainId: yieldingTrain.id,
            reason: `Both trains reserve ${occupationA.blockId} for ${minutes} overlapping minute(s).`
          });
        }
      }
    }
  }
  return conflicts;
}

export function buildDeterministicAdvice(state, conflicts) {
  return conflicts.map((conflict) => {
    const block = state.blocks.find(({ id }) => id === conflict.blockId);
    const yieldingTrain = state.trains.find(({ id }) => id === conflict.yieldingTrainId);
    const holdStation = state.stations.find(({ id }) => id === block.from);
    return {
      conflictId: conflict.id,
      urgency: conflict.severity,
      action: "HOLD_FOR_PASS",
      trainId: yieldingTrain.id,
      location: holdStation.name,
      rationale: `Keep ${yieldingTrain.name} clear of ${conflict.blockId} until ${conflict.overlap.end}; protect train ${conflict.protectedTrainId}'s reserved path.`,
      operatorConfirmationRequired: true
    };
  });
}
