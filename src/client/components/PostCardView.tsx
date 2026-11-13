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
  const approveOpacity = forcedStamp === 'approve' ? 1 : Math.min(1, Math.max(0, dragOffset.x / 90));
  const removeOpacity = forcedStamp === 'remove' ? 1 : Math.min(1, Math.max(0, -dragOffset.x / 90));
  const banOpacity = forcedStamp === 'ban' ? 1 : Math.min(1, Math.max(0, -dragOffset.y / 80));

  const transformStyle: React.CSSProperties = {
    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };

  const isKarmaNegative = card.karma < 0;

  return (
    <div
      style={transformStyle}
      onPointerDown={onPointerDown}
      className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-5 shadow-2xl relative select-none cursor-grab active:cursor-grabbing touch-none flex flex-col justify-between min-h-[380px] max-h-[500px]"
    >
      {/* Dynamic Rubber Stamp Overlays */}
      {/* 1. APPROVED Stamp (Green) */}
      <div
        style={{ opacity: approveOpacity }}
        className="pointer-events-none absolute top-10 right-6 border-4 border-emerald-500 text-emerald-500 font-black text-2xl tracking-widest px-4 py-1.5 rounded-xl uppercase rotate-12 bg-emerald-950/40 backdrop-blur-sm z-30 shadow-lg"
      >
        APPROVED ✓
      </div>

      {/* 2. REMOVED Stamp (Red) */}
      <div
        style={{ opacity: removeOpacity }}
        className="pointer-events-none absolute top-10 left-6 border-4 border-rose-500 text-rose-500 font-black text-2xl tracking-widest px-4 py-1.5 rounded-xl uppercase -rotate-12 bg-rose-950/40 backdrop-blur-sm z-30 shadow-lg"
      >
        REMOVED ✗
      </div>

      {/* 3. BANNED Stamp (Purple / Gold) */}
      <div
        style={{ opacity: banOpacity }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-purple-400 text-purple-300 font-black text-3xl tracking-widest px-6 py-2.5 rounded-xl uppercase -rotate-6 bg-purple-950/80 backdrop-blur-md z-30 shadow-2xl flex items-center gap-2"
      >
        <span>🔨</span> BANNED
      </div>

      {/* Post Metadata Header */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar Circle */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
              {card.author.slice(2, 4).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-zinc-100 truncate">
                  {card.author}
                </span>
                {card.userFlair && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium truncate ${card.flairColor || 'bg-zinc-800 text-zinc-400'}`}>
                    {card.userFlair}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                <span>Age: {card.accountAgeDays}d</span>
                <span>•</span>
                <span className={isKarmaNegative ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                  {card.karma > 0 ? `+${card.karma}` : card.karma} Karma
                </span>
              </div>
            </div>
          </div>

          {/* Optional Category Tag */}
          {card.tag && (
            <span className="text-[10px] font-medium bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-full shrink-0 border border-zinc-700/50">
              {card.tag}
            </span>
          )}
        </div>

        {/* Post Title */}
        <h3 className="font-bold text-base text-zinc-100 mt-3.5 leading-snug">
          {card.title}
        </h3>

        {/* Post Body Snippet */}
        <p className="text-xs text-zinc-300/90 mt-2.5 leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50 font-normal">
          {card.body}
        </p>
      </div>

      {/* Card Footer: Quick AutoMod Inspection Hints */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Subreddit Queue
        </span>
        <span className="text-[10px] text-zinc-400">
          Swipe or use hotkeys (A / W / D)
        </span>
      </div>
    </div>
  );
};
