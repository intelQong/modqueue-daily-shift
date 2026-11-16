import './index.css';

import React, { StrictMode, useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { DailyShift, ShiftResult, DecisionRecord, Verdict, InitResponse } from '../shared/types';
import {
  getDailyShiftForDate,
  getTodayUtcDate,
  calculateModRank,
  generateShareMarkdown,
  getRandomPracticeShift,
  shuffleShiftCards,
} from '../shared/dailyData';
import { HeaderBar } from './components/HeaderBar';
import { RulesDrawer } from './components/RulesDrawer';
import { PostCardView } from './components/PostCardView';
import { ControlsBar } from './components/ControlsBar';
import { ResultsModal } from './components/ResultsModal';
import { soundManager } from './utils/audio';

type GameState = 'briefing' | 'playing' | 'results';

export const GameApp: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('briefing');
  const [shift, setShift] = useState<DailyShift>(() => getDailyShiftForDate(getTodayUtcDate()));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [finalResult, setFinalResult] = useState<ShiftResult | null>(null);
  const [userStreak, setUserStreak] = useState(1);

  // Drag state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [forcedStamp, setForcedStamp] = useState<Verdict | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const cardStartTimeRef = useRef<number>(0);

  // Fetch initial streak and user info from server endpoint
  useEffect(() => {
    fetch('/api/init')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: InitResponse | null) => {
        if (data) {
          if (data.todayShift) setShift(data.todayShift);
          if (typeof data.streak === 'number') setUserStreak(data.streak);
        }
      })
      .catch(() => {
        // Fallback to local daily seed if running standalone
      });
  }, []);

  // Finish shift and calculate results
  const finishShift = useCallback(
    (records: DecisionRecord[], currentStreak: number) => {
      soundManager.playVictory();
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const correctCount = records.filter((r) => r.correct).length;
      const totalCount = records.length;
      const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
      const rankTitle = calculateModRank(accuracy, correctCount);
      const newStreak = accuracy >= 60 ? currentStreak + 1 : 1;

      const result: ShiftResult = {
        date: shift.date,
        subreddit: shift.subreddit,
        score: correctCount * 100 + Math.max(0, (60 - elapsedSeconds) * 10),
        correctCount,
        totalCount,
        accuracy,
        timeSeconds: elapsedSeconds,
        maxCombo: Math.max(combo, maxCombo),
        rankTitle,
        streak: newStreak,
        decisions: records,
        shareMarkdown: '',
      };

      result.shareMarkdown = generateShareMarkdown(result);
      setFinalResult(result);
      setUserStreak(newStreak);
      setGameState('results');

      // Submit to backend Redis
      fetch('/api/submit-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: shift.date,
          score: result.score,
          correctCount: result.correctCount,
          totalCount: result.totalCount,
          timeSeconds: result.timeSeconds,
          maxCombo: result.maxCombo,
          decisions: records,
        }),
      }).catch(() => {});
    },
    [combo, maxCombo, shift.date, shift.subreddit]
  );

  // Countdown timer during 'playing' state
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishShift(decisions, userStreak);
          return 0;
        }
        if (prev <= 10) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, decisions, finishShift, userStreak]);

  // Handle player verdict action (Approve / Remove / Ban)
  const handleAction = useCallback(
    (action: Verdict) => {
      if (gameState !== 'playing' || currentIndex >= shift.cards.length) return;

      const currentCard = shift.cards[currentIndex];
      if (!currentCard) return;
      const isCorrect = currentCard.expectedAction === action;
      const timeSpent = Date.now() - cardStartTimeRef.current;

      // Play audio feedback
      if (action === 'approve') soundManager.playApprove();
      else if (action === 'remove') soundManager.playRemove();
      else if (action === 'ban') soundManager.playBanHammer();

      if (isCorrect) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setMaxCombo((prev) => Math.max(prev, nextCombo));
        soundManager.playCombo(nextCombo);
      } else {
        setCombo(0);
        setStrikes((prev) => {
          const nextStrikes = prev + 1;
          soundManager.playStrike();
          return nextStrikes;
        });
      }

      const newRecord: DecisionRecord = {
        cardId: currentCard.id,
        userAction: action,
        expectedAction: currentCard.expectedAction,
        correct: isCorrect,
        timeSpentMs: timeSpent,
      };

      const updatedDecisions = [...decisions, newRecord];
      setDecisions(updatedDecisions);

      // Trigger exit animation
      setForcedStamp(action);
      const exitX = action === 'approve' ? 500 : action === 'remove' ? -500 : 0;
      const exitY = action === 'ban' ? -500 : 0;
      setDragOffset({ x: exitX, y: exitY });

      setTimeout(() => {
        setForcedStamp(null);
        setDragOffset({ x: 0, y: 0 });
        cardStartTimeRef.current = Date.now();

        if (currentIndex + 1 >= shift.cards.length) {
          finishShift(updatedDecisions, userStreak);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 180);
    },
    [gameState, currentIndex, shift.cards, combo, decisions, finishShift, userStreak]
  );

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleAction('approve');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleAction('remove');
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleAction('ban');
      } else if (e.key === ' ' || e.key === 'Tab') {
        e.preventDefault();
        setIsRulesOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAction]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;

    // Threshold check for committed swipe
    if (dragOffset.x > 85) {
      handleAction('approve');
    } else if (dragOffset.x < -85) {
      handleAction('remove');
    } else if (dragOffset.y < -75) {
      handleAction('ban');
    } else {
      // Snap back if threshold not met
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleShuffleQueue = () => {
    soundManager.playTick();
    setShift((prev) => shuffleShiftCards(prev));
  };

  const handlePracticeAnotherShift = () => {
    soundManager.playApprove();
    const nextShift = getRandomPracticeShift();
    setShift(nextShift);
    setCurrentIndex(0);
    setTimeLeft(60);
    setCombo(0);
    setMaxCombo(0);
    setStrikes(0);
    setDecisions([]);
    setFinalResult(null);
    setGameState('briefing');
  };

  const startPlaying = () => {
    soundManager.playApprove();
    // Re-shuffle cards to guarantee fresh dynamic randomization
    setShift((prev) => shuffleShiftCards(prev));
    startTimeRef.current = Date.now();
    cardStartTimeRef.current = Date.now();
    setCurrentIndex(0);
    setTimeLeft(60);
    setCombo(0);
    setMaxCombo(0);
    setStrikes(0);
    setDecisions([]);
    setFinalResult(null);
    setGameState('playing');
  };

  const currentCard = shift.cards[currentIndex];

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col justify-between items-center p-3 select-none overflow-x-hidden relative"
      style={{ backgroundColor: '#09090b' }}
    >
      {/* Ambient Top Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(234,88,12,0.18),rgba(9,9,11,0))] -z-10" />

      {/* 1. BRIEFING STATE */}
      {gameState === 'briefing' && (
        <div className="w-full max-w-md mx-auto my-auto bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200 backdrop-blur-md">
          {/* Glowing Mascot Pod */}
          <div className="relative mx-auto mb-4 w-20 h-20 rounded-3xl bg-gradient-to-b from-orange-500/25 via-zinc-900 to-zinc-950 border-2 border-orange-500/40 shadow-[0_0_35px_rgba(249,115,22,0.25)] flex items-center justify-center text-4xl">
            {shift.mascot}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-[10px] text-white">
              ●
            </span>
          </div>

          {/* Daily Shift Status Pill & Shuffle Controls */}
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/70 border border-orange-500/40 text-[11px] font-black uppercase tracking-wider text-orange-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping inline-block"></span>
              <span>{shift.date === 'Practice' ? 'Practice Mode' : 'Daily Mod Shift'}</span>
            </div>
            <button
              onClick={handlePracticeAnotherShift}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer transition-colors border border-zinc-700/50"
              title="Load another community to practice"
            >
              <span>🎲</span>
              <span>New Sub</span>
            </button>
            <button
              onClick={handleShuffleQueue}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer transition-colors border border-zinc-700/50"
              title="Randomize and shuffle posts in queue"
            >
              <span>🔀</span>
              <span>Shuffle</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2.5 tracking-tight">
            {shift.subreddit}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 italic max-w-xs mx-auto">
            &ldquo;{shift.tagline}&rdquo;
          </p>

          {/* AutoMod Security Protocol Card */}
          <div className="mt-5 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left shadow-inner">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80">
              <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋</span> Active AutoMod Directives:
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                ENFORCING
              </span>
            </div>

            <div className="space-y-2">
              {shift.rules.map((rule, idx) => {
                const badgeColors = [
                  'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  'bg-sky-500/20 text-sky-300 border-sky-500/40',
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                ][idx % 3];
                return (
                  <div key={rule.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeColors}`}>
                      R{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs text-zinc-200 font-medium leading-tight block">
                        {rule.description}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Ban Hammer Rule */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-200">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-purple-500/40 bg-purple-900/60 text-purple-300 shrink-0">
                  🔨 BAN
                </span>
                <span className="text-xs text-purple-200/90 font-medium leading-tight">
                  Accounts with negative karma or spam links!
                </span>
              </div>
            </div>

            {/* Tricky Cases Warning Tip */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center gap-1.5 text-[10px] text-amber-400/90 font-medium">
              <span>⚠️</span>
              <span>Watch out for tricky cases: 1-day cutoffs, sneak spam & close typos!</span>
            </div>
          </div>

          {/* Stats Pods */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center py-2 text-xs border-t border-zinc-800">
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="block font-black text-zinc-100 text-sm">15 Posts</span>
              <span className="text-[10px] text-zinc-400">Daily Queue</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="block font-black text-zinc-100 text-sm">60s</span>
              <span className="text-[10px] text-zinc-400">Shift Clock</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-orange-500/30 bg-orange-950/20">
              <span className="block font-black text-orange-400 text-sm">
                {userStreak} {userStreak === 1 ? 'Day' : 'Days'} 🔥
              </span>
              <span className="text-[10px] text-orange-300/80">Streak</span>
            </div>
          </div>

          {/* Glowing CTA Button */}
          <button
            onClick={startPlaying}
            className="w-full mt-5 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 hover:brightness-110 active:scale-95 text-white font-black text-base shadow-[0_0_24px_rgba(234,88,12,0.4)] cursor-pointer transition-all flex items-center justify-center gap-2 tracking-wide"
          >
            <span>PUNCH IN & START SHIFT</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* 2. PLAYING STATE */}
      {gameState === 'playing' && (
        <div className="w-full max-w-md mx-auto flex flex-col justify-between flex-1">
          {/* Header Bar */}
          <HeaderBar
            shift={shift}
            currentIndex={currentIndex}
            totalCards={shift.cards.length}
            timeLeft={timeLeft}
            combo={combo}
            strikes={strikes}
            maxStrikes={3}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(soundManager.toggleMute())}
            onToggleRules={() => setIsRulesOpen((prev) => !prev)}
            isRulesOpen={isRulesOpen}
          />

          {/* Active Rules Drawer */}
          <RulesDrawer
            rules={shift.rules}
            isOpen={isRulesOpen}
            onClose={() => setIsRulesOpen(false)}
          />

          {/* Card Arena */}
          <div className="my-auto relative flex items-center justify-center min-h-[420px] w-full">
            {currentCard && (
              <PostCardView
                card={currentCard}
                dragOffset={dragOffset}
                isDragging={isDragging}
                forcedStamp={forcedStamp}
                onPointerDown={handlePointerDown}
              />
            )}
          </div>

          {/* Bottom Action Controls */}
          <ControlsBar onAction={handleAction} disabled={!!forcedStamp} />
        </div>
      )}

      {/* 3. RESULTS STATE */}
      {gameState === 'results' && finalResult && (
        <div className="w-full max-w-md mx-auto my-auto">
          <ResultsModal
            result={finalResult}
            cards={shift.cards}
            onPlayAgain={handlePracticeAnotherShift}
          />
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameApp />
  </StrictMode>
);
