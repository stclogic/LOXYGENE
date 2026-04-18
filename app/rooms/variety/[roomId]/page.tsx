"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { PartyRoomShell } from "@/components/room/PartyRoomShell";
import { useDailyCall } from "@/hooks/useDailyCall";

const ACCENT = "#FF8C00";

const MOCK_CHALLENGES = [
  "🤔 이것은 진실인가 거짓인가?\n\"BTS는 2013년에 데뷔했다\"",
  "⚡ 다음 중 서울의 한강 다리가 아닌 것은?\n① 마포대교 ② 한남대교 ③ 청담대교 ④ 강동대교",
  "🎭 몸으로 말해요!\n제시어: 「호랑이가 춤을 춘다」",
  "🤔 진실 or 거짓:\n\"제주도는 한국에서 가장 큰 섬이다\"",
];

interface VoteOption { label: string; votes: number; color: string; }

function GamePanelContent() {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [votes, setVotes] = useState<VoteOption[]>([
    { label: "진실 ✅", votes: 12, color: "#22c55e" },
    { label: "거짓 ❌", votes: 7, color: "#ef4444" },
  ]);
  const [voted, setVoted] = useState<number | null>(null);
  const [showVote, setShowVote] = useState(false);

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) { setTimerActive(false); setShowVote(true); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  const startRound = () => { setTimerActive(true); setTimeLeft(30); setVoted(null); setShowVote(false); };
  const nextChallenge = () => {
    setChallengeIdx(i => (i + 1) % MOCK_CHALLENGES.length);
    setTimerActive(false); setTimeLeft(30); setVoted(null); setShowVote(false);
  };
  const handleVote = (i: number) => {
    if (voted !== null) return;
    setVoted(i);
    setVotes(v => v.map((o, idx) => idx === i ? { ...o, votes: o.votes + 1 } : o));
  };
  const totalVotes = votes.reduce((s, v) => s + v.votes, 0);
  const dashLen = 2 * Math.PI * 36;
  const dashOffset = dashLen * (1 - timeLeft / 30);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Timer */}
      <div className="flex items-center justify-center">
        <svg width="80" height="80" className="rotate-[-90deg]">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5" strokeLinecap="round"
            stroke={timeLeft <= 10 ? "#ef4444" : ACCENT}
            strokeDasharray={dashLen}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s" }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums" style={{ color: timeLeft <= 10 ? "#ef4444" : ACCENT }}>{timeLeft}</span>
          <span className="text-[9px] text-white/30">초</span>
        </div>
      </div>

      {/* Challenge */}
      <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${ACCENT}25` }}>
        <p className="text-sm font-bold text-white leading-relaxed whitespace-pre-line">{MOCK_CHALLENGES[challengeIdx]}</p>
      </div>

      {/* Vote */}
      {showVote && (
        <div className="flex flex-col gap-2">
          {votes.map((v, i) => (
            <button key={i} onClick={() => handleVote(i)}
              className="relative w-full overflow-hidden rounded-xl p-3 font-bold text-sm transition-all active:scale-98 text-left"
              style={{ background: voted === i ? `${v.color}20` : "rgba(255,255,255,0.04)", border: `1px solid ${voted === i ? v.color + "60" : "rgba(255,255,255,0.1)"}`, color: voted !== null ? v.color : "white" }}>
              <div className="absolute inset-0 rounded-xl transition-all duration-700"
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
      <div className="flex gap-2">
        {!timerActive && !showVote && (
          <button onClick={startRound}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: `rgba(255,140,0,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
            ▶ 시작
          </button>
        )}
        <button onClick={nextChallenge}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
          다음 →
        </button>
      </div>

      {/* Reactions */}
      <div className="flex items-center justify-center gap-2">
        {["😂", "🔥", "👏", "😱"].map(e => (
          <button key={e}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-75"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VarietyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const paramsRef = useRef<{ roomId: string } | null>(null);
  const [dailyToken, setDailyToken] = useState("");
  const [dailyRoomUrl, setDailyRoomUrl] = useState("");

  const { participants: dailyParticipants } = useDailyCall(dailyRoomUrl, dailyToken);

  useEffect(() => {
    params.then(p => {
      paramsRef.current = p;
      fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: p.roomId }),
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data) return;
          if (data.dailyToken) setDailyToken(data.dailyToken);
          if (data.dailyRoomUrl) setDailyRoomUrl(data.dailyRoomUrl);
        })
        .catch(console.error);
    });
  }, [params]);

  const buzzer = (
    <button
      onClick={() => setBuzzerPressed(true)}
      className="flex-1 h-12 rounded-xl font-black text-base transition-all active:scale-95 min-w-0"
      style={{
        background: buzzerPressed ? "rgba(255,140,0,0.08)" : "rgba(255,140,0,0.2)",
        border: `2px solid ${buzzerPressed ? "rgba(255,140,0,0.25)" : ACCENT}`,
        color: buzzerPressed ? "rgba(255,140,0,0.4)" : ACCENT,
        boxShadow: buzzerPressed ? "none" : `0 0 18px rgba(255,140,0,0.25)`,
      }}
    >
      {buzzerPressed ? "✓ 버즈인!" : "🔔 버즈인!"}
    </button>
  );

  return (
    <PartyRoomShell
      roomName="VARIETY SHOW"
      roomSubtitle="방구석 버라이어티"
      backHref="/rooms/variety"
      accentColor={ACCENT}
      participantCount={Object.keys(dailyParticipants).length || 48}
      panelTitle="🎮 게임 챌린지"
      panelContent={<GamePanelContent />}
      extraBarControls={buzzer}
      dailyParticipants={dailyParticipants}
    />
  );
}
