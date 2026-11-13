import React from 'react';
import type { Verdict } from '../../shared/types';

type ControlsBarProps = {
  onAction: (action: Verdict) => void;
  disabled?: boolean;
};

export const ControlsBar: React.FC<ControlsBarProps> = ({ onAction, disabled = false }) => {
  return (
    <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-3 px-2 py-3 select-none">
      {/* 1. Remove Button (Left) */}
      <button
        disabled={disabled}
        onClick={() => onAction('remove')}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900 border-2 border-rose-600/70 hover:bg-rose-950/40 active:scale-95 transition-all cursor-pointer shadow-lg group disabled:opacity-50 disabled:pointer-events-none"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">✗</span>
        <span className="text-xs font-bold text-rose-400 mt-1 uppercase tracking-wider">
          Remove
        </span>
        <span className="text-[10px] text-zinc-400 font-mono mt-0.5 bg-zinc-800 px-1.5 py-0.2 rounded">
          [A] / ←
        </span>
      </button>

      {/* 2. Ban Hammer Button (Center) */}
      <button
        disabled={disabled}
        onClick={() => onAction('ban')}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900 border-2 border-purple-500/70 hover:bg-purple-950/40 active:scale-95 transition-all cursor-pointer shadow-lg group disabled:opacity-50 disabled:pointer-events-none"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">🔨</span>
        <span className="text-xs font-bold text-purple-300 mt-1 uppercase tracking-wider">
          Ban Bot
        </span>
        <span className="text-[10px] text-zinc-400 font-mono mt-0.5 bg-zinc-800 px-1.5 py-0.2 rounded">
          [W] / ↑
        </span>
      </button>

      {/* 3. Approve Button (Right) */}
      <button
        disabled={disabled}
        onClick={() => onAction('approve')}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900 border-2 border-emerald-500/70 hover:bg-emerald-950/40 active:scale-95 transition-all cursor-pointer shadow-lg group disabled:opacity-50 disabled:pointer-events-none"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">✓</span>
        <span className="text-xs font-bold text-emerald-400 mt-1 uppercase tracking-wider">
          Approve
        </span>
        <span className="text-[10px] text-zinc-400 font-mono mt-0.5 bg-zinc-800 px-1.5 py-0.2 rounded">
          [D] / →
        </span>
      </button>
    </div>
  );
};
