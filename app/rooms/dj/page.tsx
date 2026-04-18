"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#06b6d4";
const ACCENT2 = "#0ea5e9";

const MOCK_ROOMS = [
  { id: "dj1", title: "하우스 파티 나이트 🏠", dj: "DJ Cyan", djAvatar: "🎧", genre: "하우스", bpm: 128, listeners: 94, tags: ["#파티", "#하우스", "#EDM"], vibe: "🔥 열정적", isLive: true },
  { id: "dj2", title: "테크노 언더그라운드 ⚡", dj: "DJ Matrix", djAvatar: "⚡", genre: "테크노", bpm: 145, listeners: 67, tags: ["#파티", "#테크노"], vibe: "🔥 열정적", isLive: true },
  { id: "dj3", title: "K-POP 리믹스 파티 🇰🇷", dj: "DJ Seoul", djAvatar: "🌸", genre: "K-POP", bpm: 122, listeners: 183, tags: ["#파티", "#KPOP"], vibe: "🎉 신나는", isLive: true },
  { id: "dj4", title: "칠아웃 Lo-Fi 파티 🌙", dj: "DJ Midnight", djAvatar: "🌙", genre: "Lo-Fi", bpm: 85, listeners: 41, tags: ["#파티", "#lofi", "#칠아웃"], vibe: "😊 편안함", isLive: true },
  { id: "dj5", title: "90s 레이브 파티 🕹️", dj: "DJ Retro", djAvatar: "🕹️", genre: "테크노", bpm: 138, listeners: 28, tags: ["#파티", "#90s"], vibe: "🎉 신나는", isLive: false },
  { id: "dj6", title: "Latin 파티 나이트 💃", dj: "DJ Salsa", djAvatar: "💃", genre: "Latin", bpm: 116, listeners: 55, tags: ["#파티", "#라틴"], vibe: "🎉 신나는", isLive: true },
];

const GENRE_COLORS: Record<string, string> = {
  "하우스": "#06b6d4", "테크노": "#6366f1", "K-POP": "#ec4899", "Lo-Fi": "#84cc16", "Latin": "#f59e0b",
};

export default function DJLobbyPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [djName, setDjName] = useState("");
  const [genre, setGenre] = useState("하우스");
  const [filter, setFilter] = useState("전체");

  const totalListeners = MOCK_ROOMS.reduce((s, r) => s + r.listeners, 0);
  const filtered = filter === "전체" ? MOCK_ROOMS : MOCK_ROOMS.filter(r => r.genre === filter || r.tags.some(t => t.includes(filter.replace("#", ""))));

  return (
    <div className="min-h-screen bg-[#070707] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-08"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)`, filter: "blur(100px)", animation: "float-blob 15s ease-in-out infinite" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-06"
          style={{ background: `radial-gradient(circle, ${ACCENT2} 0%, transparent 70%)`, filter: "blur(100px)", animation: "float-blob 20s ease-in-out infinite reverse" }} />
        {/* Matrix-style falling dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, ${ACCENT}40 30px, ${ACCENT}40 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, ${ACCENT}40 30px, ${ACCENT}40 31px)` }} />
      </div>

      <Link href="/" className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 backdrop-blur-md border border-white/10 transition-all" style={{ color: ACCENT }}>
        ← L&apos;OXYGÈNE
      </Link>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-20">
        <div className="text-center mb-12">
          <p className="text-white/40 text-xs tracking-[0.35em] uppercase mb-3">L&apos;Oxygène Presents</p>
          <h1 className="text-5xl font-black tracking-widest mb-3"
            style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}, 0 0 60px rgba(6,182,212,0.5)`, letterSpacing: "0.2em" }}>
            DJ BOOTH
          </h1>
          <p className="text-white/45 text-base mb-6">방구석 DJ</p>
          <div className="inline-flex items-center gap-2.5 bg-white/[0.03] border px-5 py-2.5 rounded-full" style={{ borderColor: `${ACCENT}30` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, animation: "pulse-neon 1.5s ease-in-out infinite" }} />
            <span className="text-white/75 text-sm">현재 <span className="font-bold" style={{ color: ACCENT }}>{totalListeners}</span>명 청취 중</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {["전체", "하우스", "테크노", "K-POP", "Lo-Fi", "Latin"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm transition-all"
                style={filter === f
                  ? { background: `rgba(6,182,212,0.18)`, border: `1px solid ${ACCENT}60`, color: ACCENT }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: `rgba(6,182,212,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT, boxShadow: `0 0 15px rgba(6,182,212,0.25)` }}>
            <Icon icon="solar:add-circle-bold" className="w-4 h-4" /> 부스 오픈
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(room => (
            <div key={room.id} className="group rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
              {/* DJ avatar + badges */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {room.djAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {room.isLive
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>🔴 LIVE</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full text-white/25" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>예정</span>
                    }
                    <span className="text-[10px] text-white/35">{room.vibe}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight group-hover:text-cyan-400 transition-colors">{room.title}</h3>
                  <p className="text-white/40 text-xs mt-0.5">DJ · {room.dj}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-base font-black tabular-nums" style={{ color: ACCENT }}>{room.bpm}</div>
                  <div className="text-[9px] text-white/30">BPM</div>
                </div>
              </div>

              {/* Avatar stack + listeners */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {["👤","😊","🎵"].map((a, i) => (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(7,7,7,0.9)" }}>{a}</div>
                  ))}
                </div>
                <span className="text-xs text-white/40">+{room.listeners}명</span>
              </div>

              {/* Tags */}
              <div className="flex gap-1 flex-wrap">
                {room.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: `${GENRE_COLORS[room.genre] ?? ACCENT}12`, color: `${GENRE_COLORS[room.genre] ?? ACCENT}cc`, border: `1px solid ${GENRE_COLORS[room.genre] ?? ACCENT}30` }}>{t}</span>
                ))}
              </div>

              <Link href={`/rooms/dj/${room.id}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: `rgba(6,182,212,0.12)`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
                파티 입장 →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5" style={{ background: "rgba(4,10,18,0.98)", border: `1px solid ${ACCENT}30`, boxShadow: `0 0 60px rgba(6,182,212,0.15)` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">🎧 DJ 부스 오픈</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white/60"><Icon icon="solar:close-circle-bold" className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 tracking-wider">DJ 이름</label>
              <input value={djName} onChange={e => setDjName(e.target.value)} placeholder="예: DJ Loxygène"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", caretColor: ACCENT }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 tracking-wider">장르</label>
              <div className="grid grid-cols-3 gap-2">
                {["하우스", "테크노", "K-POP", "Lo-Fi", "Latin", "기타"].map(g => (
                  <button key={g} onClick={() => setGenre(g)}
                    className="py-2 rounded-xl text-xs font-medium transition-all"
                    style={genre === g ? { background: `rgba(6,182,212,0.18)`, border: `1px solid ${ACCENT}50`, color: ACCENT } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowCreate(false)}
              className="w-full py-3 rounded-xl font-bold transition-all active:scale-95"
              style={{ background: `rgba(6,182,212,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
              🎧 부스 오픈
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-blob{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-20px) scale(1.05)}}
        @keyframes pulse-neon{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </div>
  );
}
