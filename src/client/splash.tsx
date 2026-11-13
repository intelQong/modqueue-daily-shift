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
    <div className="flex flex-col justify-between items-center min-h-[380px] w-full p-4 bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-100 select-none">
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between text-xs border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-orange-500 uppercase text-[11px]">
          <span>🛡️</span>
          <span>ModQueue: Daily Shift</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800/80 px-2.5 py-0.5 rounded-full text-zinc-300 font-mono text-[11px]">
          <span>🔥</span>
          <span>{streak} Day Streak</span>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="my-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-orange-950/40 mb-3 animate-pulse">
          {shift.mascot}
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
        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400 font-mono">
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
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-98 text-white font-black text-sm tracking-wide shadow-xl shadow-orange-900/40 cursor-pointer transition-all flex items-center justify-center gap-2"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          <span>PUNCH IN & START SHIFT</span>
          <span>→</span>
        </button>
      </div>

      <footer className="text-[10px] text-zinc-500 text-center">
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
