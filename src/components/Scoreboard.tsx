import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  TrendingDown, 
  Zap, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Flame,
  Layers,
  Gauge,
  Timer
} from 'lucide-react';
import { SimulationStep } from '../data/simulationState';

interface ScoreboardProps {
  mode: 'legacy' | 'ai';
  setMode: (mode: 'legacy' | 'ai') => void;
  currentStep: SimulationStep;
}

// Dedicated Legacy Delayed Trains Data (Strictly the trains suffering detention)
const LEGACY_DELAYED_TRAINS = [
  {
    id: "12926",
    name: "Paschim Express",
    priority: 2,
    direction: "UP",
    type: "express",
    delayAddedMin: 42,
    speedKmh: 0,
    penaltyType: "GRADIENT DEAD-STOP",
    penaltySeverity: "CRITICAL",
    signalAspect: "RED",
    location: "Kurukshetra Outer (km 48)",
    operationalCause: "Forced full emergency stop on 1:100 rising gradient before Kurukshetra. Incurs heavy 15-20 min braking and restart acceleration penalty."
  },
  {
    id: "64532",
    name: "Delhi MEMU",
    priority: 4,
    direction: "DOWN",
    type: "local",
    delayAddedMin: 38,
    speedKmh: 0,
    penaltyType: "OUTER SIGNAL DETENTION",
    penaltySeverity: "CRITICAL",
    signalAspect: "RED",
    location: "Kurukshetra Outer (km 60)",
    operationalCause: "Held stationary at outer signal to clear conflicting platform tracks. Freight loses all momentum, blocking the DOWN main corridor."
  },
  {
    id: "12012",
    name: "Kalka Shatabdi",
    priority: 1,
    direction: "UP",
    type: "high-speed",
    delayAddedMin: 24,
    speedKmh: 25,
    penaltyType: "HEADWAY QUEUE PROPAGATION",
    penaltySeverity: "HIGH",
    signalAspect: "YELLOW / RED",
    location: "AMB-KRL Block (km 38)",
    operationalCause: "High-speed prestige express throttled from 110 km/h down to 25 km/h crawl behind delayed Paschim Express on shared block."
  }
];

// Dedicated RailGuard AI Time-Saved Trains Data (Strictly the trains that saved time / optimized)
const AI_OPTIMIZED_TRAINS = [
  {
    id: "12012",
    name: "Kalka Shatabdi",
    priority: 1,
    direction: "UP",
    type: "high-speed",
    timeSavedMin: 24,
    finalDelayMin: 0,
    speedKmh: 110,
    aiAction: "MAIN LINE GREEN WAVE",
    throughputGain: "100% ON-TIME",
    signalAspect: "GREEN",
    location: "UP Main (Ambala → Panipat)",
    aiOptimization: "RailGuard AI kept the entire 100km UP Main line completely clear. Shatabdi ran through Kurukshetra at 95–110 km/h without touching a single caution signal."
  },
  {
    id: "64532",
    name: "Delhi MEMU",
    priority: 4,
    direction: "DOWN",
    type: "local",
    timeSavedMin: 33,
    finalDelayMin: 5,
    speedKmh: 35,
    aiAction: "PREEMPTIVE SPEED MODULATION",
    throughputGain: "87% DELAY SAVED",
    signalAspect: "GREEN",
    location: "DOWN Main Corridor",
    aiOptimization: "Preemptively modulated speed to 25 km/h before the TSR. Entered the restriction smoothly without a dead-stop, saving 33 minutes of gradient acceleration loss."
  },
  {
    id: "12926",
    name: "Paschim Express",
    priority: 2,
    direction: "UP",
    type: "express",
    timeSavedMin: 18,
    finalDelayMin: 24,
    speedKmh: 30,
    aiAction: "LOOP 2 DYNAMIC BYPASS",
    throughputGain: "43% DELAY SAVED",
    signalAspect: "DOUBLE YELLOW",
    location: "Kurukshetra Loop 2 Line",
    aiOptimization: "Dynamically routed into Kurukshetra Loop 2 at 30 km/h before the conflict occurred. Main track remained clear while avoiding a dead-stop on the 1:100 incline."
  },
  {
    id: "14034",
    name: "Jammu Mail",
    priority: 2,
    direction: "UP",
    type: "express",
    timeSavedMin: 12,
    finalDelayMin: 3,
    speedKmh: 75,
    aiAction: "SYNCHRONIZED TSR PACING",
    throughputGain: "80% DELAY SAVED",
    signalAspect: "GREEN",
    location: "KRL-PNP Block",
    aiOptimization: "Regulated speed smoothly into the TSR at its permitted 30 km/h limit with zero signal queue detention."
  }
];

export const Scoreboard: React.FC<ScoreboardProps> = ({ mode, setMode, currentStep }) => {
  const legacyDelay = currentStep.legacyDelay;
  const aiDelay = currentStep.aiDelay;
  const totalDelaySaved = Math.max(0, legacyDelay - aiDelay);
  const efficiencyGainPct = legacyDelay > 0 ? Math.round((totalDelaySaved / legacyDelay) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
      
      {/* 1. INTERACTIVE COMPARISON ACCUMULATORS (Cols 1-5) */}
      <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Clock className="w-4 h-4 text-cyan-400" />
            Dispatch Comparison Mode
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            Interactive Switch
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 my-3.5">
          {/* Legacy Delay Button */}
          <button
            onClick={() => setMode('legacy')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              mode === 'legacy'
                ? 'bg-rose-950/80 border-rose-500 shadow-xl shadow-rose-950/70 ring-2 ring-rose-500/70 glow-rose'
                : 'bg-slate-950/50 border-slate-800 hover:border-rose-900/60 hover:bg-rose-950/20 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Legacy Dispatch
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                3 Key Trains Delayed
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <motion.span 
                key={`legacy-${legacyDelay}`}
                initial={{ scale: 1.15, color: '#f43f5e' }}
                animate={{ scale: 1, color: '#fda4af' }}
                className="text-4xl font-black font-mono tracking-tight text-rose-200"
              >
                +{legacyDelay}
              </motion.span>
              <span className="text-sm font-bold text-rose-400 font-mono">MINUTES DETENTION</span>
            </div>
            
            <p className="text-[11px] text-rose-300/80 mt-1.5 flex items-center justify-between font-medium">
              <span>Cascading signal stops on 1:100 gradient</span>
              <span className="text-[10px] underline text-rose-400">Click to view Delayed Trains →</span>
            </p>
          </button>

          {/* RailGuard AI Button */}
          <button
            onClick={() => setMode('ai')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              mode === 'ai'
                ? 'bg-emerald-950/80 border-emerald-400 shadow-xl shadow-emerald-950/70 ring-2 ring-emerald-400/70 glow-emerald'
                : 'bg-slate-950/50 border-slate-800 hover:border-emerald-900/60 hover:bg-emerald-950/20 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                RailGuard AI Mode
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                4 Trains Saved Time
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <motion.span 
                key={`ai-${aiDelay}`}
                initial={{ scale: 1.15, color: '#10b981' }}
                animate={{ scale: 1, color: '#6ee7b7' }}
                className="text-4xl font-black font-mono tracking-tight text-emerald-200"
              >
                +{aiDelay}
              </motion.span>
              <span className="text-sm font-bold text-emerald-400 font-mono">MINUTES DELAY</span>
            </div>

            <p className="text-[11px] text-emerald-300/80 mt-1.5 flex items-center justify-between font-medium">
              <span>Loop 2 dynamic routing & continuous flow</span>
              <span className="text-[10px] underline text-emerald-400">Click to view Time-Saved Trains →</span>
            </p>
          </button>
        </div>

        {/* Efficiency Delta */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Sector Optimization:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              {totalDelaySaved} min saved ({efficiencyGainPct}% gain)
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Gradient Stalls: <span className="text-emerald-300 font-bold">0</span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMICALLY DIFFERENT TRAIN BREAKDOWN PANEL (Cols 6-12) */}
      <div className={`lg:col-span-7 rounded-2xl border p-5 shadow-xl flex flex-col justify-between transition-colors duration-300 ${
        mode === 'legacy'
          ? 'bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-950 border-rose-900/60'
          : 'bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 border-emerald-900/60'
      }`}>
        <div>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              {mode === 'legacy' ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-200">Legacy Dispatch: Delayed Trains Impact Log</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-200">RailGuard AI: Time-Saved Trains Optimization Log</span>
                </>
              )}
            </div>
            
            <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
              mode === 'legacy'
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700'
            }`}>
              {mode === 'legacy' ? `🔴 +${legacyDelay}m Cumulative Loss` : `🟢 +${totalDelaySaved}m Total Time Saved`}
            </span>
          </div>

          {/* TRAINS LIST: DISTINCT FOR LEGACY VS AI */}
          <div className="mt-3.5 space-y-2.5 max-h-[330px] overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              {mode === 'legacy' ? (
                // ==================== LEGACY DELAYED TRAINS LIST ====================
                <motion.div
                  key="legacy-trains-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  {LEGACY_DELAYED_TRAINS.map((train) => (
                    <div
                      key={train.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/50 hover:border-rose-600 transition-all shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Train Info */}
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black font-mono text-white">
                                Train {train.id}
                              </span>
                              <span className="text-xs font-bold text-slate-200">
                                {train.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                P{train.priority} • {train.direction}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {train.location} • Signal Aspect: <span className="text-rose-400 font-bold">{train.signalAspect}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delayed Badges */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800">
                            {train.penaltyType}
                          </span>
                          <span className="text-xs font-mono font-black text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-600 shadow-sm">
                            +{train.delayAddedMin}m Delay
                          </span>
                        </div>
                      </div>

                      {/* Operational Penalty Explanation */}
                      <p className="text-[11px] text-rose-200/80 mt-2 leading-relaxed bg-rose-950/30 p-2 rounded-lg border border-rose-950">
                        {train.operationalCause}
                      </p>
                    </div>
                  ))}
                </motion.div>
              ) : (
                // ==================== RAILGUARD AI TIME-SAVED TRAINS LIST ====================
                <motion.div
                  key="ai-trains-list"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  {AI_OPTIMIZED_TRAINS.map((train) => (
                    <div
                      key={train.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/50 hover:border-emerald-500 transition-all shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Train Info */}
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black font-mono text-white">
                                Train {train.id}
                              </span>
                              <span className="text-xs font-bold text-slate-200">
                                {train.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                P{train.priority} • {train.direction}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {train.location} • Speed: <span className="text-emerald-400 font-bold">{train.speedKmh} km/h</span>
                            </div>
                          </div>
                        </div>

                        {/* Time Saved Badges */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800">
                            {train.aiAction}
                          </span>
                          <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500 shadow-sm">
                            {train.timeSavedMin}m Saved ({train.throughputGain})
                          </span>
                        </div>
                      </div>

                      {/* AI Optimization Explanation */}
                      <p className="text-[11px] text-emerald-200/80 mt-2 leading-relaxed bg-emerald-950/30 p-2 rounded-lg border border-emerald-950">
                        {train.aiOptimization}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800/80 mt-3 text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>{mode === 'legacy' ? 'Fixed Red Signals • Forced Gradient Halts • Stop-Restart Losses' : 'Dynamic Loop Diversion • Regulated Momentum • Clear Mainline'}</span>
          <span>{mode === 'legacy' ? 'Congestion: CRITICAL (57m lost)' : 'Efficiency: +72% (41m saved)'}</span>
        </div>
      </div>

    </div>
  );
};
