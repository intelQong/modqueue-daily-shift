import React, { useState } from 'react';
import type { ShiftResult, PostCard } from '../../shared/types';
import { soundManager } from '../utils/audio';

type ResultsModalProps = {
  result: ShiftResult;
  cards: PostCard[];
  onPlayAgain: () => void;
};

export const ResultsModal: React.FC<ResultsModalProps> = ({ result, cards, onPlayAgain }) => {
  const [copied, setCopied] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(result.shareMarkdown);
      soundManager.playApprove();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = result.shareMarkdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      soundManager.playApprove();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const isRevolt = result.accuracy < 50;

  return (
    <div className="w-full max-w-lg mx-auto bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 select-none">
      {/* Header Banner */}
      <div className="text-center pb-4 border-b border-zinc-800">
        <span className="text-5xl inline-block mb-2 animate-bounce">
          {isRevolt ? '🚨' : '📜'}
        </span>
        <h2 className="text-xl font-black text-zinc-100 uppercase tracking-wide">
          {isRevolt ? 'Subreddit Quarantined!' : 'Daily Shift Complete!'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {isRevolt
            ? 'Too many wrongful removals triggered a community riot.'
            : `Your moderation report for ${result.subreddit} has been filed.`}
        </p>
      </div>

      {/* Rank Badge */}
      <div className="my-4 p-3.5 bg-gradient-to-r from-orange-950/60 via-zinc-900 to-amber-950/60 border border-orange-500/40 rounded-2xl text-center">
        <span className="text-[10px] uppercase font-bold text-orange-400 tracking-widest block">
          Awarded Mod Title
        </span>
        <span className="text-lg font-black text-amber-300 mt-0.5 block">
          {result.rankTitle}
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 text-center my-4">
        <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block uppercase">Accuracy</span>
          <span className="text-base font-black text-emerald-400 font-mono">
            {result.accuracy}%
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block uppercase">Queue</span>
          <span className="text-base font-black text-zinc-100 font-mono">
            {result.correctCount}/{result.totalCount}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block uppercase">Time</span>
          <span className="text-base font-black text-zinc-100 font-mono">
            {result.timeSeconds}s
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block uppercase">Streak</span>
          <span className="text-base font-black text-orange-400 font-mono">
            {result.streak} 🔥
          </span>
        </div>
      </div>

      {/* Visual Wordle-style Emoji Grid Preview */}
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 my-3 text-center">
        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block mb-1.5">
          Mod Decision Grid
        </span>
        <div className="text-lg tracking-widest font-mono">
          {result.decisions.map((d, i) => (
            <span key={i} title={`Post #${i + 1}: ${d.correct ? 'Correct' : 'Incorrect'}`}>
              {!d.correct ? '🟥' : d.expectedAction === 'ban' ? '🔨' : '🟩'}
            </span>
          ))}
        </div>
      </div>

      {/* 1-Click Share to Reddit Button */}
      <button
        onClick={handleCopyShare}
        className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.99] font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30 transition-all cursor-pointer mt-3"
      >
        <span>{copied ? '✓' : '💬'}</span>
        <span>{copied ? 'Copied to Clipboard!' : 'Share Result to Reddit Comments'}</span>
      </button>

      {/* Toggle Decision Review */}
      <div className="mt-3 text-center">
        <button
          onClick={() => setShowReview(!showReview)}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
        >
          {showReview ? '▲ Hide Decision Review' : '▼ Inspect All Decisions & Mistakes'}
        </button>
      </div>

      {/* Decision Review List */}
      {showReview && (
        <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1 border-t border-zinc-800 pt-2">
          {result.decisions.map((d, i) => {
            const card = cards.find((c) => c.id === d.cardId);
            return (
              <div
                key={i}
                className={`p-2.5 rounded-lg border text-xs ${
                  d.correct
                    ? 'bg-zinc-950/40 border-zinc-800 text-zinc-300'
                    : 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>
                    #{i + 1} {card?.author}
                  </span>
                  <span className="uppercase font-mono text-[10px]">
                    Your Action: <strong>{d.userAction}</strong> | Expected: <strong>{d.expectedAction}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {card?.title}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 italic">
                  💡 {card?.explanation}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Play Again / Practice */}
      <button
        onClick={onPlayAgain}
        className="w-full mt-3 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-xs text-zinc-300 transition-colors cursor-pointer"
      >
        Practice Another Shift ↺
      </button>
    </div>
  );
};
