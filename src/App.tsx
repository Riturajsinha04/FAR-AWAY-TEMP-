import React, { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SchematicTrackMap } from './components/SchematicTrackMap';
import { Scoreboard } from './components/Scoreboard';
import { TrainInspector } from './components/TrainInspector';
import { 
  INITIAL_TRAINS, 
  SIMULATION_STEPS, 
  TrainState 
} from './data/simulationState';
import { ShieldCheck, Layers, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'legacy' | 'ai'>('ai');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);

  const currentStep = SIMULATION_STEPS[currentStepIndex];

  // Derive active train states for current step and current mode
  const activeTrains: TrainState[] = INITIAL_TRAINS.map((baseTrain) => {
    const stepOverrides = currentStep.trains[mode][baseTrain.id] || {};
    return {
      ...baseTrain,
      ...stepOverrides
    };
  });

  const selectedTrain = selectedTrainId 
    ? activeTrains.find((t) => t.id === selectedTrainId) || null 
    : null;

  // Auto-play timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= SIMULATION_STEPS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Fixed Control Panel */}
      <ControlPanel
        mode={mode}
        setMode={setMode}
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {/* Main Simulation Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
        {/* Center Linear Schematic Track Diagram */}
        <SchematicTrackMap
          mode={mode}
          trains={activeTrains}
          selectedTrainId={selectedTrainId}
          onSelectTrain={(id) => setSelectedTrainId(id === selectedTrainId ? null : id)}
          stepNumber={currentStep.step}
          currentStep={currentStep}
        />

        {/* Bottom Metrics Scoreboard & Train Impact Breakdown */}
        <Scoreboard
          mode={mode}
          setMode={setMode}
          currentStep={currentStep}
        />

      </main>

      {/* Train Telemetry Inspector Drawer */}
      <TrainInspector
        train={selectedTrain}
        onClose={() => setSelectedTrainId(null)}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>RailGuard AI Platform • 100km Ambala-Kurukshetra-Panipat Sector</span>
        </div>
        <div>
          <span>Deterministic Algorithmic Safety Engine & Decision Support</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
