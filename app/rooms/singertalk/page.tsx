"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INTEREST_TAGS = [
  { id: "ballad", label: "#발라드" },
  { id: "pop", label: "#팝" },
  { id: "hiphop", label: "#힙합" },
  { id: "jazz", label: "#재즈" },
  { id: "trot", label: "#트로트" },
  { id: "chat", label: "#잡담" },
  { id: "advice", label: "#고민상담" },
  { id: "random", label: "#랜덤" },
];

const AVATARS = [
  { id: "default", label: "기본", emoji: "😶" },
  { id: "rabbit", label: "토끼", emoji: "🐰" },
  { id: "fox", label: "여우", emoji: "🦊" },
];

type MatchMode = "song" | "casual";
type Screen = "lobby" | "checklist" | "matching";

export default function SingerTalkLobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<MatchMode>("song");
  const [selectedTags, setSelectedTags] = useState<string[]>(["ballad", "random"]);
  const [screen, setScreen] = useState<Screen>("lobby");

  // Checklist state
  const [voiceChanger, setVoiceChanger] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("default");

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleMatchConfirm = () => {
    setScreen("matching");
    setTimeout(() => {
      router.push("/rooms/singertalk/session-1");
    }, 3000);
  };

  if (screen === "matching") {
    return <MatchingScreen onCancel={() => setScreen("lobby")} />;
  }

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col overflow-x-hidden">
      {/* Home button */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00E5FF] bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#00E5FF]/50 transition-all"
      >
        ← L&apos;OXYGÈNE
      </Link>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #FF007F 0%, transparent 70%)", filter: "blur(100px)", animation: "float-blob 12s ease-in-out infinite" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #FF007F 0%, transparent 70%)", filter: "blur(80px)", animation: "float-blob 16s ease-in-out infinite reverse" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-6 px-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,0,127,0.5))" }} />
          <span className="text-2xl">🍺</span>
          <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,0,127,0.5))" }} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-widest uppercase mb-2"
          style={{ color: "#FF007F", textShadow: "0 0 20px rgba(255,0,127,0.7), 0 0 40px rgba(255,0,127,0.3)" }}>
          SINGER TALK
        </h1>
        <p className="text-white/50 text-sm sm:text-base text-center leading-relaxed">
          낯선 누군가와, 지금 이 순간.<br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>1:1 라이브 포차
        </p>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 pb-16 max-w-lg mx-auto w-full">

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => setMode("song")}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 active:scale-95"
            style={
              mode === "song"
                ? { background: "rgba(0,229,255,0.1)", border: "2px solid rgba(0,229,255,0.6)", boxShadow: "0 0 20px rgba(0,229,255,0.2)" }
                : { background: "rgba(255,255,255,0.02)", border: "2px solid rgba(255,255,255,0.06)" }
            }
          >
            <span className="text-2xl">🎤</span>
            <span className="font-black text-sm" style={{ color: mode === "song" ? "#00E5FF" : "rgba(255,255,255,0.5)" }}>
              노래 매칭
            </span>
            <span className="text-[11px] text-center leading-relaxed" style={{ color: mode === "song" ? "rgba(0,229,255,0.7)" : "rgba(255,255,255,0.3)" }}>
              같이 노래할 상대 찾기
            </span>
          </button>
          <button
            onClick={() => setMode("casual")}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 active:scale-95"
            style={
              mode === "casual"
                ? { background: "rgba(255,0,127,0.1)", border: "2px solid rgba(255,0,127,0.6)", boxShadow: "0 0 20px rgba(255,0,127,0.2)" }
                : { background: "rgba(255,255,255,0.02)", border: "2px solid rgba(255,255,255,0.06)" }
            }
          >
            <span className="text-2xl">💬</span>
            <span className="font-black text-sm" style={{ color: mode === "casual" ? "#FF007F" : "rgba(255,255,255,0.5)" }}>
              캐주얼 톡
            </span>
            <span className="text-[11px] text-center leading-relaxed" style={{ color: mode === "casual" ? "rgba(255,0,127,0.7)" : "rgba(255,255,255,0.3)" }}>
              그냥 얘기하고 싶을 때
            </span>
          </button>
        </div>

        {/* Live stats bar */}
        <div
          className="w-full grid grid-cols-3 gap-px rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { label: "현재 대기중", value: "124명", color: "#FF007F" },
            { label: "오늘 매칭", value: "3,847건", color: "#00E5FF" },
            { label: "평균 대화시간", value: "8분 32초", color: "#FFD700" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-3 px-2"
              style={{ background: "rgba(7,7,7,0.6)" }}>
              <span className="font-black text-sm sm:text-base" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-[10px] text-white/30 text-center">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Interest tags */}
        <div className="w-full">
          <p className="text-white/30 text-xs font-semibold tracking-wider mb-3">관심 태그 선택</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const active = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                  style={
                    active
                      ? { background: "rgba(255,0,127,0.2)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Match button */}
        <button
          onClick={() => setScreen("checklist")}
          className="w-full py-4 rounded-2xl font-black text-lg tracking-widest transition-all duration-200 active:scale-95"
          style={{
            background: "rgba(255,0,127,0.2)",
            border: "2px solid rgba(255,0,127,0.6)",
            color: "#FF007F",
            animation: "pulse-glow-pink 3s ease-in-out infinite",
          }}
        >
          <Icon icon="solar:magic-stick-bold" className="w-5 h-5 inline mr-2" />
          매칭 시작
        </button>
      </div>

      {/* Checklist modal */}
      {screen === "checklist" && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setScreen("lobby"); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "rgba(10,10,15,0.98)", border: "1px solid rgba(255,0,127,0.25)", boxShadow: "0 0 60px rgba(255,0,127,0.15)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-base tracking-wider">매칭 전 확인</h2>
              <button onClick={() => setScreen("lobby")} className="text-white/30 hover:text-white/70">
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>

            {/* Device checks */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.1)" }}>
                <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-[#00E5FF] flex-shrink-0" />
                <span className="text-white/80 text-sm">웹캠 정상</span>
                <span className="ml-auto text-[#00E5FF] text-xs font-bold">연결됨</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.1)" }}>
                <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-[#00E5FF] flex-shrink-0" />
                <span className="text-white/80 text-sm">마이크 정상</span>
                <span className="ml-auto text-[#00E5FF] text-xs font-bold">연결됨</span>
              </div>
            </div>

            {/* Voice changer toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🎭</span>
                <div>
                  <p className="text-white/80 text-sm font-semibold">음성 변조</p>
                  <p className="text-white/30 text-[11px]">목소리를 변조해 익명성 보호</p>
                </div>
              </div>
              <button
                onClick={() => setVoiceChanger(!voiceChanger)}
                className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                style={{ background: voiceChanger ? "rgba(255,0,127,0.5)" : "rgba(255,255,255,0.1)" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: voiceChanger ? "calc(100% - 18px)" : "2px" }}
                />
              </button>
            </div>

            {/* Avatar mask */}
            <div>
              <p className="text-white/30 text-xs font-semibold tracking-wider mb-2.5">아바타 마스크</p>
              <div className="grid grid-cols-3 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                    style={
                      selectedAvatar === av.id
                        ? { background: "rgba(255,0,127,0.15)", border: "1px solid rgba(255,0,127,0.5)" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }
                    }
                  >
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="text-[11px] font-semibold"
                      style={{ color: selectedAvatar === av.id ? "#FF007F" : "rgba(255,255,255,0.4)" }}>
                      {av.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleMatchConfirm}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all active:scale-95"
              style={{ background: "rgba(255,0,127,0.2)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F", boxShadow: "0 0 20px rgba(255,0,127,0.2)" }}
            >
              <Icon icon="solar:magic-stick-bold" className="w-4 h-4 inline mr-2" />
              매칭 시작!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchingScreen({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#070707] flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Scan line animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-x-0 h-0.5 opacity-30"
          style={{
            background: "linear-gradient(to right, transparent, #FF007F, transparent)",
            animation: "scan-line 2s linear infinite",
          }}
        />
      </div>

      {/* Neon grid bg */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,0,127,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,127,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Roulette spinner */}
      <div className="relative mb-10">
        {/* Outer rings */}
        <div className="absolute inset-0 rounded-full"
          style={{ border: "2px solid rgba(255,0,127,0.15)", transform: "scale(1.3)" }} />
        <div className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(255,0,127,0.08)", transform: "scale(1.6)" }} />

        {/* Spinner ring */}
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            border: "3px solid transparent",
            borderTopColor: "#FF007F",
            borderRightColor: "rgba(255,0,127,0.3)",
            animation: "spin 1s linear infinite",
            boxShadow: "0 0 30px rgba(255,0,127,0.4)",
          }}
        >
          {/* Inner ring counter-spin */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              border: "2px solid transparent",
              borderBottomColor: "#00E5FF",
              borderLeftColor: "rgba(0,229,255,0.3)",
              animation: "spin 0.7s linear infinite reverse",
            }}
          >
            <span className="text-3xl" style={{ animation: "spin 1.5s linear infinite" }}>🍺</span>
          </div>
        </div>
      </div>

      {/* Text */}
      <p className="text-white font-black text-lg tracking-wider mb-2"
        style={{ textShadow: "0 0 20px rgba(255,0,127,0.5)" }}>
        상대를 찾고 있습니다...
      </p>
      <p className="text-white/30 text-sm mb-10">잠시만 기다려주세요</p>

      {/* Dots */}
      <div className="flex gap-2 mb-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: "#FF007F",
              animation: `pulse-neon 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <button
        onClick={onCancel}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
      >
        취소
      </button>

      <style>{`
        @keyframes scan-line {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
