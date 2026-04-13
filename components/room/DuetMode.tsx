"use client";

import { Icon } from "@iconify/react";

export interface DuetSinger {
  id: string;
  nickname: string;
  score: number;
  pitchAccuracy: number;
  rhythmAccuracy: number;
  grade: string;
}

interface DuetModeProps {
  singer1: DuetSinger;
  singer2: DuetSinger;
  songTitle: string;
  isHost: boolean;
  onEnd: () => void;
}

// Shared audience reaction counts (mock)
const AUDIENCE_REACTIONS = [
  { emoji: "👏", count: 42 },
  { emoji: "🌸", count: 18 },
  { emoji: "❤️", count: 37 },
];

function SingerPanel({ singer, side }: { singer: DuetSinger; side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div className="flex-1 relative flex flex-col overflow-hidden"
      style={{ borderRight: isLeft ? "none" : "none" }}>
      {/* Camera placeholder */}
      <div className="flex-1 flex items-center justify-center"
        style={{ background: `linear-gradient(${isLeft ? "135deg" : "225deg"}, rgba(0,229,255,0.04), rgba(7,7,7,0.95))` }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black"
            style={{ background: isLeft ? "rgba(0,229,255,0.12)" : "rgba(255,0,127,0.12)", border: `2px solid ${isLeft ? "rgba(0,229,255,0.4)" : "rgba(255,0,127,0.4)"}`, color: isLeft ? "#00E5FF" : "#FF007F" }}>
            {singer.nickname[0]}
          </div>
          <Icon icon="solar:camera-slash-bold" className="w-5 h-5 text-white/20" />
          <span className="text-white/30 text-xs">카메라 없음</span>
        </div>
      </div>

      {/* Score overlay */}
      <div className="absolute bottom-3 inset-x-3 flex flex-col gap-1.5 p-2.5 rounded-xl"
        style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-xs font-bold truncate">{singer.nickname}</span>
          <span className="text-lg font-black" style={{ color: isLeft ? "#00E5FF" : "#FF007F" }}>{singer.score}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${singer.pitchAccuracy}%`, background: isLeft ? "#00E5FF" : "#FF007F" }} />
          </div>
          <span className="text-[9px] text-white/40 font-medium">{singer.grade}</span>
        </div>
      </div>
    </div>
  );
}

export default function DuetMode({ singer1, singer2, songTitle, isHost, onEnd }: DuetModeProps) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col rounded-xl overflow-hidden"
      style={{ background: "#070707" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded font-bold animate-pulse"
            style={{ background: "rgba(0,229,255,0.12)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.3)" }}>
            🎤 DUET
          </span>
          <span className="text-white/60 text-xs truncate max-w-[150px]">{songTitle}</span>
        </div>
        {isHost && (
          <button onClick={onEnd}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.8)" }}>
            <Icon icon="solar:close-bold" className="w-3 h-3" />
            듀엣 종료
          </button>
        )}
      </div>

      {/* Main split */}
      <div className="flex flex-col sm:flex-row flex-1 min-h-0">
        <SingerPanel singer={singer1} side="left" />

        {/* VS divider */}
        <div className="flex-shrink-0 flex items-center justify-center sm:flex-col"
          style={{ width: "auto", height: "auto", minWidth: 32, minHeight: 32 }}>
          <div className="sm:flex-1 w-full h-px sm:w-px sm:h-full" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,229,255,0.3), transparent)" }} />
          <div className="px-2 py-1.5 rounded-full text-xs font-black"
            style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF", minWidth: 32, textAlign: "center" }}>
            VS
          </div>
          <div className="sm:flex-1 w-full h-px sm:w-px sm:h-full" style={{ background: "linear-gradient(to bottom, rgba(0,229,255,0.3), transparent)" }} />
        </div>

        <SingerPanel singer={singer2} side="right" />
      </div>

      {/* Audience reaction bar */}
      <div className="flex-shrink-0 flex items-center justify-center gap-6 px-4 py-2"
        style={{ background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {AUDIENCE_REACTIONS.map(r => (
          <div key={r.emoji} className="flex items-center gap-1">
            <span className="text-base">{r.emoji}</span>
            <span className="text-white/50 text-xs">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
