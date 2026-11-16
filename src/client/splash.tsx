import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DailyShift } from '../shared/types';
import { getDailyShiftForDate, getTodayUtcDate } from '../shared/dailyData';

export const Splash: React.FC = () => {
  const [shift, setShift] = useState<DailyShift>(() => getDailyShiftForDate(getTodayUtcDate()));
  const [streak, setStreak] = useState<number>(1);

  useEffect(() => {
    fetch('/api/init')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.todayShift) setShift(data.todayShift);
        if (typeof data?.streak === 'number') setStreak(data.streak);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="flex flex-col justify-between items-center min-h-[380px] w-full p-4 bg-zinc-950 text-zinc-100 select-none relative overflow-hidden"
      style={{ backgroundColor: '#09090b' }}
    >
      {/* Ambient Top Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(234,88,12,0.18),rgba(9,9,11,0))] -z-10" />

      {/* Top Banner */}
      <div className="w-full flex items-center justify-between text-xs border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-orange-500 uppercase text-[11px]">
          <span>🛡️</span>
          <span>ModQueue: Daily Shift</span>
        </div>
        <div className="flex items-center gap-1 bg-orange-950/50 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-orange-400 font-mono text-[11px] font-bold">
          <span>🔥</span>
          <span>{streak} {streak === 1 ? 'Day' : 'Days'}</span>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="my-auto text-center flex flex-col items-center">
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-b from-orange-500/25 via-zinc-900 to-zinc-950 border-2 border-orange-500/40 flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(249,115,22,0.25)] mb-3">
          {shift.mascot}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-[8px] text-white">
            ●
          </span>
        </div>

        <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-500/30">
          Today&apos;s Community
        </span>

        <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">
          {shift.subreddit}
        </h2>
        <p className="text-xs text-zinc-400 max-w-xs mt-1 italic">
          &ldquo;{shift.tagline}&rdquo;
        </p>

        {/* Mini stats */}
        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-300 font-mono bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-800">
          <span>📦 15 Posts</span>
          <span>•</span>
          <span>⏱️ 60s Shift</span>
          <span>•</span>
          <span>⚖️ 3 Rules</span>
        </div>
      </div>

      {/* Launch Button */}
      <div className="w-full max-w-xs mb-2">
        <button
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 hover:brightness-110 active:scale-95 text-white font-black text-sm tracking-wide shadow-[0_0_24px_rgba(234,88,12,0.4)] cursor-pointer transition-all flex items-center justify-center gap-2"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          <span>PUNCH IN & START SHIFT</span>
          <span>→</span>
        </button>
      </div>

      <footer className="text-[10px] text-zinc-500 text-center font-mono">
        Swipe Right to Approve • Swipe Left to Remove • Swipe Up to Ban
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
