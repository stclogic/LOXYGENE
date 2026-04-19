"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import Link from "next/link";

const HomeButton = () => (
  <Link
    href="/"
    className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00E5FF] bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#00E5FF]/50 transition-all"
  >
    ← L&apos;OXYGÈNE
  </Link>
);

const MOCK_ROOMS = [
  {
    id: "room-001",
    title: "90년대 감성 파티 🎵",
    hostName: "별빛가수",
    hostAvatar: "🌟",
    participantCount: 127,
    viewerCount: 124,
    topGiftAmount: 8400,
    tags: ["#파티", "#90년대", "#감성"],
    vibe: "🎉 신나는",
    isLive: true,
  },
  {
    id: "room-002",
    title: "K-POP 파티 나이트 🎤",
    hostName: "노래왕자",
    hostAvatar: "👑",
    participantCount: 89,
    viewerCount: 89,
    topGiftAmount: 5200,
    tags: ["#파티", "#KPOP", "#댄스"],
    vibe: "🔥 열정적",
    isLive: true,
  },
  {
    id: "room-003",
    title: "트로트 칵테일파티 🌟",
    hostName: "달빛선율",
    hostAvatar: "🌙",
    participantCount: 67,
    viewerCount: 67,
    topGiftAmount: 12000,
    tags: ["#칵테일파티", "#트로트"],
    vibe: "😊 편안함",
    isLive: true,
  },
  {
    id: "room-004",
    title: "인디 하우스파티 🎸",
    hostName: "가을바람",
    hostAvatar: "🍂",
    participantCount: 43,
    viewerCount: 43,
    topGiftAmount: 2800,
    tags: ["#하우스파티", "#인디", "#감성"],
    vibe: "😊 편안함",
    isLive: true,
  },
  {
    id: "room-005",
    title: "재즈 나이트 파티 🎷",
    hostName: "봄날의꿈",
    hostAvatar: "🌸",
    participantCount: 31,
    viewerCount: 31,
    topGiftAmount: 6600,
    tags: ["#나이트파티", "#재즈"],
    vibe: "🎉 신나는",
    isLive: true,
  },
  {
    id: "room-006",
    title: "힙합 크루 파티 🔥",
    hostName: "여름밤",
    hostAvatar: "🌊",
    participantCount: 78,
    viewerCount: 78,
    topGiftAmount: 3100,
    tags: ["#크루파티", "#힙합", "#사이퍼"],
    vibe: "🔥 열정적",
    isLive: false,
  },
];

interface CreateRoomForm {
  title: string;
  tags: string;
  maxParticipants: number;
  hasPassword: boolean;
  password: string;
}

export default function ColosseumLobbyPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateRoomForm>({
    title: "",
    tags: "",
    maxParticipants: 10,
    hasPassword: false,
    password: "",
  });
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch("/api/rooms/list?type=colosseum")
      .then((r) => r.json())
      .then((data) => { if (data.rooms?.length) setRooms(data.rooms); })
      .catch((err) => console.error("Failed to load rooms:", err));
  }, []);

  const handleCreateRoom = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: "colosseum",
          maxParticipants: form.maxParticipants,
          isPrivate: form.hasPassword,
          password: form.hasPassword ? form.password : undefined,
        }),
      });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/rooms/colosseum/${data.roomId}`);
      } else {
        setCreateError(data.error ?? "방 만들기 실패");
      }
    } catch {
      setCreateError("네트워크 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const totalUsers = rooms.reduce((sum, r) => sum + (r.participantCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#070707] relative overflow-hidden">
      <HomeButton />
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "float-blob 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #FF007F 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "float-blob 12s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-32">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <p className="text-white/40 text-sm tracking-[0.3em] uppercase font-light">L'Oxygène</p>
          </div>
          <h1
            className="text-5xl font-black tracking-widest text-[#00E5FF] mb-3"
            style={{
              textShadow: "0 0 20px #00E5FF, 0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2)",
              letterSpacing: "0.2em",
            }}
          >
            THE COLOSSEUM
          </h1>
          <p className="text-white/50 text-base mb-6">방구석 가왕의 무대</p>

          {/* Live count badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/[0.03] border border-[#FF007F]/20 px-5 py-2.5 rounded-full">
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#FF007F]"
              style={{
                boxShadow: "0 0 8px #FF007F",
                animation: "pulse-neon 1.5s ease-in-out infinite",
              }}
            />
            <span className="text-white/80 text-sm font-medium">
              현재 <span className="text-[#FF007F] font-bold">{totalUsers.toLocaleString()}</span>명 접속 중
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {["전체", "발라드", "K-POP", "트로트", "힙합", "재즈", "인디"].map((tab, i) => (
            <button
              key={tab}
              className="px-4 py-1.5 rounded-full text-sm transition-all duration-200"
              style={
                i === 0
                  ? {
                      background: "rgba(0,229,255,0.15)",
                      border: "1px solid rgba(0,229,255,0.4)",
                      color: "#00E5FF",
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.5)",
                    }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Rooms grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_ROOMS.map((room) => (
            <GlassCard key={room.id} className="p-5 flex flex-col gap-3 hover:border-white/10 transition-all duration-300 group">
              {/* Host + LIVE badge */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {room.hostAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {room.isLive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
                        🔴 LIVE
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-white/25"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        예정
                      </span>
                    )}
                    <span className="text-[10px] text-white/35 truncate">{room.vibe}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight group-hover:text-[#00E5FF] transition-colors truncate">
                    {room.title}
                  </h3>
                  <p className="text-white/40 text-xs mt-0.5">호스트 · {room.hostName}</p>
                </div>
              </div>

              {/* Participant avatar stack + count */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {["👤","😊","🎵"].map((a, i) => (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(7,7,7,0.9)" }}>
                      {a}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-white/40">+{room.participantCount}명</span>
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-[10px]">💐</span>
                  <span className="text-[#FF007F] text-[10px] font-bold">{room.topGiftAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {room.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.12)", color: "rgba(0,229,255,0.65)" }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-auto pt-1">
                <Link href={`/rooms/colosseum/${room.id}`} className="flex-1">
                  <NeonButton variant="cyan" size="sm" fullWidth>파티 입장</NeonButton>
                </Link>
                <Link href={`/rooms/colosseum/${room.id}?spectate=true`} className="flex-1">
                  <NeonButton variant="ghost" size="sm" fullWidth>관전</NeonButton>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Floating create button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-white z-30 transition-all duration-200 active:scale-95 hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #FF007F, #cc0066)",
          boxShadow: "0 0 20px rgba(255,0,127,0.5), 0 0 40px rgba(255,0,127,0.2)",
        }}
      >
        <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
        방 만들기
      </button>

      {/* Create room modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <GlassCard className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">방 만들기</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Room title */}
              <div>
                <label className="block text-white/60 text-sm mb-2 font-medium">방 제목</label>
                <input
                  type="text"
                  placeholder="예: 오늘 밤 발라드 파티 🎵"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(0,229,255,0.4)";
                    e.target.style.boxShadow = "0 0 10px rgba(0,229,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-white/60 text-sm mb-2 font-medium">
                  태그 <span className="text-white/30 font-normal">(쉼표로 구분)</span>
                </label>
                <input
                  type="text"
                  placeholder="발라드, 90년대, 감성"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(0,229,255,0.4)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                  }}
                />
              </div>

              {/* Max participants slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/60 text-sm font-medium">최대 참여자 수</label>
                  <span className="text-[#00E5FF] font-bold text-sm">{form.maxParticipants}명</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={50}
                  value={form.maxParticipants}
                  onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                  className="w-full accent-[#00E5FF]"
                  style={{ accentColor: "#00E5FF" }}
                />
                <div className="flex justify-between text-white/20 text-xs mt-1">
                  <span>2</span>
                  <span>50</span>
                </div>
              </div>

              {/* Password toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">비밀번호 설정</p>
                  <p className="text-white/30 text-xs mt-0.5">비공개 방으로 만들기</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, hasPassword: !form.hasPassword })}
                  className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                  style={{
                    background: form.hasPassword
                      ? "rgba(0,229,255,0.6)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
                    style={{ left: form.hasPassword ? "calc(100% - 20px)" : "4px" }}
                  />
                </button>
              </div>

              {form.hasPassword && (
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              )}

              {createError && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {createError}
                </p>
              )}
              {/* Submit */}
              <NeonButton
                variant="pink"
                size="lg"
                fullWidth
                onClick={handleCreateRoom}
                disabled={creating}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                  {creating ? "생성 중..." : "방 개설하기"}
                </div>
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
