import React from 'react';
import type { DailyShift } from '../../shared/types';
import { soundManager } from '../utils/audio';

type HeaderBarProps = {
  shift: DailyShift;
  currentIndex: number;
  totalCards: number;
  timeLeft: number;
  combo: number;
  strikes: number;
  maxStrikes: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleRules: () => void;
  isRulesOpen: boolean;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  shift,
  currentIndex,
  totalCards,
  timeLeft,
  combo,
  strikes,
  maxStrikes,
  isMuted,
  onToggleMute,
  onToggleRules,
  isRulesOpen,
}) => {
  const isTimeCritical = timeLeft <= 10;

  return (
    <header className="w-full max-w-lg mx-auto bg-zinc-900/90 backdrop-blur border-b border-zinc-800 px-4 py-2.5 flex flex-col gap-2 rounded-t-xl select-none">
      {/* Top row: Subreddit name, rules toggle, mute */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="mascot">
            {shift.mascot}
          </span>
          <div>
            <h1 className="font-bold text-sm text-zinc-100 flex items-center gap-1.5 leading-none">
              {shift.subreddit}
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                SHIFT
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">{shift.subscribers}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Rules Toggle Button */}
          <button
            onClick={() => {
              soundManager.playTick();
              onToggleRules();
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              isRulesOpen
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            title="Inspect AutoMod Rules"
          >
            <span>📋</span>
            <span>Rules</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm cursor-pointer transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Stats bar: Progress, Timer, Combo, Strikes */}
      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-zinc-800/60 text-center">
        {/* Progress */}
        <div className="bg-zinc-950/60 rounded px-1.5 py-1 border border-zinc-800/40">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Queue</span>
          <span className="text-xs font-bold font-mono text-zinc-200">
            {currentIndex + 1} / {totalCards}
          </span>
        </div>

        {/* Timer */}
        <div className={`rounded px-1.5 py-1 border transition-colors ${
          isTimeCritical
            ? 'bg-red-950/60 border-red-800/80 animate-pulse'
            : 'bg-zinc-950/60 border-zinc-800/40'
        }`}>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Timer</span>
          <span className={`text-xs font-bold font-mono ${
            isTimeCritical ? 'text-red-400' : 'text-zinc-200'
          }`}>
            {timeLeft}s
          </span>
        </div>

        {/* Combo */}
        <div className="bg-zinc-950/60 rounded px-1.5 py-1 border border-zinc-800/40">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Combo</span>
          <span className={`text-xs font-bold font-mono ${
            combo > 2 ? 'text-amber-400' : combo > 0 ? 'text-emerald-400' : 'text-zinc-400'
          }`}>
            {combo > 0 ? `${combo}x 🔥` : '1x'}
          </span>
        </div>

        {/* Strikes / Revolt meter */}
        <div className="bg-zinc-950/60 rounded px-1.5 py-1 border border-zinc-800/40">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Revolt</span>
          <span className="text-xs font-mono font-bold">
            {Array.from({ length: maxStrikes }).map((_, i) => (
              <span key={i} className={i < strikes ? 'text-red-500' : 'text-zinc-600'}>
                {i < strikes ? '❌' : '⚪'}
              </span>
            ))}
          </span>
        </div>
      </div>
    </header>
  );
};
