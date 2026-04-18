"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#8B5CF6";

const MOCK_PANELS = [
  { id: "h", name: "철학자김씨", role: "호스트", isSpeaking: true, isMuted: false, avatar: "🎙️" },
  { id: "p1", name: "패널A", role: "패널", isSpeaking: false, isMuted: false, avatar: "👤" },
  { id: "p2", name: "패널B", role: "패널", isSpeaking: false, isMuted: true, avatar: "👤" },
  { id: "p3", name: "패널C", role: "패널", isSpeaking: false, isMuted: false, avatar: "👤" },
];

const MOCK_AUDIENCE = [
  { id: "a1", name: "구경꾼A", handRaised: true },
  { id: "a2", name: "구경꾼B", handRaised: false },
  { id: "a3", name: "청중C", handRaised: true },
  { id: "a4", name: "관찰자D", handRaised: false },
  { id: "a5", name: "익명E", handRaised: false },
];

const CURRENT_TOPIC = "요즘 연애가 어려운 이유";

function VideoSlot({ name, role, isSpeaking, isMuted, avatar, size = "md" }: {
  name: string; role: string; isSpeaking: boolean; isMuted: boolean; avatar: string; size?: "lg" | "md" | "sm";
}) {
  const sizeClass = size === "lg" ? "h-48 sm:h-64" : size === "md" ? "h-36 sm:h-44" : "h-20 sm:h-24";
  return (
    <div className={`relative rounded-2xl overflow-hidden flex-shrink-0 ${sizeClass}`}
      style={{ background: "rgba(255,255,255,0.03)", border: `1.5px solid ${isSpeaking ? ACCENT : "rgba(255,255,255,0.08)"}`, boxShadow: isSpeaking ? `0 0 20px rgba(139,92,246,0.25)` : "none" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <span className={size === "lg" ? "text-5xl" : size === "md" ? "text-3xl" : "text-xl"}>{avatar}</span>
        {size !== "sm" && <span className="text-xs font-medium text-white/80">{name}</span>}
        {size !== "sm" && <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${ACCENT}18`, color: ACCENT }}>{role}</span>}
      </div>
      {isMuted && <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.3)" }}><Icon icon="solar:microphone-slash-bold" className="w-3 h-3 text-red-400" /></div>}
      {isSpeaking && <div className="absolute bottom-2 left-2 flex gap-0.5 items-end h-4">{[1,2,3,4].map(i => (<div key={i} className="w-0.5 rounded-full" style={{ background: ACCENT, height: `${30 + (i % 3) * 25}%`, animation: `voiceBar ${0.5 + i * 0.15}s ease-in-out infinite alternate` }} />))}</div>}
    </div>
  );
}

export default function TalkShowRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [handRaised, setHandRaised] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [queueList, setQueueList] = useState(MOCK_AUDIENCE.filter(a => a.handRaised));
  const [grantedIdx, setGrantedIdx] = useState<number | null>(null);

  const grantSpeech = (idx: number) => {
    setGrantedIdx(idx);
    setTimeout(() => { setQueueList(q => q.filter((_, i) => i !== idx)); setGrantedIdx(null); }, 1500);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#070707] flex flex-col relative">
      {/* Topic overlay */}
      <div className="fixed top-16 left-4 z-30 max-w-xs">
        <div className="px-4 py-3 rounded-2xl" style={{ background: `linear-gradient(135deg, rgba(139,92,246,0.2), rgba(196,181,253,0.08))`, border: `1px solid ${ACCENT}30`, backdropFilter: "blur(16px)" }}>
          <p className="text-[9px] tracking-widest font-bold mb-1" style={{ color: `${ACCENT}80` }}>CURRENT TOPIC</p>
          <p className="text-sm font-bold text-white leading-snug">{CURRENT_TOPIC}</p>
        </div>
      </div>

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0 z-40"
        style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <Link href="/rooms/talkshow" className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" /><span className="hidden sm:block">토크쇼</span>
        </Link>
        <h1 className="text-sm font-black tracking-widest" style={{ color: ACCENT, textShadow: `0 0 12px ${ACCENT}80` }}>TALK SHOW</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: ACCENT, animation: "pulse-neon 1.5s infinite" }} />
          <span className="text-xs" style={{ color: ACCENT }}>LIVE</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main stage */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden">
          <div className="flex-1 p-4 lg:p-6 flex flex-col gap-4">
            {/* Host seat */}
            <div className="grid grid-cols-1">
              <VideoSlot {...MOCK_PANELS[0]} size="lg" />
            </div>

            {/* Panel seats */}
            <div className="grid grid-cols-3 gap-3">
              {MOCK_PANELS.slice(1).map(p => <VideoSlot key={p.id} {...p} size="md" />)}
            </div>

            {/* Audience strip */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/30 tracking-wider font-medium">청중 ({MOCK_AUDIENCE.length}명)</p>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {MOCK_AUDIENCE.map(a => (
                  <div key={a.id} className="flex-shrink-0 flex flex-col items-center gap-1">
                    <VideoSlot name={a.name} role="청중" isSpeaking={false} isMuted={true} avatar="👤" size="sm" />
                    {a.handRaised && <span className="text-xs">✋</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="px-4 py-3 flex items-center gap-3 border-t flex-shrink-0"
            style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
            <button onClick={() => setMicOn(!micOn)} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: micOn ? `rgba(139,92,246,0.15)` : "rgba(255,50,50,0.1)", border: micOn ? `1px solid ${ACCENT}40` : "1px solid rgba(255,50,50,0.3)" }}>
              <Icon icon={micOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"} className="w-5 h-5" style={{ color: micOn ? ACCENT : "#ff5555" }} />
            </button>
            <button onClick={() => setCamOn(!camOn)} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: camOn ? `rgba(139,92,246,0.15)` : "rgba(255,50,50,0.1)", border: camOn ? `1px solid ${ACCENT}40` : "1px solid rgba(255,50,50,0.3)" }}>
              <Icon icon={camOn ? "solar:camera-bold" : "solar:camera-slash-bold"} className="w-5 h-5" style={{ color: camOn ? ACCENT : "#ff5555" }} />
            </button>

            <button onClick={() => setHandRaised(!handRaised)}
              className="flex-1 h-12 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: handRaised ? `rgba(139,92,246,0.2)` : "rgba(255,255,255,0.05)",
                border: handRaised ? `1px solid ${ACCENT}60` : "1px solid rgba(255,255,255,0.1)",
                color: handRaised ? ACCENT : "rgba(255,255,255,0.6)",
                boxShadow: handRaised ? `0 0 15px rgba(139,92,246,0.25)` : "none",
              }}>
              ✋ {handRaised ? "손 내리기" : "손들기"}
            </button>

            <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.3)" }}>
              <span className="text-lg">💜</span>
            </button>
            <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon icon="solar:chat-round-linear" className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Hand-raise queue sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-l flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold tracking-widest" style={{ color: ACCENT }}>✋ 발언 대기열</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {queueList.length === 0 && <p className="text-xs text-white/20 text-center mt-4">대기 중인 청중 없음</p>}
            {queueList.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-lg">👤</span>
                <div className="flex-1 min-w-0"><p className="text-xs text-white/80 truncate">{a.name}</p></div>
                <button onClick={() => grantSpeech(i)}
                  className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
                  style={{ background: grantedIdx === i ? `rgba(139,92,246,0.3)` : `rgba(139,92,246,0.12)`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
                  {grantedIdx === i ? "✓" : "발언권"}
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes pulse-neon{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes voiceBar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}
        .hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
        .hide-scrollbar::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}
