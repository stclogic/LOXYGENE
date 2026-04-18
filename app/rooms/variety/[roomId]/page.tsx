"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#FF8C00";

interface Player { id: string; name: string; score: number; rank: number; avatar: string; }
interface VoteOption { label: string; votes: number; color: string; }

const MOCK_PLAYERS: Player[] = [
  { id: "p1", name: "게임마스터K", score: 2400, rank: 1, avatar: "👑" },
  { id: "p2", name: "퀴즈왕", score: 1850, rank: 2, avatar: "🏅" },
  { id: "p3", name: "번개같은손", score: 1320, rank: 3, avatar: "⚡" },
  { id: "p4", name: "두뇌왕", score: 990, rank: 4, avatar: "🧠" },
  { id: "p5", name: "랜덤박스", score: 640, rank: 5, avatar: "🎲" },
];

const MOCK_CHALLENGES = [
  "🤔 이것은 진실인가 거짓인가?\n\"BTS는 2013년에 데뷔했다\"",
  "⚡ 다음 중 서울의 한강 다리가 아닌 것은?\n① 마포대교 ② 한남대교 ③ 청담대교 ④ 강동대교",
  "🎭 몸으로 말해요!\n제시어: 「호랑이가 춤을 춘다」",
  "🤔 진실 or 거짓:\n\"제주도는 한국에서 가장 큰 섬이다\"",
];

export default function VarietyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [votes, setVotes] = useState<VoteOption[]>([
    { label: "진실 ✅", votes: 12, color: "#22c55e" },
    { label: "거짓 ❌", votes: 7, color: "#ef4444" },
  ]);
  const [voted, setVoted] = useState<number | null>(null);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [showVote, setShowVote] = useState(false);
  const reactionIdRef = useRef(0);

  // Countdown timer
  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) { setTimerActive(false); setShowVote(true); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  const startRound = () => { setTimerActive(true); setTimeLeft(30); setBuzzerPressed(false); setVoted(null); setShowVote(false); };
  const nextChallenge = () => { setChallengeIdx(i => (i + 1) % MOCK_CHALLENGES.length); setTimerActive(false); setTimeLeft(30); setBuzzerPressed(false); setVoted(null); setShowVote(false); };

  const fireReaction = (emoji: string) => {
    const id = ++reactionIdRef.current;
    const x = 20 + Math.random() * 60;
    setReactions(r => [...r, { id, emoji, x }]);
    setTimeout(() => setReactions(r => r.filter(p => p.id !== id)), 2000);
  };

  const handleVote = (i: number) => {
    if (voted !== null) return;
    setVoted(i);
    setVotes(v => v.map((o, idx) => idx === i ? { ...o, votes: o.votes + 1 } : o));
  };

  const totalVotes = votes.reduce((s, v) => s + v.votes, 0);
  const timerPct = (timeLeft / 30) * 100;
  const dashLen = 2 * Math.PI * 52;
  const dashOffset = dashLen * (1 - timerPct / 100);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#070707] flex flex-col relative">
      {/* Floating reactions */}
      {reactions.map(r => (
        <div key={r.id} className="fixed bottom-24 text-3xl pointer-events-none z-50"
          style={{ left: `${r.x}%`, animation: "reactionFloat 2s ease-out forwards" }}>{r.emoji}</div>
      ))}

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b flex-shrink-0"
        style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <Link href="/rooms/variety" className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
          <span className="hidden sm:block">버라이어티 쇼</span>
        </Link>
        <h1 className="text-sm font-black tracking-[0.12em]" style={{ color: ACCENT, textShadow: `0 0 12px ${ACCENT}80` }}>VARIETY SHOW</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: ACCENT, animation: "pulse-neon 1.5s infinite" }} />
          <span className="text-xs" style={{ color: ACCENT }}>LIVE</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden">

          {/* Game Stage */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 gap-6 relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] rounded-full opacity-10"
                style={{ background: `radial-gradient(ellipse, ${ACCENT}, transparent)`, filter: "blur(60px)" }} />
            </div>

            {/* Timer circle */}
            <div className="relative flex-shrink-0">
              <svg width="120" height="120" className="rotate-[-90deg]">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="6" strokeLinecap="round"
                  stroke={timeLeft <= 10 ? "#ef4444" : ACCENT}
                  strokeDasharray={dashLen}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tabular-nums" style={{ color: timeLeft <= 10 ? "#ef4444" : ACCENT }}>{timeLeft}</span>
                <span className="text-[9px] text-white/30">초</span>
              </div>
            </div>

            {/* Challenge card */}
            <div className="w-full max-w-2xl rounded-3xl p-8 text-center relative"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${ACCENT}25`, boxShadow: `0 0 40px rgba(255,140,0,0.08)` }}>
              <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed whitespace-pre-line">
                {MOCK_CHALLENGES[challengeIdx]}
              </p>
            </div>

            {/* Vote panel */}
            {showVote && (
              <div className="w-full max-w-lg flex flex-col gap-3">
                <p className="text-center text-xs text-white/40 font-medium tracking-wider">투표하세요!</p>
                {votes.map((v, i) => (
                  <button key={i} onClick={() => handleVote(i)}
                    className="relative w-full overflow-hidden rounded-2xl p-3.5 font-bold text-sm transition-all active:scale-[0.98]"
                    style={{
                      background: voted === i ? `${v.color}20` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${voted === i ? v.color + "60" : "rgba(255,255,255,0.1)"}`,
                      color: voted !== null ? v.color : "white",
                    }}>
                    <div className="absolute inset-0 transition-all duration-700 rounded-2xl"
                      style={{ width: voted !== null ? `${Math.round((v.votes / totalVotes) * 100)}%` : "0%", background: `${v.color}15` }} />
                    <div className="relative flex items-center justify-between">
                      <span>{v.label}</span>
                      {voted !== null && <span className="font-black">{Math.round((v.votes / totalVotes) * 100)}%</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3 flex-wrap justify-center">
              {!timerActive && !showVote && (
                <button onClick={startRound}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{ background: `rgba(255,140,0,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
                  ▶ 라운드 시작
                </button>
              )}
              <button onClick={nextChallenge}
                className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                다음 문제 →
              </button>
            </div>
          </div>

          {/* Reaction bar */}
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {["😂", "🔥", "👏", "😱"].map(e => (
              <button key={e} onClick={() => fireReaction(e)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all active:scale-75"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {e}
              </button>
            ))}
          </div>

          {/* Bottom action bar */}
          <div className="px-4 py-3 flex items-center gap-3 border-t flex-shrink-0"
            style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
            <button onClick={toggleMic} className="flex flex-col items-center gap-1 w-12 h-12 rounded-xl justify-center transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Icon icon="solar:microphone-linear" className="w-5 h-5 text-white/50" />
            </button>
            <button onClick={toggleCamera} className="flex flex-col items-center gap-1 w-12 h-12 rounded-xl justify-center transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Icon icon="solar:camera-linear" className="w-5 h-5 text-white/50" />
            </button>

            {/* Buzz-in */}
            <button onClick={() => setBuzzerPressed(true)}
              className="flex-1 h-14 rounded-2xl font-black text-lg transition-all active:scale-95"
              style={{
                background: buzzerPressed ? "rgba(255,140,0,0.1)" : `rgba(255,140,0,0.2)`,
                border: `2px solid ${buzzerPressed ? "rgba(255,140,0,0.3)" : ACCENT}`,
                color: buzzerPressed ? "rgba(255,140,0,0.5)" : ACCENT,
                boxShadow: buzzerPressed ? "none" : `0 0 20px rgba(255,140,0,0.3)`,
              }}>
              {buzzerPressed ? "✓ 버즈인!" : "🔔 버즈인!"}
            </button>

            <button className="flex flex-col items-center gap-1 w-12 h-12 rounded-xl justify-center transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Icon icon="solar:chat-round-linear" className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Scoreboard sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-l flex-shrink-0 overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold tracking-widest" style={{ color: ACCENT }}>🏆 SCOREBOARD</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {MOCK_PLAYERS.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: i === 0 ? `rgba(255,140,0,0.1)` : "rgba(255,255,255,0.02)", border: i === 0 ? `1px solid ${ACCENT}30` : "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-lg flex-shrink-0">{p.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/85 truncate">{p.name}</p>
                  <p className="text-[10px]" style={{ color: i === 0 ? ACCENT : "rgba(255,255,255,0.3)" }}>#{p.rank}</p>
                </div>
                <span className="text-sm font-black tabular-nums flex-shrink-0" style={{ color: i === 0 ? ACCENT : "rgba(255,255,255,0.6)" }}>
                  {p.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes pulse-neon { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes reactionFloat { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-120px) scale(1.5)} }
      `}</style>
    </div>
  );
}

// Stubs to avoid undefined errors
function toggleMic() {}
function toggleCamera() {}
