"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import type { ScoreGrade } from "@/lib/scoring/useVoiceScoring";

interface VoiceScoreDisplayProps {
  isScoring: boolean;
  pitchAccuracy: number;
  rhythmAccuracy: number;
  currentScore: number;
  totalScore: number;
  grade: ScoreGrade;
  isFinished?: boolean;
  onRestart?: () => void;
  onNextSong?: () => void;
}

const GRADE_STYLE: Record<ScoreGrade, { color: string; bg: string; border: string; label: string }> = {
  S: { color: "#C9A84C", bg: "rgba(201,168,76,0.15)", border: "rgba(201,168,76,0.5)", label: "완벽!" },
  A: { color: "#00E5FF", bg: "rgba(0,229,255,0.12)", border: "rgba(0,229,255,0.4)", label: "훌륭해!" },
  B: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.4)", label: "좋아요" },
  C: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)", label: "괜찮아요" },
  D: { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", label: "더 연습해봐요" },
};

function BarColor(val: number): string {
  if (val >= 70) return "#22C55E";
  if (val >= 40) return "#F59E0B";
  return "#EF4444";
}

function AnimatedBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(2, value)}%`, background: color }}
      />
    </div>
  );
}

export default function VoiceScoreDisplay({
  isScoring,
  pitchAccuracy,
  rhythmAccuracy,
  currentScore,
  totalScore,
  grade,
  isFinished = false,
  onRestart,
  onNextSong,
}: VoiceScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const scoreAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Count-up animation for final score
  useEffect(() => {
    if (!isFinished) { setDisplayScore(0); return; }
    if (scoreAnimRef.current) clearInterval(scoreAnimRef.current);
    const target = totalScore;
    let current = 0;
    scoreAnimRef.current = setInterval(() => {
      current = Math.min(target, current + Math.ceil(target / 40));
      setDisplayScore(current);
      if (current >= target) {
        clearInterval(scoreAnimRef.current!);
        // Trigger confetti on S or A
        if (grade === "S" || grade === "A") {
          setShowConfetti(true);
        }
      }
    }, 40);
    return () => { if (scoreAnimRef.current) clearInterval(scoreAnimRef.current); };
  }, [isFinished, totalScore, grade]);

  // Confetti burst
  useEffect(() => {
    if (!showConfetti) return;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 150, spread: 90, origin: { x: 0.5, y: 0.5 }, ticks: 200 });
    }).catch(() => null);
    setShowConfetti(false);
  }, [showConfetti]);

  if (!isScoring && !isFinished) return null;

  const gs = GRADE_STYLE[grade];

  // ── Final score screen ─────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 rounded-xl"
        style={{ background: "rgba(7,7,7,0.9)", backdropFilter: "blur(12px)" }}>
        <p className="text-4xl">🎤</p>

        {/* Grade badge */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black"
          style={{ background: gs.bg, border: `2px solid ${gs.border}`, color: gs.color, boxShadow: `0 0 24px ${gs.border}` }}>
          {grade}
        </div>

        {/* Score count-up */}
        <div className="text-center">
          <p className="text-5xl font-black text-white" style={{ textShadow: `0 0 20px ${gs.color}` }}>
            {displayScore}
          </p>
          <p className="text-white/40 text-sm mt-1">{gs.label}</p>
        </div>

        {/* Bars */}
        <div className="w-52 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/50 w-8">음정</span>
            <AnimatedBar value={pitchAccuracy} color={BarColor(pitchAccuracy)} />
            <span className="text-[11px] text-white/60 w-7 text-right">{pitchAccuracy}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/50 w-8">박자</span>
            <AnimatedBar value={rhythmAccuracy} color={BarColor(rhythmAccuracy)} />
            <span className="text-[11px] text-white/60 w-7 text-right">{rhythmAccuracy}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          {onNextSong && (
            <button onClick={onNextSong}
              className="px-5 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              다음 곡
            </button>
          )}
          {onRestart && (
            <button onClick={onRestart}
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }}>
              다시 부르기
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Live scoring panel ─────────────────────────────────────────────────────
  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 p-3 rounded-xl min-w-[140px]"
      style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
      <div className="flex items-center gap-1.5">
        <Icon icon="solar:microphone-bold" className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
        <span className="text-[10px] text-white/60 font-medium">채점 중...</span>
        {/* Live grade */}
        <span className="ml-auto text-xs font-black" style={{ color: gs.color }}>{grade}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/40 w-7">음정</span>
          <AnimatedBar value={pitchAccuracy} color={BarColor(pitchAccuracy)} />
          <span className="text-[10px] text-white/50 w-5 text-right">{pitchAccuracy}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/40 w-7">박자</span>
          <AnimatedBar value={rhythmAccuracy} color={BarColor(rhythmAccuracy)} />
          <span className="text-[10px] text-white/50 w-5 text-right">{rhythmAccuracy}</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between border-t pt-1.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] text-white/40">점수</span>
        <span className="text-lg font-black" style={{ color: gs.color, textShadow: `0 0 10px ${gs.color}40` }}>
          {currentScore}
        </span>
      </div>
    </div>
  );
}
