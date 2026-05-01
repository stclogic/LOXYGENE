"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ColosseumYTRoom from "@/components/room/ColosseumYTRoom";
import { hasNickname, setUserNickname, getUserNickname, randomNickname } from "@/lib/utils/userSession";

export default function ColosseumYTPage({ params }: { params: { roomId: string } }) {
  const { data: session } = useSession();
  const [nicknameReady, setNicknameReady] = useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [currentNickname, setCurrentNickname] = useState("게스트");
  const inputRef = useRef<HTMLInputElement>(null);

  const isHost = !!(session?.user?.id);

  useEffect(() => {
    if (hasNickname()) {
      setCurrentNickname(getUserNickname());
      setNicknameReady(true);
    } else {
      setNicknameModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (nicknameModalOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [nicknameModalOpen]);

  const handleNicknameSubmit = () => {
    const name = nicknameInput.trim();
    if (!name) return;
    setUserNickname(name);
    setCurrentNickname(name);
    setNicknameModalOpen(false);
    setNicknameReady(true);
  };

  return (
    <>
      {nicknameReady && (
        <ColosseumYTRoom
          roomId={params.roomId}
          nickname={currentNickname}
          isHost={isHost}
        />
      )}

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
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNicknameSubmit(); }}
                placeholder="예: 파티왕김씨"
                maxLength={20}
                className="w-full bg-white/5 text-white text-sm px-4 py-3 rounded-xl outline-none placeholder-white/20"
                style={{ border: "1px solid rgba(0,229,255,0.3)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)")}
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
