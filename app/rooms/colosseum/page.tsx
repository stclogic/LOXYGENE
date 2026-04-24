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
  const [rooms] = useState(MOCK_ROOMS);

  // THE COLOSSEUM은 고정 방송 방(room-001) 하나만 운영
  // DB에서 추가 방을 불러오지 않고 항상 room-001로 고정
  const refreshRooms = () => { /* room-001 고정 운영 */ };

  useEffect(() => { refreshRooms(); }, []);

  // 방 만들기 → 항상 room-001 입장
  const handleCreateRoom = () => {
    router.push("/rooms/colosseum/room-001");
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
          {rooms.length === 0 && (
            <div className="col-span-full text-center py-16 text-white/25 text-sm">
              아직 열린 방이 없어요. 첫 번째 방을 만들어보세요! 🎤
            </div>
          )}
          {rooms.map((room) => (
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
                <Link href="/rooms/colosseum/room-001" className="flex-1">
                  <NeonButton variant="cyan" size="sm" fullWidth>파티 입장</NeonButton>
                </Link>
                <Link href="/rooms/colosseum/room-001" className="flex-1">
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
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <GlassCard className="w-full max-w-sm p-7 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}>
              🎙️
            </div>
            <div>
              <h2 className="text-white font-black text-lg">THE COLOSSEUM</h2>
              <p className="text-white/40 text-sm mt-1.5">현재 단일 방송 방으로 운영 중입니다.<br />지금 바로 입장하시겠어요?</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                취소
              </button>
              <NeonButton variant="cyan" size="sm" fullWidth onClick={handleCreateRoom}>
                <div className="flex items-center justify-center gap-2">
                  <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
                  입장하기
                </div>
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
