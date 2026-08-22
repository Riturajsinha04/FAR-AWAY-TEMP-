import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrainTrack, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Radio,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { STATIONS, SECTOR_CONSTRAINTS, TrainState, SimulationStep } from '../data/simulationState';
import { 
  SVG_WIDTH, 
  SVG_HEIGHT, 
  TRACK_PATHS, 
  kmToX, 
  getTrainTrackPoint,
  Y_UP_MAIN,
  Y_DOWN_MAIN,
  Y_LOOP_2
} from '../utils/trackGeometry';

interface SchematicTrackMapProps {
  mode: 'legacy' | 'ai';
  trains: TrainState[];
  selectedTrainId: string | null;
  onSelectTrain: (trainId: string) => void;
  stepNumber: number;
  currentStep?: SimulationStep;
}

export const SchematicTrackMap: React.FC<SchematicTrackMapProps> = ({
  mode,
  trains,
  selectedTrainId,
  onSelectTrain,
  stepNumber,
  currentStep
}) => {
  const [hoveredTrainId, setHoveredTrainId] = useState<string | null>(null);

  // Dynamic Signal States based on Step and Mode
  // Kurukshetra Outer Signal (km 44, UP Main)
  const krlOuterSignal = 
    stepNumber === 1 ? 'GREEN' :
    stepNumber === 2 ? 'YELLOW' :
    stepNumber === 3 
      ? (mode === 'legacy' ? 'RED' : 'DOUBLE_YELLOW') 
      : (stepNumber === 4 ? (mode === 'legacy' ? 'RED' : 'GREEN') : 'GREEN');

  // Kurukshetra Main Line Home Signal (km 50, UP Main)
  const krlMainHomeSignal = 
    stepNumber === 1 || stepNumber === 2 ? 'GREEN' :
    stepNumber === 3 ? (mode === 'legacy' ? 'RED' : 'GREEN') :
    stepNumber === 4 ? (mode === 'legacy' ? 'YELLOW' : 'GREEN') : 'GREEN';

  // Kurukshetra Loop 2 Signal (km 54, Loop 2)
  const krlLoopSignal = 
    mode === 'ai' && (stepNumber === 3 || stepNumber === 4) ? 'YELLOW' : 'RED';

  // Down Main Signal (km 60, DOWN Main)
  const downMainSignal = 
    mode === 'legacy' && (stepNumber === 3 || stepNumber === 4) ? 'RED' : 'GREEN';

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 lg:p-6 shadow-2xl relative overflow-hidden flex flex-col">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Map Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-cyan-400 shadow-inner">
            <TrainTrack className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Live Railway Network Simulation
              </h2>
              <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                mode === 'ai' 
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-sm shadow-emerald-950/50' 
                  : 'bg-rose-950/90 text-rose-300 border-rose-600 shadow-sm shadow-rose-950/50'
              }`}>
                {mode === 'ai' ? '● AI Dynamic Route Switching' : '● Legacy Fixed Signals'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              100km Ambala-Kurukshetra-Panipat Sector • Top-Down Live Movement Simulation
            </p>
          </div>
        </div>

        {/* Legend / Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
            <span className="text-slate-300 font-medium">UP Main Track</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400"></span>
            <span className="text-slate-300 font-medium">DOWN Main Track</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
            <span className="text-slate-300 font-medium">Loop 2 Bypass Branch</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-amber-300 font-mono text-[11px]">TSR 30 km/h</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative z-10 w-full aspect-[2.6/1] min-h-[360px] max-h-[460px] bg-slate-950/90 rounded-xl border border-slate-800/80 p-2 shadow-inner overflow-hidden select-none">
        
        <svg 
          viewBox="-140 -35 1480 510" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft Glow Filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Headlight beam gradient */}
            <linearGradient id="headlight-beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="60%" stopColor="rgba(224, 242, 254, 0.15)" />
              <stop offset="100%" stopColor="rgba(224, 242, 254, 0)" />
            </linearGradient>

            {/* Down train headlight beam (pointing left) */}
            <linearGradient id="headlight-beam-left" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="60%" stopColor="rgba(224, 242, 254, 0.15)" />
              <stop offset="100%" stopColor="rgba(224, 242, 254, 0)" />
            </linearGradient>

            {/* Platform Hatch Pattern */}
            <pattern id="platform-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* 1. SECTOR ENVIRONMENT & RECTANGULAR REGIONS */}
          
          {/* Temporary Speed Restriction (TSR) Zone: Km 52 to 58 */}
          <rect
            x={kmToX(52)}
            y={50}
            width={kmToX(58) - kmToX(52)}
            height={330}
            fill="rgba(245, 158, 11, 0.04)"
            stroke="rgba(245, 158, 11, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            rx="8"
          />
          <g transform={`translate(${kmToX(52) + 6}, 66)`}>
            <rect x="0" y="0" width="70" height="16" rx="4" fill="rgba(120, 53, 15, 0.85)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="1" />
            <text x="35" y="11" fill="#fde68a" fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
              TSR 30 km/h
            </text>
          </g>

          {/* 1:100 Gradient Warning Zone: Km 44 to 52 */}
          <rect
            x={kmToX(44)}
            y={180}
            width={kmToX(52) - kmToX(44)}
            height={70}
            fill="rgba(244, 63, 94, 0.03)"
            stroke="rgba(244, 63, 94, 0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
            rx="6"
          />
          <text x={kmToX(48)} y={205} fill="#fda4af" fontSize="8" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity="0.8">
            ▲ 1:100 Rising Gradient
          </text>

          {/* Active Conflict Highlight Region in Legacy Mode (Step 2 & 3) */}
          {mode === 'legacy' && (stepNumber === 2 || stepNumber === 3) && (
            <g>
              <rect
                x={kmToX(36)}
                y={Y_UP_MAIN - 22}
                width={kmToX(52) - kmToX(36)}
                height={44}
                fill="rgba(244, 63, 94, 0.15)"
                stroke="rgba(244, 63, 94, 0.8)"
                strokeWidth="2"
                strokeDasharray="6 4"
                rx="8"
                className="animate-pulse"
              />
              <text x={kmToX(44)} y={Y_UP_MAIN - 28} fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                ⚠️ HEADWAY CONFLICT DETECTED — SAME-BLOCK OVERLAP
              </text>
            </g>
          )}

          {/* Active AI Loop 2 Route Path Highlight in AI Mode (Step 3 & 4) */}
          {mode === 'ai' && (stepNumber === 3 || stepNumber === 4) && (
            <path
              d={TRACK_PATHS.krlLoop2}
              fill="none"
              stroke="rgba(16, 185, 129, 0.3)"
              strokeWidth="24"
              strokeLinecap="round"
              className="animate-pulse"
            />
          )}

          {/* 2. STATION PLATFORMS */}
          
          {/* Station 1: Ambala Cantt Platform (km 0) */}
          <g transform={`translate(${kmToX(0) - 25}, 185)`}>
            <rect x="0" y="0" width="80" height="18" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <rect x="0" y="0" width="80" height="18" rx="3" fill="url(#platform-hatch)" />
            <line x1="0" y1="17" x2="80" y2="17" stroke="#eab308" strokeWidth="1.5" />
            <text x="40" y="12" fill="#cbd5e1" fontSize="8" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif" textAnchor="middle">
              AMB PF 1 & 2
            </text>
          </g>

          {/* Station 2: Kurukshetra Jn Platforms (km 52) */}
          {/* Kurukshetra Loop 2 Platform */}
          <g transform={`translate(${kmToX(48)}, ${Y_LOOP_2 - 24})`}>
            <rect x="0" y="0" width="90" height="16" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <rect x="0" y="0" width="90" height="16" rx="3" fill="url(#platform-hatch)" />
            <line x1="0" y1="15" x2="90" y2="15" stroke="#eab308" strokeWidth="1.5" />
            <text x="45" y="11" fill="#6ee7b7" fontSize="7.5" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif" textAnchor="middle">
              KRL LOOP 2 (Bypass)
            </text>
          </g>
          {/* Kurukshetra Main Island Platform */}
          <g transform={`translate(${kmToX(48)}, 245)`}>
            <rect x="0" y="0" width="100" height="24" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <rect x="0" y="0" width="100" height="24" rx="4" fill="url(#platform-hatch)" />
            <line x1="0" y1="2" x2="100" y2="2" stroke="#eab308" strokeWidth="1.5" />
            <line x1="0" y1="22" x2="100" y2="22" stroke="#eab308" strokeWidth="1.5" />
            <text x="50" y="15" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif" textAnchor="middle">
              KURUKSHETRA JN (PF 1/2)
            </text>
          </g>

          {/* Station 3: Panipat Jn Platform (km 100) */}
          <g transform={`translate(${kmToX(94)}, 245)`}>
            <rect x="0" y="0" width="80" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <rect x="0" y="0" width="80" height="20" rx="3" fill="url(#platform-hatch)" />
            <line x1="0" y1="2" x2="80" y2="2" stroke="#eab308" strokeWidth="1.5" />
            <text x="40" y="13" fill="#cbd5e1" fontSize="8" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif" textAnchor="middle">
              PNP PF 1 & 2
            </text>
          </g>

          {/* 3. RAILWAY TRACKS (Layered: Ballast Bed -> Ties/Sleepers -> Steel Rails) */}
          
          {/* Helper function to draw a complete realistic track layer */}
          {[
            { path: TRACK_PATHS.ambSiding, key: 'ambSiding', isLoop: true },
            { path: TRACK_PATHS.pnpSiding, key: 'pnpSiding', isLoop: true },
            { path: TRACK_PATHS.ambCrossover1, key: 'ambCrossover1', isCrossover: true },
            { path: TRACK_PATHS.ambCrossover2, key: 'ambCrossover2', isCrossover: true },
            { path: TRACK_PATHS.krlCrossover1, key: 'krlCrossover1', isCrossover: true },
            { path: TRACK_PATHS.krlCrossover2, key: 'krlCrossover2', isCrossover: true },
            { path: TRACK_PATHS.pnpCrossover1, key: 'pnpCrossover1', isCrossover: true },
            { path: TRACK_PATHS.pnpCrossover2, key: 'pnpCrossover2', isCrossover: true },
            { path: TRACK_PATHS.krlLoop1, key: 'krlLoop1', isLoop: true },
            { path: TRACK_PATHS.krlLoop2, key: 'krlLoop2', isLoop: true, activeAI: mode === 'ai' },
            { path: TRACK_PATHS.downMain, key: 'downMain' },
            { path: TRACK_PATHS.upMain, key: 'upMain' }
          ].map(({ path, key, isLoop, activeAI, isCrossover }) => (
            <g key={key}>
              {/* Layer 1: Ballast Bed (Dark gravel foundation) */}
              <path
                d={path}
                fill="none"
                stroke="#0f172a"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={path}
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />

              {/* Layer 2: Repeated Wooden & Concrete Sleepers (Cross Ties) */}
              <path
                d={path}
                fill="none"
                stroke="#475569"
                strokeWidth="13"
                strokeLinecap="butt"
                strokeDasharray="3.5 7.5"
                opacity="0.9"
              />

              {/* Layer 3: Inner Bed between rails */}
              <path
                d={path}
                fill="none"
                stroke="#090d16"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Layer 4: Parallel Steel Rails (Dual Rails) */}
              {/* Outer Rail Stroke (creates two parallel rails with inner cut) */}
              <path
                d={path}
                fill="none"
                stroke={activeAI ? '#34d399' : '#94a3b8'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={activeAI ? 0.95 : 0.85}
              />
              <path
                d={path}
                fill="none"
                stroke="#0b1120"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Steel Head Highlight */}
              <path
                d={path}
                fill="none"
                stroke={activeAI ? '#a7f3d0' : '#e2e8f0'}
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>
          ))}

          {/* 4. SWITCH TURNOUTS & BLADE INDICATORS */}
          {/* Kurukshetra Turnout Switch at km 42 (x ~ 516px) */}
          <g transform={`translate(${kmToX(42)}, ${Y_UP_MAIN})`}>
            {/* Switch Machine Box */}
            <rect x="-8" y="12" width="16" height="12" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <circle
              cx="0"
              cy="18"
              r="3"
              fill={mode === 'ai' && (stepNumber === 3 || stepNumber === 4) ? '#10b981' : '#f59e0b'}
              className={mode === 'ai' ? 'animate-ping opacity-75' : ''}
            />
            <circle
              cx="0"
              cy="18"
              r="2.5"
              fill={mode === 'ai' && (stepNumber === 3 || stepNumber === 4) ? '#10b981' : '#f59e0b'}
            />
            {/* Switch Label */}
            <text x="0" y="32" fill="#94a3b8" fontSize="6.5" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
              SW-KRL1 {mode === 'ai' && (stepNumber === 3 || stepNumber === 4) ? '(REV: LOOP 2)' : '(NORM: MAIN)'}
            </text>
          </g>

          {/* 5. MULTI-ASPECT RAILWAY SIGNALS */}
          
          {/* Signal 1: Ambala Starter (km 12) */}
          <g transform={`translate(${kmToX(12)}, ${Y_UP_MAIN - 28})`}>
            {/* Mast */}
            <line x1="0" y1="0" x2="0" y2="28" stroke="#64748b" strokeWidth="2" />
            {/* Signal Head */}
            <rect x="-5" y="-2" width="10" height="20" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
            {/* LED Lamp: Green */}
            <circle cx="0" cy="4" r="2.5" fill="#22c55e" filter="url(#glow-emerald)" />
            <circle cx="0" cy="12" r="2.5" fill="#1e293b" />
            <text x="8" y="8" fill="#64748b" fontSize="6" fontFamily="JetBrains Mono, monospace">S-AMB</text>
          </g>

          {/* Signal 2: Kurukshetra Outer Distant Signal (km 44) */}
          <g transform={`translate(${kmToX(44)}, ${Y_UP_MAIN - 32})`}>
            <line x1="0" y1="0" x2="0" y2="32" stroke="#64748b" strokeWidth="2" />
            <rect x="-6" y="-4" width="12" height="26" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
            {/* 3 Aspect Lamps */}
            {/* Red */}
            <circle cx="0" cy="1" r="2.5" fill={krlOuterSignal === 'RED' ? '#ef4444' : '#1e293b'} filter={krlOuterSignal === 'RED' ? 'url(#glow-red)' : ''} />
            {/* Yellow */}
            <circle cx="0" cy="8" r="2.5" fill={krlOuterSignal === 'YELLOW' || krlOuterSignal === 'DOUBLE_YELLOW' ? '#eab308' : '#1e293b'} />
            {/* Green / Double Yellow */}
            <circle cx="0" cy="15" r="2.5" fill={krlOuterSignal === 'GREEN' || krlOuterSignal === 'DOUBLE_YELLOW' ? (krlOuterSignal === 'DOUBLE_YELLOW' ? '#eab308' : '#22c55e') : '#1e293b'} filter={krlOuterSignal === 'GREEN' ? 'url(#glow-emerald)' : ''} />
            <text x="9" y="8" fill={krlOuterSignal === 'RED' ? '#f87171' : '#94a3b8'} fontSize="6.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
              {krlOuterSignal}
            </text>
          </g>

          {/* Signal 3: Kurukshetra Loop 2 Starter Signal (km 54) */}
          <g transform={`translate(${kmToX(54)}, ${Y_LOOP_2 - 28})`}>
            <line x1="0" y1="0" x2="0" y2="28" stroke="#64748b" strokeWidth="2" />
            <rect x="-5" y="-2" width="10" height="20" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
            <circle cx="0" cy="4" r="2.5" fill={krlLoopSignal === 'YELLOW' ? '#eab308' : '#1e293b'} />
            <circle cx="0" cy="12" r="2.5" fill={krlLoopSignal === 'RED' ? '#ef4444' : '#1e293b'} />
            <text x="8" y="8" fill="#64748b" fontSize="6" fontFamily="JetBrains Mono, monospace">S-KRL-L2</text>
          </g>

          {/* Signal 4: Kurukshetra UP Main Home Signal (km 50) */}
          <g transform={`translate(${kmToX(50)}, ${Y_UP_MAIN - 28})`}>
            <line x1="0" y1="0" x2="0" y2="28" stroke="#64748b" strokeWidth="2" />
            <rect x="-5" y="-2" width="10" height="20" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
            <circle cx="0" cy="4" r="2.5" fill={krlMainHomeSignal === 'GREEN' ? '#22c55e' : '#1e293b'} filter={krlMainHomeSignal === 'GREEN' ? 'url(#glow-emerald)' : ''} />
            <circle cx="0" cy="12" r="2.5" fill={krlMainHomeSignal === 'RED' ? '#ef4444' : '#1e293b'} />
            <text x="8" y="8" fill="#64748b" fontSize="6" fontFamily="JetBrains Mono, monospace">S-KRL-UP1</text>
          </g>

          {/* Signal 5: DOWN Main Block Signal (km 60) */}
          <g transform={`translate(${kmToX(60)}, ${Y_DOWN_MAIN + 12})`}>
            <line x1="0" y1="-12" x2="0" y2="16" stroke="#64748b" strokeWidth="2" />
            <rect x="-5" y="0" width="10" height="20" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
            <circle cx="0" cy="6" r="2.5" fill={downMainSignal === 'GREEN' ? '#22c55e' : '#1e293b'} filter={downMainSignal === 'GREEN' ? 'url(#glow-emerald)' : ''} />
            <circle cx="0" cy="14" r="2.5" fill={downMainSignal === 'RED' ? '#ef4444' : '#1e293b'} />
            <text x="8" y="12" fill="#64748b" fontSize="6" fontFamily="JetBrains Mono, monospace">S-DN-KRL</text>
          </g>

          {/* 6. KILOMETER MARKER POSTS & LABELS */}
          {[0, 25, 52, 75, 100].map((km) => (
            <g key={km} transform={`translate(${kmToX(km)}, 415)`}>
              <line x1="0" y1="-8" x2="0" y2="0" stroke="#475569" strokeWidth="1" />
              <rect x="-14" y="-2" width="28" height="14" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <text x="0" y="8" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                {km} km
              </text>
            </g>
          ))}

          {/* 7. REALISTIC DETAILED VECTOR TRAINS (MOVING ALONG TRACK PATHS) */}
          {trains.map((train) => {
            const pt = getTrainTrackPoint(train.positionKm, train.track, train.direction);
            const isSelected = selectedTrainId === train.id;
            const isHovered = hoveredTrainId === train.id;
            const isHighSpeed = train.type === 'high-speed';
            const isFreight = train.type === 'local' || train.type === 'freight';
            const isUp = train.direction === 'UP';

            // Theme colors for trains
            const livery = 
              train.id === '12012' ? { body: '#0284c7', nose: '#38bdf8', stripe: '#f8fafc', glow: 'glow-cyan' } : // Shatabdi Cyan
              train.id === '12926' ? { body: '#991b1b', nose: '#f59e0b', stripe: '#fef08a', glow: 'glow-amber' } : // Paschim Maroon
              train.id === '14034' ? { body: '#1e40af', nose: '#60a5fa', stripe: '#f8fafc', glow: 'glow-cyan' } : // Jammu Mail Blue
              train.id === '64532' ? { body: '#065f46', nose: '#10b981', stripe: '#fbbf24', glow: 'glow-emerald' } : // MEMU Emerald
              { body: '#581c87', nose: '#a855f7', stripe: '#f8fafc', glow: 'glow-cyan' }; // Shri Shakti Superfast

            return (
              <motion.g
                key={train.id}
                onClick={() => onSelectTrain(train.id)}
                onMouseEnter={() => setHoveredTrainId(train.id)}
                onMouseLeave={() => setHoveredTrainId(null)}
                className="cursor-pointer"
                initial={false}
                animate={{
                  x: pt.x,
                  y: pt.y
                }}
                transition={{
                  type: 'spring',
                  stiffness: 45,
                  damping: 15,
                  mass: 1.2
                }}
                style={{ transformOrigin: '0px 0px' }}
              >
                {/* ROTATING TRAIN BODY (Pivots around exact center 0,0 on the rails) */}
                <motion.g
                  animate={{ rotate: pt.angleDeg }}
                  transition={{
                    type: 'spring',
                    stiffness: 45,
                    damping: 15
                  }}
                  style={{ transformOrigin: '0px 0px' }}
                >
                  {/* HEADLIGHT CONICAL BEAM ILLUMINATION ON TRACKS */}
                  {train.status !== 'HALTED' && (
                    <polygon
                      points="19,-3 75,-14 75,14 19,3"
                      fill="url(#headlight-beam)"
                      opacity="0.75"
                      pointerEvents="none"
                    />
                  )}

                  {/* HALT / BRAKE WARNING HALO AROUND TRAIN WHEN HALTED */}
                  {train.status === 'HALTED' && (
                    <circle
                      cx="0"
                      cy="0"
                      r="24"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                  )}

                  {/* SELECTION RING */}
                  {isSelected && (
                    <rect
                      x="-32"
                      y="-15"
                      width="64"
                      height="30"
                      rx="6"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      filter="url(#glow-cyan)"
                    />
                  )}

                  {/* TRAIN CONSIST GRAPHIC */}
                  {/* 1. Trailing Coach 2 */}
                  <rect
                    x="-28"
                    y="-5.5"
                    width="11"
                    height="11"
                    rx="1.5"
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth="0.8"
                  />
                  <rect x="-26" y="-3.5" width="7" height="2" fill="#64748b" />
                  <rect x="-26" y="1.5" width="7" height="2" fill="#64748b" />
                  
                  {/* Gangway Coupler */}
                  <line x1="-17" y1="0" x2="-14" y2="0" stroke="#64748b" strokeWidth="2.5" />

                  {/* 2. Trailing Coach 1 */}
                  <rect
                    x="-14"
                    y="-6"
                    width="13"
                    height="12"
                    rx="2"
                    fill={livery.body}
                    stroke="#0f172a"
                    strokeWidth="1"
                  />
                  {/* Windows on Coach */}
                  <rect x="-12" y="-4" width="9" height="2" fill="#38bdf8" opacity="0.8" />
                  <rect x="-12" y="2" width="9" height="2" fill="#38bdf8" opacity="0.8" />

                  {/* Gangway Coupler */}
                  <line x1="-1" y1="0" x2="2" y2="0" stroke="#64748b" strokeWidth="2.5" />

                  {/* 3. Lead Locomotive / Power Car */}
                  <path
                    d="M 2,-6.5 L 14,-6.5 C 19,-6.5 22,-3 22,0 C 22,3 19,6.5 14,6.5 L 2,6.5 Z"
                    fill={livery.body}
                    stroke="#0f172a"
                    strokeWidth="1.2"
                  />
                  {/* Nose Cone / Cab */}
                  <path
                    d="M 12,-5.5 L 15,-5.5 C 19,-5.5 21,-2 21,0 C 21,2 19,5.5 15,5.5 L 12,5.5 Z"
                    fill={livery.nose}
                  />
                  {/* Windshield Glass */}
                  <path
                    d="M 11,-4 L 14,-4 C 16,-4 17,-1.5 17,0 C 17,1.5 16,4 14,4 L 11,4 Z"
                    fill="#0369a1"
                  />
                  {/* Livery Center Stripe */}
                  <line x1="2" y1="0" x2="16" y2="0" stroke={livery.stripe} strokeWidth="1.2" />

                  {/* Roof Pantograph / Radiator Vents */}
                  <rect x="5" y="-2" width="5" height="4" rx="1" fill="#475569" />
                  <line x1="6" y1="-2" x2="9" y2="-4" stroke="#94a3b8" strokeWidth="0.8" />
                  <line x1="9" y1="-4" x2="8" y2="-2" stroke="#94a3b8" strokeWidth="0.8" />

                  {/* Front Headlight LEDs (Dual White) */}
                  <circle cx="19" cy="-2.5" r="1" fill="#ffffff" />
                  <circle cx="19" cy="2.5" r="1" fill="#ffffff" />

                  {/* Rear Tail Marker LEDs (Dual Red) */}
                  <circle cx="-27.5" cy="-3.5" r="0.8" fill="#ef4444" />
                  <circle cx="-27.5" cy="3.5" r="0.8" fill="#ef4444" />
                </motion.g>

                {/* MINI FLOATING GLASSMORPHIC LABEL (Stays upright, clean positioning) */}
                <g 
                  transform={`translate(0, ${isUp ? -24 : 26})`}
                  className="pointer-events-none"
                >
                  <rect
                    x="-42"
                    y="-9"
                    width="84"
                    height="18"
                    rx="4"
                    fill="rgba(15, 23, 42, 0.94)"
                    stroke={
                      train.status === 'HALTED' ? '#ef4444' :
                      train.status === 'DIVERTED' ? '#10b981' :
                      train.status === 'DELAYED' ? '#f59e0b' : '#334155'
                    }
                    strokeWidth="1"
                  />
                  <text x="0" y="3.5" fill="#f8fafc" fontSize="7.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                    {train.id} • {train.speedKmh}k {train.track === 'LOOP_2' ? 'L2' : ''}
                  </text>
                  {train.delayMinutes > 0 && (
                    <circle cx="36" cy="0" r="2.5" fill="#f59e0b" />
                  )}
                </g>
              </motion.g>
            );
          })}

        </svg>

        {/* 8. DYNAMIC FLOATING CONTEXT POPUPS (REACT OVERLAY) */}
        <AnimatePresence>
          {trains.filter(t => t.tooltip).map((train) => {
            const pt = getTrainTrackPoint(train.positionKm, train.track, train.direction);
            // Convert SVG coords to % of container
            const leftPct = (pt.x / SVG_WIDTH) * 100;
            const topPct = (pt.y / SVG_HEIGHT) * 100;

            return (
              <motion.div
                key={`tooltip-${train.id}-${stepNumber}`}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25 }}
                className={`absolute z-40 p-2.5 rounded-xl text-left shadow-2xl border pointer-events-none max-w-[210px] sm:max-w-[240px] transform -translate-x-1/2 ${
                  train.tooltip?.type === 'danger'
                    ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-950/90 glow-rose'
                    : train.tooltip?.type === 'success'
                    ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-emerald-950/90 glow-emerald'
                    : 'bg-amber-950/95 border-amber-400 text-amber-100 shadow-amber-950/90 glow-amber'
                }`}
                style={{
                  left: `${leftPct}%`,
                  top: `${Math.max(12, topPct - 24)}%`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {train.tooltip?.type === 'danger' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : train.tooltip?.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="text-[10px] font-extrabold tracking-wide uppercase truncate">
                    {train.tooltip?.title}
                  </span>
                </div>
                <p className="text-[9.5px] leading-tight opacity-90 font-medium">
                  {train.tooltip?.message}
                </p>
                {/* Arrow Pointer */}
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-px w-2 h-2 rotate-45 border-r border-b ${
                  train.tooltip?.type === 'danger'
                    ? 'bg-rose-950 border-rose-500'
                    : train.tooltip?.type === 'success'
                    ? 'bg-emerald-950 border-emerald-400'
                    : 'bg-amber-950 border-amber-400'
                }`} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* 9. DRIVER PORTAL REAL-TIME ADVISORY OVERLAY (LLM HIT) */}
        {mode === 'ai' && currentStep?.driver_portal_messages && currentStep.driver_portal_messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-emerald-500/70 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 glow-emerald"
          >
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wide text-emerald-300">
                    DRIVER PORTAL AI ADVISORY
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700">
                    LLM HIT (Min {currentStep.minute})
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Real-time direct instructions emitted to cab telemetry displays
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full md:w-auto">
              {currentStep.driver_portal_messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className="text-[11px] font-mono bg-emerald-950/80 text-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-800/80 flex items-start gap-2 shadow-sm"
                >
                  <span className="font-extrabold text-emerald-400 shrink-0">[{msg.train}]:</span>
                  <span className="leading-snug">{msg.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* Track Footnote & Instructions */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[11px]">
            Realistic dual-rail track simulation with dynamic curve routing. Click any train consist to inspect telemetry.
          </span>
        </div>
        <div className="font-mono text-[10px] text-slate-500 flex items-center gap-2">
          <span>Signal Interlocking: Electronic (EI)</span>
          <span>•</span>
          <span>Block Rule: Absolute / Auto</span>
        </div>
      </div>
    </div>
  );
};
