"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AudienceReactionsHandle {
  trigger: (emoji: string, count?: number) => void;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;     // % from left
  duration: number; // seconds
  delay: number; // seconds
  size: number;  // px
  wobble: number; // amplitude of x-wobble
}

interface AudienceReactionsProps {
  onReactionSent?: (emoji: string) => void;
}

const QUICK_REACTIONS = ["👏", "❤️", "🔥", "⭐", "😂"];
let _rid = 0;

// ── Component ──────────────────────────────────────────────────────────────────
const AudienceReactions = forwardRef<AudienceReactionsHandle, AudienceReactionsProps>(
  ({ onReactionSent }, ref) => {
    const [floating, setFloating] = useState<FloatingReaction[]>([]);
    const cleanupTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const spawnReactions = (emoji: string, count = 4) => {
      const newItems: FloatingReaction[] = Array.from({ length: count }, () => {
        const id = ++_rid;
        const duration = 2 + Math.random() * 1.2;
        const delay = Math.random() * 0.4;
        // Schedule removal after animation completes
        const timer = setTimeout(() => {
          setFloating(prev => prev.filter(r => r.id !== id));
          cleanupTimersRef.current.delete(id);
        }, (duration + delay) * 1000 + 50);
        cleanupTimersRef.current.set(id, timer);

        return {
          id,
          emoji,
          x: 15 + Math.random() * 70,
          duration,
          delay,
          size: 18 + Math.floor(Math.random() * 12),
          wobble: 20 + Math.random() * 30,
        };
      });

      setFloating(prev => [...prev, ...newItems]);
    };

    // Expose trigger via ref
    useImperativeHandle(ref, () => ({
      trigger: (emoji, count = 4) => spawnReactions(emoji, count),
    }));

    const handleQuickReaction = (emoji: string) => {
      spawnReactions(emoji, 3 + Math.floor(Math.random() * 3));
      onReactionSent?.(emoji);
    };

    return (
      <>
        {/* Floating reactions overlay */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 45 }}>
          {floating.map(r => (
            <span
              key={r.id}
              style={{
                position: "absolute",
                left: `${r.x}%`,
                bottom: "80px",
                fontSize: r.size,
                lineHeight: 1,
                animation: `float-up-${r.wobble > 25 ? "wide" : "narrow"} ${r.duration}s ease-out ${r.delay}s forwards`,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Quick reaction buttons — bottom right, above action bar */}
        <div className="fixed right-3 bottom-[100px] z-40 flex flex-col-reverse gap-2 lg:bottom-[80px]">
          {QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all hover:scale-110 active:scale-95"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        <style>{`
          @keyframes float-up-narrow {
            0%   { opacity: 1;   transform: translateY(0)   translateX(0); }
            25%  { opacity: 1;   transform: translateY(-40%) translateX(8px); }
            50%  { opacity: 0.8; transform: translateY(-60%) translateX(-6px); }
            75%  { opacity: 0.5; transform: translateY(-80%) translateX(5px); }
            100% { opacity: 0;   transform: translateY(-100%) translateX(0); }
          }
          @keyframes float-up-wide {
            0%   { opacity: 1;   transform: translateY(0)   translateX(0); }
            25%  { opacity: 1;   transform: translateY(-35%) translateX(18px); }
            50%  { opacity: 0.8; transform: translateY(-60%) translateX(-15px); }
            75%  { opacity: 0.5; transform: translateY(-82%) translateX(12px); }
            100% { opacity: 0;   transform: translateY(-100%) translateX(0); }
          }
        `}</style>
      </>
    );
  }
);

AudienceReactions.displayName = "AudienceReactions";
export default AudienceReactions;
