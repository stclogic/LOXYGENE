"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { PartyRoomShell } from "@/components/room/PartyRoomShell";
import { useDailyCall } from "@/hooks/useDailyCall";

const ACCENT = "#8B5CF6";
const CURRENT_TOPIC = "요즘 연애가 어려운 이유";

const MOCK_PANELS = [
  { id: "h",  name: "철학자김씨", role: "호스트", isSpeaking: true,  isMuted: false, avatar: "🎙️" },
  { id: "p1", name: "패널A",      role: "패널",   isSpeaking: false, isMuted: false, avatar: "👤" },
  { id: "p2", name: "패널B",      role: "패널",   isSpeaking: false, isMuted: true,  avatar: "👤" },
  { id: "p3", name: "패널C",      role: "패널",   isSpeaking: false, isMuted: false, avatar: "👤" },
];

const MOCK_AUDIENCE = [
  { id: "a1", name: "구경꾼A", handRaised: true },
  { id: "a2", name: "구경꾼B", handRaised: false },
  { id: "a3", name: "청중C",   handRaised: true },
];

function TalkPanelContent() {
  const [queueList, setQueueList] = useState(MOCK_AUDIENCE.filter(a => a.handRaised));
  const [grantedIdx, setGrantedIdx] = useState<number | null>(null);

  const grantSpeech = (idx: number) => {
    setGrantedIdx(idx);
    setTimeout(() => { setQueueList(q => q.filter((_, i) => i !== idx)); setGrantedIdx(null); }, 1500);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Topic */}
      <div className="rounded-xl p-3" style={{ background: `linear-gradient(135deg, rgba(139,92,246,0.15), rgba(196,181,253,0.05))`, border: `1px solid ${ACCENT}25` }}>
        <p className="text-[9px] tracking-widest font-bold mb-1" style={{ color: `${ACCENT}90` }}>CURRENT TOPIC</p>
        <p className="text-sm font-bold text-white leading-snug">{CURRENT_TOPIC}</p>
      </div>

      {/* Panel seats */}
      <div>
        <p className="text-[10px] text-white/30 tracking-widest font-medium mb-2">패널 ({MOCK_PANELS.length}명)</p>
        <div className="grid grid-cols-2 gap-2">
          {MOCK_PANELS.map(p => (
            <div key={p.id} className="relative rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1.5px solid ${p.isSpeaking ? ACCENT : "rgba(255,255,255,0.07)"}`,
                boxShadow: p.isSpeaking ? `0 0 16px rgba(139,92,246,0.2)` : "none",
              }}>
              <div className="h-20 flex flex-col items-center justify-center gap-1 p-2">
                <span className="text-3xl">{p.avatar}</span>
                <span className="text-[10px] font-medium text-white/80 truncate w-full text-center">{p.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${ACCENT}18`, color: ACCENT }}>{p.role}</span>
              </div>
              {p.isMuted && (
                <div className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.3)" }}>
                  <Icon icon="solar:microphone-slash-bold" className="w-2.5 h-2.5 text-red-400" />
                </div>
              )}
              {p.isSpeaking && (
                <div className="absolute bottom-1.5 left-1.5 flex gap-0.5 items-end h-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-0.5 rounded-full" style={{ background: ACCENT, height: `${30 + (i % 3) * 25}%`, animation: `voiceBar ${0.5 + i * 0.15}s ease-in-out infinite alternate` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hand-raise queue */}
      <div>
        <p className="text-[10px] text-white/30 tracking-widest font-medium mb-2">✋ 발언 대기 ({queueList.length})</p>
        {queueList.length === 0 && <p className="text-xs text-white/20 text-center py-2">대기 중인 청중 없음</p>}
        {queueList.map((a, i) => (
          <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-base">👤</span>
            <p className="text-xs text-white/80 flex-1 truncate">{a.name}</p>
            <button onClick={() => grantSpeech(i)}
              className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
              style={{ background: grantedIdx === i ? `rgba(139,92,246,0.3)` : `rgba(139,92,246,0.12)`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
              {grantedIdx === i ? "✓" : "발언권"}
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes voiceBar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}

export default function TalkShowRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [handRaised, setHandRaised] = useState(false);
  const [dailyToken, setDailyToken] = useState("");
  const [dailyRoomUrl, setDailyRoomUrl] = useState("");

  const { participants: dailyParticipants } = useDailyCall(dailyRoomUrl, dailyToken);

  useEffect(() => {
    params.then(({ roomId }) => {
      fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
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

  const handRaiseBtn = (
    <button
      onClick={() => setHandRaised(v => !v)}
      className="flex-1 h-12 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 min-w-0"
      style={{
        background: handRaised ? `rgba(139,92,246,0.2)` : "rgba(255,255,255,0.05)",
        border: `1px solid ${handRaised ? ACCENT + "60" : "rgba(255,255,255,0.1)"}`,
        color: handRaised ? ACCENT : "rgba(255,255,255,0.5)",
        boxShadow: handRaised ? `0 0 12px rgba(139,92,246,0.2)` : "none",
      }}
    >
      ✋ {handRaised ? "손 내리기" : "손들기"}
    </button>
  );

  return (
    <PartyRoomShell
      roomName="TALK SHOW"
      roomSubtitle="라이브 토크쇼"
      backHref="/rooms/talkshow"
      accentColor={ACCENT}
      participantCount={Object.keys(dailyParticipants).length || 34}
      panelTitle="🎙️ 토크 패널"
      panelContent={<TalkPanelContent />}
      extraBarControls={handRaiseBtn}
      dailyParticipants={dailyParticipants}
    />
  );
}
