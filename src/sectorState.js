export const sectorState = {
  sectorId: "AMB-100",
  generatedAt: "2026-08-22T07:00:00.000Z",
  stations: [
    { id: "AMB", name: "Ambala Cantt", km: 0, loopLines: 2 },
    { id: "KRL", name: "Kurukshetra", km: 52, loopLines: 3 },
    { id: "PNP", name: "Panipat", km: 100, loopLines: 2 }
  ],
  blocks: [
    { id: "AMB-KRL-UP", from: "AMB", to: "KRL", direction: "UP", kmStart: 0, kmEnd: 52, track: "UP_MAIN" },
    { id: "AMB-KRL-DN", from: "KRL", to: "AMB", direction: "DOWN", kmStart: 0, kmEnd: 52, track: "DOWN_MAIN" },
    { id: "KRL-PNP-UP", from: "KRL", to: "PNP", direction: "UP", kmStart: 52, kmEnd: 100, track: "UP_MAIN" },
    { id: "KRL-PNP-DN", from: "PNP", to: "KRL", direction: "DOWN", kmStart: 52, kmEnd: 100, track: "DOWN_MAIN" }
  ],
  operationalContext: {
    signalling: "Automatic Block System",
    temporarySpeedRestriction: { fromKm: 52, toKm: 58, speedKmh: 30, reason: "Sleeper maintenance caution order" },
    gradient: { location: "Kurukshetra approach", ratio: "1:100 rising", operationalImpact: "Loaded freight loses acceleration after a full stop" },
    freightBrakingDistanceKm: 1.2
  },
  trains: [
    {
      id: "12012", name: "Kalka Shatabdi", priority: 1, status: "ON_TIME", delayMinutes: 0, currentPositionKm: 5, currentSpeedKmh: 110, direction: "UP",
      occupation: [{ blockId: "AMB-KRL-UP", entry: "2026-08-22T07:05:00.000Z", exit: "2026-08-22T07:35:00.000Z" }]
    },
    {
      id: "12926", name: "Paschim Express", priority: 2, status: "DELAYED", delayMinutes: 18, currentPositionKm: 28, currentSpeedKmh: 60, direction: "UP",
      occupation: [{ blockId: "AMB-KRL-UP", entry: "2026-08-22T07:22:00.000Z", exit: "2026-08-22T07:52:00.000Z" }]
    },
    {
      id: "14034", name: "Jammu Mail", priority: 2, status: "ON_TIME", delayMinutes: 0, currentPositionKm: 68, currentSpeedKmh: 75, direction: "UP",
      occupation: [{ blockId: "KRL-PNP-UP", entry: "2026-08-22T07:45:00.000Z", exit: "2026-08-22T08:15:00.000Z" }]
    },
    {
      id: "64532", name: "Delhi MEMU", priority: 4, status: "ON_TIME", delayMinutes: 0, currentPositionKm: 84, currentSpeedKmh: 45, direction: "DOWN",
      occupation: [{ blockId: "KRL-PNP-DN", entry: "2026-08-22T07:35:00.000Z", exit: "2026-08-22T08:08:00.000Z" }]
    },
    {
      id: "22446", name: "Shri Shakti AC Express", priority: 1, status: "ON_TIME", delayMinutes: 0, currentPositionKm: 44, currentSpeedKmh: 85, direction: "DOWN",
      occupation: [{ blockId: "AMB-KRL-DN", entry: "2026-08-22T07:10:00.000Z", exit: "2026-08-22T07:42:00.000Z" }]
    }
  ]
};
