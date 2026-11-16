import React from 'react';
import type { PostCard, Verdict } from '../../shared/types';

type PostCardViewProps = {
  card: PostCard;
  dragOffset: { x: number; y: number };
  isDragging: boolean;
  forcedStamp?: Verdict | null;
  onPointerDown?: (e: React.PointerEvent) => void;
};

export const PostCardView: React.FC<PostCardViewProps> = ({
  card,
  dragOffset,
  isDragging,
  forcedStamp,
  onPointerDown,
}) => {
  // Calculate dynamic rotation and opacity from drag distance
  const rotation = Math.max(-18, Math.min(18, dragOffset.x * 0.08));
  const approveOpacity = forcedStamp === 'approve' ? 1 : Math.min(1, Math.max(0, dragOffset.x / 80));
  const removeOpacity = forcedStamp === 'remove' ? 1 : Math.min(1, Math.max(0, -dragOffset.x / 80));
  const banOpacity = forcedStamp === 'ban' ? 1 : Math.min(1, Math.max(0, -dragOffset.y / 70));

  const transformStyle: React.CSSProperties = {
    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };

  const isKarmaNegative = card.karma < 0;

  return (
    <div
      style={transformStyle}
      onPointerDown={onPointerDown}
      className="w-full max-w-md bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-5 shadow-2xl relative select-none cursor-grab active:cursor-grabbing touch-none flex flex-col justify-between min-h-[400px] max-h-[520px] backdrop-blur-md"
    >
      {/* Dynamic Rubber Stamp Overlays */}
      {/* 1. APPROVED Stamp (Green) */}
      <div
        style={{ opacity: approveOpacity }}
        className="pointer-events-none absolute top-10 right-6 border-4 border-emerald-400 text-emerald-400 font-black text-2xl tracking-widest px-4 py-1.5 rounded-2xl uppercase rotate-12 bg-emerald-950/80 backdrop-blur-md z-30 shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-1.5"
      >
        <span>✓</span> APPROVED
      </div>

      {/* 2. REMOVED Stamp (Red) */}
      <div
        style={{ opacity: removeOpacity }}
        className="pointer-events-none absolute top-10 left-6 border-4 border-rose-500 text-rose-500 font-black text-2xl tracking-widest px-4 py-1.5 rounded-2xl uppercase -rotate-12 bg-rose-950/80 backdrop-blur-md z-30 shadow-[0_0_25px_rgba(244,63,94,0.5)] flex items-center gap-1.5"
      >
        <span>✗</span> REMOVED
      </div>

      {/* 3. BANNED Stamp (Purple / Gold) */}
      <div
        style={{ opacity: banOpacity }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-purple-400 text-purple-300 font-black text-3xl tracking-widest px-6 py-3 rounded-2xl uppercase -rotate-6 bg-purple-950/90 backdrop-blur-lg z-30 shadow-[0_0_35px_rgba(168,85,247,0.6)] flex items-center gap-2"
      >
        <span>🔨</span> BANNED
      </div>

      {/* Top Tricky Scenario Pill (if applicable) */}
      <div>
        {card.isTricky && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[10px] font-bold uppercase tracking-wider animate-pulse shadow-sm">
            <span>🧠</span>
            <span>Tricky Mod Scenario</span>
          </div>
        )}

        {/* Post Metadata Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar Circle with Reddit Snoo gradient */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
              {card.author.slice(2, 4).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-zinc-100 truncate">
                  {card.author}
                </span>
                {card.userFlair && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold truncate border border-white/10 ${card.flairColor || 'bg-zinc-800 text-zinc-300'}`}>
                    {card.userFlair}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                <span className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-300">
                  ⏳ {card.accountAgeDays}d old
                </span>
                <span className={`px-1.5 py-0.5 rounded font-bold ${
                  isKarmaNegative
                    ? 'bg-red-950/80 text-red-400 border border-red-500/40 animate-pulse'
                    : 'bg-zinc-800/80 text-zinc-300'
                }`}>
                  {card.karma > 0 ? `+${card.karma}` : card.karma} Karma
                </span>
              </div>
            </div>
          </div>

          {/* Optional Category Tag */}
          {card.tag && (
            <span className="text-[10px] font-bold bg-orange-950/50 text-orange-300 px-2.5 py-1 rounded-full shrink-0 border border-orange-500/30 uppercase tracking-wider">
              {card.tag}
            </span>
          )}
        </div>

        {/* Post Title */}
        <h3 className="font-black text-base text-zinc-100 mt-3.5 leading-snug">
          {card.title}
        </h3>

        {/* Post Body Snippet */}
        <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/80 font-normal">
          {card.body}
        </p>
      </div>

      {/* Card Footer: Quick AutoMod Inspection Hints */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-300">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          AutoMod Queue Active
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          ← [A] | [W] 🔨 | [D] →
        </span>
      </div>
    </div>
  );
};
