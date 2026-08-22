import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  ShieldAlert, 
  Cpu, 
  Zap, 
  Radio,
  Clock
} from 'lucide-react';
import { SIMULATION_STEPS } from '../data/simulationState';

interface ControlPanelProps {
  mode: 'legacy' | 'ai';
  setMode: (mode: 'legacy' | 'ai') => void;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  setMode,
  currentStepIndex,
  setCurrentStepIndex,
  isPlaying,
  setIsPlaying
}) => {
  const currentStep = SIMULATION_STEPS[currentStepIndex];

  const handleNext = () => {
    setCurrentStepIndex((prev) => (prev < SIMULATION_STEPS.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 lg:px-8 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Top bar: Brand & Telemetry Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  RailGuard <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">AI</span>
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Sector 100 Simulator
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ambala Cantt (0 km) ↔ Kurukshetra (52 km) ↔ Panipat (100 km)
              </p>
            </div>
          </div>

          {/* Time & Phase Badge */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                {currentStep.timeLabel}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Step {currentStep.step} of 5
              </span>
            </div>
          </div>
        </div>

        {/* Middle Bar: Mode Selectors & Playback Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Mode Switcher */}
          <div className="md:col-span-6 grid grid-cols-2 gap-2">
            {/* Legacy Button */}
            <button
              onClick={() => setMode('legacy')}
              className={`relative overflow-hidden flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                mode === 'legacy'
                  ? 'bg-gradient-to-r from-rose-950/80 to-rose-900/90 text-rose-200 border-2 border-rose-500 shadow-lg shadow-rose-950/50 glow-rose'
                  : 'bg-slate-950/60 text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 border border-slate-800'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${mode === 'legacy' ? 'text-rose-400' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="leading-tight">Legacy System</div>
                <div className="text-[10px] font-normal opacity-70">Reactive Outer-Signal Halts</div>
              </div>
              {mode === 'legacy' && (
                <span className="absolute top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>

            {/* AI Mode Button */}
            <button
              onClick={() => setMode('ai')}
              className={`relative overflow-hidden flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                mode === 'ai'
                  ? 'bg-gradient-to-r from-emerald-950/80 to-teal-900/90 text-emerald-200 border-2 border-emerald-400 shadow-lg shadow-emerald-950/50 glow-emerald'
                  : 'bg-slate-950/60 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/20 border border-slate-800'
              }`}
            >
              <Zap className={`w-4 h-4 ${mode === 'ai' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="leading-tight">RailGuard AI Mode</div>
                <div className="text-[10px] font-normal opacity-70">Preemptive Loop & Flow Routing</div>
              </div>
              {mode === 'ai' && (
                <span className="absolute top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Playback & Step Controls */}
          <div className="md:col-span-6 flex items-center justify-between sm:justify-end gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3 py-2.5 rounded-lg bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition flex items-center gap-1 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer border ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  Pause Simulation
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Auto Play
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === SIMULATION_STEPS.length - 1}
              className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/30 disabled:opacity-30 disabled:cursor-not-allowed border border-cyan-500 transition cursor-pointer"
            >
              Next Event
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
