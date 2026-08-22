import React from 'react';
import { 
  Train, 
  Gauge, 
  Activity, 
  MapPin, 
  Zap, 
  Flame, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  X,
  Compass
} from 'lucide-react';
import { TrainState } from '../data/simulationState';

interface TrainInspectorProps {
  train: TrainState | null;
  onClose: () => void;
}

export const TrainInspector: React.FC<TrainInspectorProps> = ({ train, onClose }) => {
  if (!train) return null;

  const isHighSpeed = train.type === 'high-speed';
  const isFreight = train.type === 'local' || train.type === 'freight';

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 p-6 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isHighSpeed 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                : isFreight 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
            }`}>
              {isHighSpeed ? <Zap className="w-5 h-5" /> : isFreight ? <Layers className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Train {train.id}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Priority {train.priority}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold">{train.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Telemetry Grid */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Current Speed
              </span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {train.speedKmh} <span className="text-xs text-slate-400">km/h</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Position
              </span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {train.positionKm} <span className="text-xs text-slate-400">km</span>
              </div>
            </div>
          </div>

          {/* Track & Block Occupation */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Direction & Track:</span>
              <span className="font-mono font-bold text-cyan-300 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                {train.direction} • {train.track}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Block ID:</span>
              <span className="font-mono font-bold text-slate-200">{train.blockId}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Delay:</span>
              <span className={`font-mono font-bold ${train.delayMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {train.delayMinutes > 0 ? `+${train.delayMinutes} min` : 'ON TIME'}
              </span>
            </div>
          </div>

          {/* Safety Status */}
          <div className={`p-3.5 rounded-xl border ${
            train.status === 'HALTED' 
              ? 'bg-rose-950/40 border-rose-700/80 text-rose-200' 
              : train.status === 'DIVERTED'
              ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold mb-1">
              {train.status === 'HALTED' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span>Status: {train.status}</span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {train.status === 'HALTED'
                ? 'Signal aspect is RED. Train detained at block outer boundary on 1:100 rising gradient.'
                : train.status === 'DIVERTED'
                ? 'Routed through Kurukshetra Loop 2 bypass at controlled speed to prevent main-line gridlock.'
                : 'Operating under automatic block signalling with active movement authority.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>Sector: AMB-100</span>
        <span>Interlocking: Electronic</span>
      </div>
    </div>
  );
};
