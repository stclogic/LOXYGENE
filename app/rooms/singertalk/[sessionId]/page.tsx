"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TOTAL_SECONDS = 5 * 60; // 5:00
const EXTENSION_COST = 100;

const MOCK_SONGS = [
  { id: "s1", title: "사랑했지만", artist: "김광석", duration: "4:23" },
  { id: "s2", title: "첫눈처럼 너에게 가겠다", artist: "에일리", duration: "3:51" },
  { id: "s3", title: "너에게 난, 나에게 넌", artist: "거미", duration: "4:07" },
  { id: "s4", title: "Dynamite", artist: "BTS", duration: "3:19" },
  { id: "s5", title: "Celebrity", artist: "아이유", duration: "3:31" },
];

type Modal = "none" | "song" | "timesup";

interface FloatingHeart {
  id: number;
  x: number;
}

export default function CyberPochaRoomPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [voiceChanger, setVoiceChanger] = useState(false);
  const [activeModal, setActiveModal] = useState<Modal>("none");
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [selectedSong, setSelectedSong] = useState<(typeof MOCK_SONGS)[0] | null>(null);
  const [songQuery, setSongQuery] = useState("");
  const [extensionSent, setExtensionSent] = useState(false);
  const [extensionAccepted, setExtensionAccepted] = useState(false);
  const [timesUpCountdown, setTimesUpCountdown] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer tick
  useEffect(() => {
    if (activeModal === "timesup") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setActiveModal("timesup");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [activeModal]);

  // Times-up 3s auto-dismiss
  useEffect(() => {
    if (activeModal !== "timesup") return;
    setTimesUpCountdown(3);
    const t = setInterval(() => {
      setTimesUpCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          router.push("/rooms/singertalk");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [activeModal, router]);

  const handleExtension = () => {
    setExtensionSent(true);
    setTimeout(() => {
      setExtensionAccepted(true);
      setSecondsLeft((s) => s + TOTAL_SECONDS);
      setExtensionSent(false);
      setTimeout(() => setExtensionAccepted(false), 2000);
    }, 1500);
  };

  const sendHeart = useCallback(() => {
    const newHeart: FloatingHeart = { id: Date.now(), x: Math.random() * 60 + 20 };
    setHearts((h) => [...h, newHeart]);
    setTimeout(() => setHearts((h) => h.filter((hh) => hh.id !== newHeart.id)), 1500);
  }, []);

  const sendGift = () => {
    sendHeart();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerPct = (secondsLeft / TOTAL_SECONDS) * 100;
  const isUrgent = secondsLeft <= 30;
  const isLow = secondsLeft <= 60;
  const timerColor = isUrgent ? "#FF007F" : isLow ? "#FF8C00" : "#00E5FF";

  const filteredSongs = MOCK_SONGS.filter(
    (s) =>
      songQuery === "" ||
      s.title.toLowerCase().includes(songQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(songQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#070707] flex flex-col overflow-hidden">
      {/* Home button */}
      <Link
        href="/"
        className="fixed top-3 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00E5FF] bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#00E5FF]/50 transition-all"
      >
        ← L&apos;OXYGÈNE
      </Link>

      {/* Extension accepted toast */}
      {extensionAccepted && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap"
          style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", color: "#FFD700" }}>
          ✓ 시간이 5분 연장됐습니다!
        </div>
      )}

      {/* Extension sent toast */}
      {extensionSent && !extensionAccepted && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
          상대방에게 연장 요청을 보냈습니다...
        </div>
      )}

      {/* Currently playing song banner */}
      {selectedSong && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap"
          style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", backdropFilter: "blur(12px)" }}>
          <Icon icon="solar:music-notes-bold" className="w-3.5 h-3.5 text-[#00E5FF] animate-neon-pulse" />
          <span className="text-[#00E5FF] text-xs font-bold">{selectedSong.title}</span>
          <span className="text-white/40 text-xs">— {selectedSong.artist}</span>
          <button onClick={() => setSelectedSong(null)} className="text-white/30 hover:text-white/70 ml-1">
            <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/*
        Split screen:
        - Mobile: flex-col (top = me, bottom = partner)
        - Desktop: flex-row (left = me, right = partner)
      */}
      <div className="relative flex flex-col sm:flex-row flex-1 min-h-0">

        {/* My video — LEFT/TOP */}
        <div className="relative flex-1 min-h-0 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0a0a14, #050508)" }}>
          {/* Simulated video content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)" }}>
              😶
            </div>
          </div>

          {/* Camera off overlay */}
          {!isCamOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: "rgba(0,0,0,0.85)" }}>
              <Icon icon="solar:camera-slash-bold" className="w-10 h-10 text-white/20" />
              <span className="text-white/30 text-xs">카메라 꺼짐</span>
            </div>
          )}

          {/* Label */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: "rgba(0,0,0,0.7)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.3)" }}>
              나
            </span>
            <div className="flex items-center gap-1">
              <Icon icon={isMicOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
                className="w-3.5 h-3.5"
                style={{ color: isMicOn ? "#00E5FF" : "#ff5555" }} />
              <Icon icon={isCamOn ? "solar:camera-bold" : "solar:camera-slash-bold"}
                className="w-3.5 h-3.5"
                style={{ color: isCamOn ? "#00E5FF" : "#ff5555" }} />
            </div>
          </div>

          {/* Grid overlay when song active */}
          {selectedSong && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          )}
        </div>

        {/* TIME-ATTACK BAR — divider between screens */}
        <div className="relative flex items-center sm:flex-col sm:items-center justify-center
                        h-9 sm:h-auto sm:w-9
                        shrink-0 z-20 overflow-hidden"
          style={{ background: "rgba(7,7,7,0.9)" }}>
          {/* Progress track */}
          <div className="relative sm:hidden w-full h-1 bg-white/5 rounded-full overflow-hidden mx-3">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
                boxShadow: isUrgent ? `0 0 8px ${timerColor}` : undefined,
                animation: isUrgent ? "pulse-neon 1s ease-in-out infinite" : undefined,
              }}
            />
          </div>

          {/* Vertical track (desktop) */}
          <div className="hidden sm:block relative h-full w-1 bg-white/5 rounded-full overflow-hidden my-3">
            <div
              className="absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000"
              style={{
                height: `${timerPct}%`,
                background: timerColor,
                boxShadow: isUrgent ? `0 0 8px ${timerColor}` : undefined,
                animation: isUrgent ? "pulse-neon 1s ease-in-out infinite" : undefined,
              }}
            />
          </div>

          {/* Timer label */}
          <span
            className="absolute text-[11px] font-black tabular-nums"
            style={{ color: timerColor, textShadow: `0 0 8px ${timerColor}80` }}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>

        {/* Partner video — RIGHT/BOTTOM */}
        <div className="relative flex-1 min-h-0 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0a080e, #060406)" }}>
          {/* Floating hearts */}
          {hearts.map((h) => (
            <div
              key={h.id}
              className="absolute text-2xl pointer-events-none"
              style={{
                bottom: "20%",
                left: `${h.x}%`,
                animation: "float-heart 1.4s ease-out forwards",
              }}
            >
              ❤️
            </div>
          ))}

          {/* Simulated partner content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: "rgba(255,0,127,0.08)", border: "1px solid rgba(255,0,127,0.15)" }}>
              🐰
            </div>
          </div>

          {/* Partner label */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Icon icon="solar:microphone-bold" className="w-3.5 h-3.5" style={{ color: "#FF007F" }} />
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: "rgba(0,0,0,0.7)", color: "#FF007F", border: "1px solid rgba(255,0,127,0.3)" }}>
              상대방
            </span>
          </div>

          {/* Speaker glow when active */}
          <div className="absolute inset-0 pointer-events-none rounded-none"
            style={{ boxShadow: "inset 0 0 40px rgba(255,0,127,0.05)" }} />
        </div>
      </div>

      {/* Interaction panel */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-4 py-2.5 shrink-0"
        style={{ background: "rgba(7,7,7,0.95)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <button
          onClick={() => setActiveModal("song")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "#00E5FF" }}
        >
          <span>🎵</span>
          <span className="hidden sm:inline">노래 같이하기</span>
        </button>
        <button
          onClick={sendHeart}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff6b6b" }}
        >
          <span>❤️</span>
          <span className="hidden sm:inline">좋아요</span>
        </button>
        <button
          onClick={sendGift}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.3)", color: "#FF007F" }}
        >
          <span>🎁</span>
          <span className="hidden sm:inline">선물하기</span>
        </button>
      </div>

      {/* Bottom action bar */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{ background: "rgba(7,7,7,0.98)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>

        {/* Mic */}
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className="relative flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95"
          style={{
            background: isMicOn ? "rgba(0,229,255,0.12)" : "rgba(255,50,50,0.1)",
            border: isMicOn ? "1px solid rgba(0,229,255,0.35)" : "1px solid rgba(255,50,50,0.3)",
          }}
        >
          <Icon
            icon={isMicOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
            className="w-5 h-5"
            style={{ color: isMicOn ? "#00E5FF" : "#ff5555" }}
          />
          <span className="text-[9px] leading-none" style={{ color: isMicOn ? "#00E5FF" : "#ff5555" }}>
            마이크
          </span>
          {/* Voice changer badge */}
          {isMicOn && voiceChanger && (
            <span className="absolute -top-1.5 -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: "#FF007F", color: "white" }}>
              🎭변조
            </span>
          )}
        </button>

        {/* Cam */}
        <button
          onClick={() => setIsCamOn(!isCamOn)}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95"
          style={{
            background: isCamOn ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.04)",
            border: isCamOn ? "1px solid rgba(0,229,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Icon
            icon={isCamOn ? "solar:camera-bold" : "solar:camera-slash-bold"}
            className="w-5 h-5"
            style={{ color: isCamOn ? "#00E5FF" : "rgba(255,255,255,0.4)" }}
          />
          <span className="text-[9px] leading-none text-white/50">카메라</span>
        </button>

        {/* Voice changer toggle */}
        <button
          onClick={() => setVoiceChanger(!voiceChanger)}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95"
          style={{
            background: voiceChanger ? "rgba(255,0,127,0.12)" : "rgba(255,255,255,0.04)",
            border: voiceChanger ? "1px solid rgba(255,0,127,0.35)" : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-base leading-none">🎭</span>
          <span className="text-[9px] leading-none" style={{ color: voiceChanger ? "#FF007F" : "rgba(255,255,255,0.4)" }}>
            변조
          </span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Time extension — only when low */}
        {isLow && (
          <button
            onClick={handleExtension}
            disabled={extensionSent}
            className="flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: "rgba(255,165,0,0.12)",
              border: "1px solid rgba(255,165,0,0.4)",
              animation: isUrgent ? "pulse-glow-amber 2s ease-in-out infinite" : undefined,
            }}
          >
            <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] leading-none text-amber-400/80">연장</span>
            <span className="text-[8px] leading-none text-amber-400/60">100 O₂</span>
          </button>
        )}

        {/* Skip */}
        <button
          onClick={() => router.push("/rooms/singertalk")}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Icon icon="solar:skip-next-bold" className="w-5 h-5 text-white/40" />
          <span className="text-[9px] leading-none text-white/30">다음</span>
        </button>

        {/* Report */}
        <button
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95"
          style={{ background: "rgba(255,50,50,0.05)", border: "1px solid rgba(255,50,50,0.12)" }}
        >
          <Icon icon="solar:flag-bold" className="w-4 h-4 text-red-500/40" />
          <span className="text-[9px] leading-none text-red-500/40">신고</span>
        </button>
      </div>

      {/* Song search modal */}
      {activeModal === "song" && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal("none"); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 flex flex-col gap-4 max-h-[80vh]"
            style={{ background: "rgba(10,10,15,0.98)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 40px rgba(0,229,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-base">🎵 노래 같이하기</h2>
              <button onClick={() => setActiveModal("none")} className="text-white/30 hover:text-white/70">
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Icon icon="solar:magnifer-bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={songQuery}
                onChange={(e) => setSongQuery(e.target.value)}
                placeholder="노래 제목 또는 아티스트 검색"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)" }}>
                    <Icon icon="solar:music-note-bold" className="w-4 h-4 text-[#00E5FF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold truncate">{song.title}</p>
                    <p className="text-white/40 text-xs">{song.artist} · {song.duration}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedSong(song); setActiveModal("none"); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex-shrink-0"
                    style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}
                  >
                    같이 부르기
                  </button>
                </div>
              ))}
              {filteredSongs.length === 0 && (
                <div className="text-center py-8 text-white/20 text-sm">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Times up overlay */}
      {activeModal === "timesup" && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
        >
          <div className="text-6xl mb-2">👋</div>
          <h2 className="text-white font-black text-2xl text-center tracking-wide">즐거우셨나요?</h2>
          <p className="text-white/40 text-sm">{timesUpCountdown}초 후 자동으로 이동합니다</p>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => router.push("/rooms/singertalk")}
              className="px-6 py-3 rounded-xl font-black text-sm tracking-wider transition-all active:scale-95"
              style={{ background: "rgba(255,0,127,0.2)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F", boxShadow: "0 0 20px rgba(255,0,127,0.2)" }}
            >
              다음 매칭
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              오늘은 여기까지
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-heart {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-80px) scale(1.4); opacity: 0; }
        }
        @keyframes pulse-glow-amber {
          0%, 100% { box-shadow: 0 0 10px rgba(255,165,0,0.3); border-color: rgba(255,165,0,0.4); }
          50% { box-shadow: 0 0 20px rgba(255,165,0,0.6); border-color: rgba(255,165,0,0.8); }
        }
      `}</style>
    </div>
  );
}
