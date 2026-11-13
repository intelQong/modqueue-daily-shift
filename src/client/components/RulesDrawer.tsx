import React from 'react';
import type { AutoModRule } from '../../shared/types';

type RulesDrawerProps = {
  rules: AutoModRule[];
  isOpen: boolean;
  onClose: () => void;
};

export const RulesDrawer: React.FC<RulesDrawerProps> = ({ rules, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="w-full max-w-lg mx-auto bg-zinc-900 border-x border-b border-orange-500/50 rounded-b-xl p-3.5 shadow-2xl mb-2 animate-in slide-in-from-top-2 duration-150 select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
        <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⚙️</span> Subreddit AutoMod Directives
        </h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-200 text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800 cursor-pointer"
        >
          ✕ Close
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule, idx) => (
          <div
            key={rule.id}
            className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/60"
          >
            <span className="text-lg p-1 bg-zinc-900 rounded-md shrink-0">
              {rule.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1 py-0.2 bg-zinc-800 text-orange-400 rounded font-bold">
                  Rule {idx + 1}
                </span>
                <span className="text-xs font-semibold text-zinc-200">
                  {rule.title}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                {rule.description}
              </p>
            </div>
          </div>
        ))}

        {/* Special rule for Ban Hammer */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-purple-950/30 border border-purple-800/40">
          <span className="text-lg p-1 bg-purple-900/40 rounded-md shrink-0">
            🔨
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-1 py-0.2 bg-purple-900/80 text-purple-300 rounded font-bold">
                Anti-Spam Protocol
              </span>
              <span className="text-xs font-semibold text-purple-200">
                Ban Spammers & Bots
              </span>
            </div>
            <p className="text-[11px] text-purple-300/80 mt-0.5 leading-snug">
              Accounts with negative karma (&lt; 0), crypto scams, or raid attacks must receive the <strong>Ban Hammer</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
