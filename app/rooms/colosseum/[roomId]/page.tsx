"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { PartyRoomShell } from "@/components/room/PartyRoomShell";
import { hasNickname, setUserNickname, randomNickname } from "@/lib/utils/userSession";
import { useDailyCall } from "@/hooks/useDailyCall";

const MOCK_LYRICS = [
  { text: "사랑했지만 이제는 모두 지나간 일", active: false },
  { text: "그대 없인 살 수 없다 했던 말들이", active: true },
  { text: "이제는 모두 거짓말이 되어버렸네", active: false },
  { text: "행복했던 우리의 날들이여", active: false },
];

const MOCK_QUEUE = [
  { id: "q1", nickname: "가을바람", songTitle: "사랑했지만 (김광석)", position: 1 },
  { id: "q2", nickname: "봄날의꿈", songTitle: "첫눈처럼 너에게 가겠다", position: 2 },
  { id: "q3", nickname: "여름밤", songTitle: "너에게 난, 나에게 넌", position: 3 },
  { id: "q4", nickname: "하늘별", songTitle: "그녀가 처음 울던 날", position: 4 },
];

function KaraokePanelContent() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Now playing */}
      <div>
        <p className="text-[10px] text-white/30 tracking-widest font-medium mb-2">NOW PLAYING</p>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.12)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,229,255,0.1)" }}>
            <Icon icon="solar:microphone-bold" className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">사랑했지만</p>
            <p className="text-[10px] text-white/40 truncate">김광석 · 별빛가수 노래 중</p>
          </div>
        </div>
      </div>

      {/* Lyrics */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] text-white/30 tracking-widest font-medium">가사</p>
        {MOCK_LYRICS.map((line, i) => (
          <p
            key={i}
            className="text-sm leading-relaxed transition-all px-1"
            style={{
              color: line.active ? "#00E5FF" : "rgba(255,255,255,0.3)",
              fontWeight: line.active ? 600 : 400,
              textShadow: line.active ? "0 0 12px rgba(0,229,255,0.5)" : "none",
            }}
          >
            {line.text}
          </p>
        ))}
      </div>

      {/* Mic level */}
      <div>
        <p className="text-[10px] text-white/30 tracking-widest font-medium mb-2">MIC LEVEL</p>
        <div className="flex items-end gap-0.5 h-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                background: i < 14 ? "#00E5FF" : i < 17 ? "#FFD700" : "#ef4444",
                height: `${30 + Math.abs(Math.sin(i * 0.7)) * 70}%`,
                opacity: i < 10 ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Queue */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-white/30 tracking-widest font-medium">대기열</p>
          <span className="text-[10px] text-[#00E5FF]">{MOCK_QUEUE.length}명</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {MOCK_QUEUE.map(entry => (
            <div
              key={entry.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg"
              style={{
                background: entry.position === 1 ? "rgba(0,229,255,0.06)" : "rgba(255,255,255,0.02)",
                border: entry.position === 1 ? "1px solid rgba(0,229,255,0.15)" : "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span className="text-xs font-black w-4 text-center flex-shrink-0" style={{ color: entry.position === 1 ? "#00E5FF" : "rgba(255,255,255,0.25)" }}>
                {entry.position}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-white/80 text-xs font-semibold truncate">{entry.nickname}</p>
                <p className="text-white/35 text-[10px] truncate">{entry.songTitle}</p>
              </div>
              {entry.position === 1 && (
                <Icon icon="solar:microphone-bold" className="text-[#00E5FF] w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ColosseumRoomPage({ params }: { params: { roomId: string } }) {
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [dailyToken, setDailyToken] = useState("");
  const [dailyRoomUrl, setDailyRoomUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { participants: dailyParticipants } = useDailyCall(dailyRoomUrl, dailyToken);

  useEffect(() => {
    if (!hasNickname()) setNicknameModalOpen(true);
  }, []);

  useEffect(() => {
    fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: params.roomId }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return;
        if (data.dailyToken) setDailyToken(data.dailyToken);
        if (data.dailyRoomUrl) setDailyRoomUrl(data.dailyRoomUrl);
      })
      .catch(console.error);
  }, [params.roomId]);

  useEffect(() => {
    if (nicknameModalOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [nicknameModalOpen]);

  const handleNicknameSubmit = () => {
    const name = nicknameInput.trim();
    if (!name) return;
    setUserNickname(name);
    setNicknameModalOpen(false);
  };

  return (
    <>
      <PartyRoomShell
        roomName="THE COLOSSEUM"
        roomSubtitle={`룸 ${params.roomId}`}
        backHref="/rooms/colosseum"
        accentColor="#00E5FF"
        participantCount={Object.keys(dailyParticipants).length || 127}
        panelTitle="🎤 노래방"
        panelContent={<KaraokePanelContent />}
        dailyParticipants={dailyParticipants}
      />

      {/* Nickname entry modal */}
      {nicknameModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: "rgba(8,8,20,0.99)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 40px rgba(0,229,255,0.08)" }}
          >
            <div className="text-center">
              <span className="text-3xl">🎉</span>
              <h2 className="text-white font-black text-lg mt-2">파티에 오신 것을 환영합니다!</h2>
              <p className="text-white/35 text-sm mt-1">룸에서 사용할 닉네임을 정해주세요</p>
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleNicknameSubmit(); }}
                placeholder="예: 파티왕김씨"
                maxLength={20}
                className="w-full bg-white/5 text-white text-sm px-4 py-3 rounded-xl outline-none placeholder-white/20"
                style={{ border: "1px solid rgba(0,229,255,0.3)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.6)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)")}
              />
              <button
                onClick={() => setNicknameInput(randomNickname())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none hover:scale-110 transition-transform"
                title="랜덤 닉네임"
              >
                🎲
              </button>
            </div>
            <button
              onClick={handleNicknameSubmit}
              disabled={!nicknameInput.trim()}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }}
            >
              파티 입장하기 🎉
            </button>
          </div>
        </div>
      )}
    </>
  );
}
