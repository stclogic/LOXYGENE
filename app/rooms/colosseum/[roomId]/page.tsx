"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { PartyRoomShell } from "@/components/room/PartyRoomShell";
import { hasNickname, setUserNickname, randomNickname, getUserNickname } from "@/lib/utils/userSession";
import { useDailyCall } from "@/hooks/useDailyCall";
import { useIsAdmin } from "@/hooks/useIsAdmin";

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

export default function ColosseumRoomPage({ params }: { params: { roomId: string } }) {
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [currentNickname, setCurrentNickname] = useState("게스트");
  const [dailyToken, setDailyToken] = useState("");
  const [dailyRoomUrl, setDailyRoomUrl] = useState("");
  const [role, setRole] = useState<string>("participant");
  const inputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = useIsAdmin();
  const { participants: dailyParticipants, toggleMic, toggleCamera } = useDailyCall(dailyRoomUrl, dailyToken);

  useEffect(() => {
    if (!hasNickname()) {
      setNicknameModalOpen(true);
    } else {
      setCurrentNickname(getUserNickname());
    }
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
        if (data.role) setRole(data.role);
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
    setCurrentNickname(name);
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
        dailyParticipants={dailyParticipants}
        roomId={params.roomId}
        nickname={currentNickname}
        isSuperAdmin={isSuperAdmin}
        role={role}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
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
