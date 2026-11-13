import './index.css';

import React, { StrictMode, useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { DailyShift, ShiftResult, DecisionRecord, Verdict, InitResponse } from '../shared/types';
import { getDailyShiftForDate, getTodayUtcDate, calculateModRank, generateShareMarkdown } from '../shared/dailyData';
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

  const startPlaying = () => {
    soundManager.playApprove();
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
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between items-center p-3 select-none"
    >
      {/* 1. BRIEFING STATE */}
      {gameState === 'briefing' && (
        <div className="w-full max-w-md mx-auto my-auto bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-3xl mx-auto mb-4">
            {shift.mascot}
          </div>

          <span className="text-[11px] font-bold tracking-widest text-orange-400 uppercase bg-orange-950/60 px-2.5 py-1 rounded-full border border-orange-500/30">
            Today&apos;s Mod Assignment
          </span>

          <h1 className="text-2xl font-black text-white mt-2">
            {shift.subreddit}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 italic">
            &ldquo;{shift.tagline}&rdquo;
          </p>

          <div className="mt-5 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left">
            <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>📋</span> Active AutoMod Directives:
            </h2>
            <div className="space-y-2">
              {shift.rules.map((rule, idx) => (
                <div key={rule.id} className="flex items-start gap-2 text-xs">
                  <span className="font-mono text-orange-400 font-bold">R{idx + 1}:</span>
                  <span className="text-zinc-300">{rule.description}</span>
                </div>
              ))}
              <div className="flex items-start gap-2 text-xs text-purple-300">
                <span className="font-mono text-purple-400 font-bold">🔨:</span>
                <span>Ban accounts with negative karma or spam!</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-around text-center py-2 text-xs text-zinc-400 border-t border-zinc-800">
            <div>
              <span className="block font-bold text-zinc-200 text-sm">15 Posts</span>
              <span>Daily Queue</span>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <span className="block font-bold text-zinc-200 text-sm">60 Seconds</span>
              <span>Shift Limit</span>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <span className="block font-bold text-orange-400 text-sm">{userStreak} Days 🔥</span>
              <span>Your Streak</span>
            </div>
          </div>

          <button
            onClick={startPlaying}
            className="w-full mt-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 font-black text-white text-base shadow-xl shadow-orange-900/40 active:scale-98 transition-all cursor-pointer"
          >
            PUNCH IN & START SHIFT →
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
            onPlayAgain={() => setGameState('briefing')}
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
