"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#FF8C00";
const ACCENT2 = "#FFD700";

const MOCK_ROOMS = [
  { id: "v1", title: "진실or거짓 파티 🏆", host: "게임마스터K", hostAvatar: "👑", gameType: "진실or거짓", participants: 8, maxParticipants: 10, tags: ["#파티", "#게임", "#퀴즈"], vibe: "🎉 신나는", isLive: true },
  { id: "v2", title: "스피드퀴즈 파티 ⚡", host: "번개퀴즈왕", hostAvatar: "⚡", gameType: "스피드퀴즈", participants: 6, maxParticipants: 8, tags: ["#파티", "#스피드"], vibe: "🔥 열정적", isLive: true },
  { id: "v3", title: "몸으로 말해요! 파티 🎭", host: "마임아티스트", hostAvatar: "🎭", gameType: "몸으로말해요", participants: 10, maxParticipants: 12, tags: ["#파티", "#벌칙게임"], vibe: "🎉 신나는", isLive: true },
  { id: "v4", title: "연예인 토크 파티 🌟", host: "스타트래커", hostAvatar: "🌟", gameType: "진실or거짓", participants: 5, maxParticipants: 8, tags: ["#파티", "#연예인"], vibe: "😊 편안함", isLive: true },
  { id: "v5", title: "직장인 해방 파티 😤", host: "오피스워리어", hostAvatar: "💼", gameType: "스피드퀴즈", participants: 4, maxParticipants: 6, tags: ["#파티", "#직장인"], vibe: "🔥 열정적", isLive: false },
  { id: "v6", title: "커플 미션 파티 💑", host: "러브게임단", hostAvatar: "💑", gameType: "몸으로말해요", participants: 6, maxParticipants: 8, tags: ["#파티", "#커플"], vibe: "😊 편안함", isLive: true },
];

const GAME_TYPES = ["스피드퀴즈", "진실or거짓", "몸으로말해요"];
const GAME_ICONS: Record<string, string> = { "스피드퀴즈": "⚡", "진실or거짓": "🤔", "몸으로말해요": "🎭" };

export default function VarietyLobbyPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [gameType, setGameType] = useState("스피드퀴즈");
  const [maxP, setMaxP] = useState(8);
  const [filter, setFilter] = useState("전체");
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch("/api/rooms/list?type=variety")
      .then((r) => r.json())
      .then((data) => { if (data.rooms?.length) setRooms(data.rooms); })
      .catch((err) => console.error("Failed to load rooms:", err));
  }, []);

  const handleCreateRoom = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type: "variety", maxParticipants: maxP, isPrivate: false }),
      });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/rooms/variety/${data.roomId}`);
      } else {
        setCreateError(data.error ?? "방 만들기 실패");
      }
    } catch {
      setCreateError("네트워크 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const totalPlayers = rooms.reduce((s, r) => s + (r.participants ?? 0), 0);
  const filtered = filter === "전체" ? rooms : rooms.filter((r) => r.gameType === filter || r.tags.some((t) => t.includes(filter.replace("#", ""))));

  return (
    <div className="min-h-screen bg-[#070707] relative overflow-hidden">
      {/* BG blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)`, filter: "blur(80px)", animation: "float-blob 12s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${ACCENT2} 0%, transparent 70%)`, filter: "blur(80px)", animation: "float-blob 16s ease-in-out infinite reverse" }} />
      </div>

      <Link href="/" className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 backdrop-blur-md border border-white/10 hover:border-orange-400/50 transition-all" style={{ color: ACCENT }}>
        ← L&apos;OXYGÈNE
      </Link>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-white/40 text-xs tracking-[0.35em] uppercase mb-3">L&apos;Oxygène Presents</p>
          <h1 className="text-5xl font-black tracking-widest mb-3"
            style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}, 0 0 60px rgba(255,140,0,0.4)`, letterSpacing: "0.18em" }}>
            VARIETY SHOW
          </h1>
          <p className="text-white/45 text-base mb-6">방구석 버라이어티</p>
          <div className="inline-flex items-center gap-2.5 bg-white/[0.03] border px-5 py-2.5 rounded-full" style={{ borderColor: `${ACCENT}30` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, animation: "pulse-neon 1.5s ease-in-out infinite" }} />
            <span className="text-white/75 text-sm">현재 <span className="font-bold" style={{ color: ACCENT }}>{totalPlayers}</span>명 게임 중</span>
          </div>
        </div>

        {/* Filters + Create */}
        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {["전체", "스피드퀴즈", "진실or거짓", "몸으로말해요"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm transition-all"
                style={filter === f
                  ? { background: `rgba(255,140,0,0.18)`, border: `1px solid ${ACCENT}60`, color: ACCENT }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                {f !== "전체" && <span className="mr-1">{GAME_ICONS[f]}</span>}{f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: `rgba(255,140,0,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT, boxShadow: `0 0 15px rgba(255,140,0,0.2)` }}>
            <Icon icon="solar:add-circle-bold" className="w-4 h-4" /> 방 만들기
          </button>
        </div>

        {/* Room grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(room => (
            <div key={room.id} className="group rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.01]"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {room.isLive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,50,50,0.18)", border: "1px solid rgba(255,50,50,0.4)", color: "#ff5555" }}>LIVE</span>
                    )}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `rgba(255,140,0,0.12)`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
                      {GAME_ICONS[room.gameType]} {room.gameType}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight group-hover:text-orange-400 transition-colors">{room.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1"><Icon icon="solar:user-bold" className="text-white/30 w-3 h-3" /><span className="text-white/40 text-xs">{room.host}</span></div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs font-bold" style={{ color: room.participants >= room.maxParticipants ? "#ff5555" : "#22c55e" }}>
                    {room.participants}/{room.maxParticipants}명
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {room.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>{t}</span>
                ))}
              </div>

              <Link href={`/rooms/variety/${room.id}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: `rgba(255,140,0,0.12)`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
                입장하기 →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5" style={{ background: "rgba(12,12,14,0.98)", border: "1px solid rgba(255,140,0,0.25)", boxShadow: "0 0 60px rgba(255,140,0,0.15)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">🎮 새 게임방 만들기</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white/60 transition-colors"><Icon icon="solar:close-circle-bold" className="w-6 h-6" /></button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 tracking-wider">방 제목</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 우리 팀 퀴즈 배틀!"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", caretColor: ACCENT }} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 tracking-wider">게임 타입</label>
              <div className="grid grid-cols-3 gap-2">
                {GAME_TYPES.map(g => (
                  <button key={g} onClick={() => setGameType(g)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all"
                    style={gameType === g
                      ? { background: `rgba(255,140,0,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                    <span className="text-xl">{GAME_ICONS[g]}</span>{g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 tracking-wider">최대 참여 인원: <span style={{ color: ACCENT }}>{maxP}명</span></label>
              <input type="range" min={4} max={20} value={maxP} onChange={e => setMaxP(Number(e.target.value))} className="w-full" />
            </div>

            {createError && <p className="text-xs text-red-400">{createError}</p>}
            <button onClick={handleCreateRoom} disabled={creating}
              className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: `rgba(255,140,0,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
              {creating ? "생성 중..." : "🎮 방 만들기"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-blob { 0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-20px) scale(1.05)} }
        @keyframes pulse-neon { 0%,100%{opacity:1}50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
