// src/data/simulationState.ts
// Direct mapping for the 50-minute chronological domino effect simulation timeline

export interface Station {
  id: string;
  name: string;
  km: number;
  loopLines: number;
  description: string;
}

export interface TrainState {
  id: string;
  name: string;
  priority: number; // 1 = High Speed / Premium, 2 = Express, 4 = Local / MEMU / Freight
  direction: 'UP' | 'DOWN';
  type: 'high-speed' | 'express' | 'local' | 'freight';
  positionKm: number; // 0 to 100 km
  speedKmh: number;
  track: 'UP_MAIN' | 'DOWN_MAIN' | 'LOOP_1' | 'LOOP_2' | 'LOOP_3';
  yOffsetPx?: number; // Visual track offset in px
  status: 'ON_TIME' | 'DELAYED' | 'HALTED' | 'REGULATED' | 'DIVERTED';
  delayMinutes: number;
  blockId: string;
  slaPenaltyRisk?: string;
  tooltip?: {
    type: 'danger' | 'success' | 'warning' | 'info';
    title: string;
    message: string;
  };
}

export interface DriverPortalMessage {
  train: string;
  message: string;
}

export interface SimulationStep {
  step: number;
  minute: number;
  title: string;
  phaseName: string;
  timeLabel: string;
  description: string;
  legacyDelay: number;
  aiDelay: number;
  llm_hit: boolean;
  activeBottleneck?: string;
  driver_portal_messages?: DriverPortalMessage[];
  trains: {
    legacy: Record<string, Partial<TrainState>>;
    ai: Record<string, Partial<TrainState>>;
  };
  geminiTriageAdvice: {
    summary: string;
    action: string;
    targetTrain: string;
    rationale: string;
  };
}

// 3 Stations: Station A (Ambala, 0km), Station B (Kurukshetra, 50km), Station C (Panipat, 100km)
export const STATIONS: Station[] = [
  {
    id: 'AMB',
    name: 'Station A (Ambala Cantt)',
    km: 0,
    loopLines: 2,
    description: 'Northern junction terminal (0 km)'
  },
  {
    id: 'KRL',
    name: 'Station B (Kurukshetra)',
    km: 50,
    loopLines: 3,
    description: 'Mid-sector junction with dynamic loops & 1:100 rising gradient (50 km)'
  },
  {
    id: 'PNP',
    name: 'Station C (Panipat Jn)',
    km: 100,
    loopLines: 2,
    description: 'Southern terminal corridor & Freight Siding (100 km)'
  }
];

// Operational Sector Constraints
export const SECTOR_CONSTRAINTS = {
  lengthKm: 100,
  tsr: {
    fromKm: 50,
    toKm: 56,
    speedKmh: 30,
    reason: 'Sleeper maintenance caution order'
  },
  gradient: {
    location: 'Station B approach (km 45-50)',
    ratio: '1:100 rising',
    impact: 'Full stop causes severe 15-25 min restart & braking penalty'
  }
};

// The Cast (5 Trains):
export const INITIAL_TRAINS: TrainState[] = [
  {
    id: '12012',
    name: 'Fast Train (Vande Bharat)',
    priority: 1,
    direction: 'UP',
    type: 'high-speed',
    positionKm: -15,
    speedKmh: 110,
    track: 'UP_MAIN',
    status: 'DELAYED',
    delayMinutes: 25,
    blockId: 'AMB-KRL-UP'
  },
  {
    id: '12926',
    name: 'Express',
    priority: 2,
    direction: 'UP',
    type: 'express',
    positionKm: 10,
    speedKmh: 65,
    track: 'UP_MAIN',
    status: 'DELAYED',
    delayMinutes: 12,
    blockId: 'AMB-KRL-UP'
  },
  {
    id: '64532',
    name: 'Local 2',
    priority: 4,
    direction: 'UP',
    type: 'local',
    positionKm: 25,
    speedKmh: 45,
    track: 'UP_MAIN',
    status: 'ON_TIME',
    delayMinutes: 0,
    blockId: 'AMB-KRL-UP'
  },
  {
    id: '64511',
    name: 'Local 1',
    priority: 4,
    direction: 'DOWN',
    type: 'local',
    positionKm: 52,
    speedKmh: 40,
    track: 'DOWN_MAIN',
    status: 'ON_TIME',
    delayMinutes: 0,
    blockId: 'KRL-AMB-DN'
  },
  {
    id: 'BOXN-582',
    name: 'Heavy Freight (5000t)',
    priority: 4,
    direction: 'UP',
    type: 'freight',
    positionKm: 65,
    speedKmh: 35,
    track: 'UP_MAIN',
    status: 'ON_TIME',
    delayMinutes: 0,
    blockId: 'KRL-PNP-UP',
    slaPenaltyRisk: '₹4.5 Lakh Power Plant SLA'
  }
];

// Chronological 6-Event 50-Minute Simulation Timeline with LLM Hits & Driver Portal Messages
export const SIMULATION_STEPS: SimulationStep[] = [
  {
    step: 1,
    minute: 16,
    title: 'Delayed Express Tailgating Local 2',
    phaseName: 'Event 1: Dynamic Rolling Overtake',
    timeLabel: '07:16 AM (Min 16)',
    description: 'Delayed Express catches up to Local 2 at km 25. Legacy halts Local 2 at outer signal for 15m. AI schedules a rolling overtake at km 30 without halting.',
    legacyDelay: 15,
    aiDelay: 0,
    llm_hit: true,
    activeBottleneck: 'Headway tailgating on UP Main at km 25',
    driver_portal_messages: [
      {
        train: 'Local 2',
        message: 'AI ALERT: Do not halt. Maintain 45 km/h. Take Loop Line 1 at km 30 for rolling overtake by Express. Mainline reentry at km 32.'
      },
      {
        train: 'Express',
        message: 'AI ALERT: Proceed on Mainline at 75 km/h. Local 2 clearing track to Loop 1 at km 30.'
      }
    ],
    geminiTriageAdvice: {
      summary: 'Delayed Express tailgating Local 2 at km 25.',
      action: 'DYNAMIC_ROLLING_OVERTAKE',
      targetTrain: 'Local 2',
      rationale: 'Maintain Local 2 speed, route to parallel loop at km 30 for rolling overtake without bringing any train to a complete stop.'
    },
    trains: {
      legacy: {
        '12012': { positionKm: -2, speedKmh: 110, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 25 },
        '12926': { positionKm: 22, speedKmh: 50, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 12, tooltip: { type: 'danger', title: 'Tailgating Local 2', message: 'Restricted behind Local 2 on UP Main.' } },
        '64532': { positionKm: 38, speedKmh: 0, track: 'UP_MAIN', yOffsetPx: 0, status: 'HALTED', delayMinutes: 15, tooltip: { type: 'danger', title: 'HALTED AT SIGNAL', message: 'Forced dead-stop at outer signal for 15 minutes.' } },
        '64511': { positionKm: 52, speedKmh: 35, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 72, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 }
      },
      ai: {
        '12012': { positionKm: -2, speedKmh: 110, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 25 },
        '12926': { positionKm: 22, speedKmh: 75, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0, tooltip: { type: 'success', title: 'Mainline Proceed', message: 'Proceeding on UP Main. Local 2 clearing track ahead.' } },
        '64532': { positionKm: 30, speedKmh: 45, track: 'LOOP_2', yOffsetPx: -38, status: 'DIVERTED', delayMinutes: 0, tooltip: { type: 'info', title: 'ROLLING OVERTAKE', message: 'Gliding into Loop 1 at 45 km/h. Zero full-stops!' } },
        '64511': { positionKm: 52, speedKmh: 35, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 72, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 }
      }
    }
  },
  {
    step: 2,
    minute: 21,
    title: 'Vande Bharat Surge & Gradient Bottleneck',
    phaseName: 'Event 2: Preemptive Speed Regulation',
    timeLabel: '07:21 AM (Min 21)',
    description: 'Severely delayed Fast Train (Vande Bharat) surges at 110 km/h toward Express at km 42. Legacy halts Express on 1:100 gradient. AI regulates Express to 30 km/h into Station B Loop 2.',
    legacyDelay: 32,
    aiDelay: 3,
    llm_hit: true,
    activeBottleneck: 'Station B (Kurukshetra) 1:100 gradient approach',
    driver_portal_messages: [
      {
        train: 'Express',
        message: 'AI ALERT: Regulate speed to 30 km/h. Divert to Station B Loop 2 bypass at km 42 to yield to Vande Bharat.'
      },
      {
        train: 'Fast Train (Vande Bharat)',
        message: 'AI ALERT: Mainline green wave clear at 110 km/h through Station B.'
      }
    ],
    geminiTriageAdvice: {
      summary: 'Severely delayed Fast Train (Vande Bharat) approaching diverted Express at km 42.',
      action: 'PREEMPTIVE_SPEED_REGULATION',
      targetTrain: 'Express',
      rationale: 'Regulate Express speed to 30 km/h and divert to Kurukshetra Loop 2 bypass, avoiding dead stop on 1:100 incline.'
    },
    trains: {
      legacy: {
        '12012': { positionKm: 22, speedKmh: 80, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 25 },
        '12926': { positionKm: 46, speedKmh: 0, track: 'UP_MAIN', yOffsetPx: 0, status: 'HALTED', delayMinutes: 28, tooltip: { type: 'danger', title: 'DEAD-STOP ON GRADIENT', message: 'Halted before 1:100 incline (+18m braking/restart loss).' } },
        '64532': { positionKm: 60, speedKmh: 25, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 15 },
        '64511': { positionKm: 48, speedKmh: 35, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 82, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 }
      },
      ai: {
        '12012': { positionKm: 22, speedKmh: 110, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0, tooltip: { type: 'success', title: 'GREEN WAVE', message: 'Cruising at 110 km/h on clear main track.' } },
        '12926': { positionKm: 46, speedKmh: 30, track: 'LOOP_2', yOffsetPx: -38, status: 'DIVERTED', delayMinutes: 3, tooltip: { type: 'info', title: 'LOOP 2 DIVERSION', message: 'Entering Loop 2 bypass at 30 km/h. Gradient halt avoided.' } },
        '64532': { positionKm: 54, speedKmh: 45, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        '64511': { positionKm: 48, speedKmh: 35, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 82, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 }
      }
    }
  },
  {
    step: 3,
    minute: 32,
    title: 'Return Journey Crossover Conflict',
    phaseName: 'Event 3: Crossover Synchronization',
    timeLabel: '07:32 AM (Min 32)',
    description: 'Local 1 starts return journey (Station B -> A) across crossover at km 50. Legacy halts Local 1 for 22m. AI synchronizes crossover 90s prior to Fast Train arrival.',
    legacyDelay: 48,
    aiDelay: 5,
    llm_hit: true,
    activeBottleneck: 'Station B junction crossover switch',
    driver_portal_messages: [
      {
        train: 'Local 1',
        message: 'AI ALERT: Expedite return crossover at Station B now. Fast Train approaching in 90 seconds.'
      },
      {
        train: 'Fast Train (Vande Bharat)',
        message: 'AI ALERT: Maintain 95 km/h. Station B crossover clearing ahead.'
      }
    ],
    geminiTriageAdvice: {
      summary: 'Fast Train encounters Local 1 making return journey (Station B -> A) across crossover.',
      action: 'CROSSOVER_SYNCHRONIZATION',
      targetTrain: 'Local 1',
      rationale: 'Authorize Local 1 return crossover 90 seconds prior to Fast Train arrival, preventing platform gridlock.'
    },
    trains: {
      legacy: {
        '12012': { positionKm: 34, speedKmh: 30, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 20 },
        '12926': { positionKm: 52, speedKmh: 15, track: 'UP_MAIN', yOffsetPx: 0, status: 'HALTED', delayMinutes: 38 },
        '64532': { positionKm: 66, speedKmh: 20, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 22 },
        '64511': { positionKm: 50, speedKmh: 0, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'HALTED', delayMinutes: 22, tooltip: { type: 'danger', title: 'CROSSOVER HALT', message: 'Held at red switch signal blocking platform throat.' } },
        'BOXN-582': { positionKm: 90, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 }
      },
      ai: {
        '12012': { positionKm: 48, speedKmh: 95, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0, tooltip: { type: 'success', title: 'CROSSOVER CLEAR', message: 'Station B crossover cleared 90s ahead of arrival.' } },
        '12926': { positionKm: 50, speedKmh: 30, track: 'LOOP_2', yOffsetPx: -38, status: 'DIVERTED', delayMinutes: 3 },
        '64532': { positionKm: 66, speedKmh: 50, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        '64511': { positionKm: 40, speedKmh: 40, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0, tooltip: { type: 'info', title: 'RETURN JOURNEY B->A', message: 'Crossover completed smoothly. En route back to Station A.' } },
        'BOXN-582': { positionKm: 90, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 }
      }
    }
  },
  {
    step: 4,
    minute: 38,
    title: 'Heavy Freight SLA Warning Triggered',
    phaseName: 'Event 4: SLA Intercept Warning',
    timeLabel: '07:38 AM (Min 38)',
    description: '5,000t Heavy Freight blocking Fast Train at km 72 near Panipat. Legacy is about to halt Freight (₹4.5 Lakh SLA Penalty). AI triggers SLA Loss Warning.',
    legacyDelay: 55,
    aiDelay: 8,
    llm_hit: true,
    activeBottleneck: 'Panipat approach (km 72) & Heavy Freight SLA threshold',
    driver_portal_messages: [
      {
        train: 'Heavy Freight (5000t)',
        message: 'AI ALERT: SLA WARNING AVOIDED. Do not halt heavy 5,000t load. Transition to Panipat Siding at 25 km/h.'
      },
      {
        train: 'Fast Train (Vande Bharat)',
        message: 'AI ALERT: Track 1 clearing at km 75. Maintain 105 km/h.'
      }
    ],
    geminiTriageAdvice: {
      summary: 'Heavy Freight Train blocking Fast Train. Legacy about to trigger ₹4.5L SLA Penalty.',
      action: 'SLA_INTERCEPT_WARNING',
      targetTrain: 'Heavy Freight (5000t)',
      rationale: 'Intercept Freight halt, rerouting Freight to moving siding at 25 km/h to maintain momentum and save SLA contract.'
    },
    trains: {
      legacy: {
        '12012': { positionKm: 44, speedKmh: 45, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 18 },
        '12926': { positionKm: 62, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 42 },
        '64532': { positionKm: 74, speedKmh: 30, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 28 },
        '64511': { positionKm: 28, speedKmh: 40, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 92, speedKmh: 0, track: 'UP_MAIN', yOffsetPx: 0, status: 'HALTED', delayMinutes: 30, tooltip: { type: 'danger', title: 'SLA PENALTY TRIGGERED', message: 'Halted 5,000t coal load! Incurs ₹4.5 Lakh Power Plant SLA fine.' } }
      },
      ai: {
        '12012': { positionKm: 68, speedKmh: 105, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0, tooltip: { type: 'success', title: 'MAINLINE OVERTAKE', message: 'Overtaking Heavy Freight. Main track 100% clear.' } },
        '12926': { positionKm: 54, speedKmh: 65, track: 'LOOP_2', yOffsetPx: -38, status: 'DIVERTED', delayMinutes: 3 },
        '64532': { positionKm: 74, speedKmh: 50, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        '64511': { positionKm: 28, speedKmh: 40, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 88, speedKmh: 25, track: 'LOOP_3', yOffsetPx: 38, status: 'DIVERTED', delayMinutes: 5, tooltip: { type: 'warning', title: 'SLA SAVED (25 km/h)', message: 'Rolling entry into Siding at 25 km/h. Zero SLA penalty!' } }
      }
    }
  },
  {
    step: 5,
    minute: 40,
    title: 'Rolling Siding Entry & Zero SLA Loss',
    phaseName: 'Event 5: Continuous Momentum Protection',
    timeLabel: '07:40 AM (Min 40)',
    description: 'AI executes seamless rolling entry for 5,000t Freight into Panipat siding at 25 km/h. Zero full stops, 100% SLA preserved.',
    legacyDelay: 58,
    aiDelay: 10,
    llm_hit: true,
    activeBottleneck: 'Panipat Freight Siding Switch (km 80-88)',
    driver_portal_messages: [
      {
        train: 'Heavy Freight (5000t)',
        message: 'AI ALERT: Siding entry clear. Maintain 25 km/h rolling momentum. Zero SLA penalty incurred.'
      }
    ],
    geminiTriageAdvice: {
      summary: 'Freight entering siding at km 80 while maintaining 25 km/h rolling momentum.',
      action: 'CONTINUOUS_MOMENTUM_ENTRY',
      targetTrain: 'Heavy Freight (5000t)',
      rationale: 'Seamless rolling entry onto siding; zero full stops, 100% SLA preserved.'
    },
    trains: {
      legacy: {
        '12012': { positionKm: 58, speedKmh: 40, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 22 },
        '12926': { positionKm: 74, speedKmh: 35, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 45 },
        '64532': { positionKm: 84, speedKmh: 25, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 32 },
        '64511': { positionKm: 18, speedKmh: 40, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 104, speedKmh: 0, track: 'UP_MAIN', yOffsetPx: 0, status: 'HALTED', delayMinutes: 38, tooltip: { type: 'danger', title: '5000t DEAD-STOP', message: 'Heavy train stalled! 25-minute restart & brake recovery loss.' } }
      },
      ai: {
        '12012': { positionKm: 90, speedKmh: 110, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        '12926': { positionKm: 72, speedKmh: 70, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 3 },
        '64532': { positionKm: 84, speedKmh: 50, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        '64511': { positionKm: 18, speedKmh: 40, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 94, speedKmh: 25, track: 'LOOP_3', yOffsetPx: 38, status: 'DIVERTED', delayMinutes: 5, tooltip: { type: 'success', title: 'SLA PRESERVED 100%', message: 'Maintained 25 km/h rolling momentum. Zero fine!' } }
      }
    }
  },
  {
    step: 6,
    minute: 45,
    title: 'Station C Final Bottleneck Resolution',
    phaseName: 'Event 6: Synchronized Terminal Arrival',
    timeLabel: '07:45 AM (Min 45)',
    description: 'Freight siding exit conflicts with Local 2 arriving at Station C (Panipat, km 100). AI synchronizes staggered entry into Platform 1 and 2.',
    legacyDelay: 64,
    aiDelay: 12,
    llm_hit: true,
    activeBottleneck: 'Station C (Panipat) throat crossover',
    driver_portal_messages: [
      {
        train: 'Local 2',
        message: 'AI ALERT: Enter Station C Platform 1 at 30 km/h. Track 2 reserved for Freight exit.'
      },
      {
        train: 'Heavy Freight (5000t)',
        message: 'AI ALERT: Proceed to Panipat Freight Terminal via Loop 3.'
      }
    ],
    geminiTriageAdvice: {
      summary: 'Freight siding exit conflicts with Local 2 arriving at Station C.',
      action: 'SYNCHRONIZED_TERMINAL_ARRIVAL',
      targetTrain: 'Local 2 & Freight',
      rationale: 'Synchronized staggered entry into Platform 1 and Platform 2 at Station C.'
    },
    trains: {
      legacy: {
        '12012': { positionKm: 78, speedKmh: 60, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 24, tooltip: { type: 'danger', title: 'Schedule Blown', message: '+24 min final delay on high-speed route.' } },
        '12926': { positionKm: 64, speedKmh: 45, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 48 },
        '64532': { positionKm: 92, speedKmh: 20, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 38 },
        '64511': { positionKm: 0, speedKmh: 30, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 104, speedKmh: 10, track: 'UP_MAIN', yOffsetPx: 0, status: 'DELAYED', delayMinutes: 45 }
      },
      ai: {
        '12012': { positionKm: 112, speedKmh: 110, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0, tooltip: { type: 'success', title: 'Zero Delay', message: '100% On-Time arrival at Panipat corridor.' } },
        '12926': { positionKm: 92, speedKmh: 75, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 3 },
        '64532': { positionKm: 100, speedKmh: 30, track: 'UP_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0, tooltip: { type: 'success', title: 'PF 1 ARRIVAL', message: 'Staggered arrival into Platform 1 at 30 km/h.' } },
        '64511': { positionKm: 0, speedKmh: 30, track: 'DOWN_MAIN', yOffsetPx: 0, status: 'ON_TIME', delayMinutes: 0 },
        'BOXN-582': { positionKm: 98, speedKmh: 25, track: 'LOOP_3', yOffsetPx: 38, status: 'ON_TIME', delayMinutes: 5, tooltip: { type: 'success', title: 'FREIGHT TERMINAL ENTRY', message: 'Arrived at Freight Yard with 0 SLA penalty.' } }
      }
    }
  }
];
