"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#8B5CF6";
const ACCENT2 = "#C4B5FD";

const MOCK_ROOMS = [
  { id: "ts1", title: "요즘 연애가 어려운 이유", host: "철학자김씨", hostAvatar: "🎙️", topic: "연애", panels: 3, audience: 28, tags: ["#파티", "#연애", "#관계"], vibe: "😊 편안함", isLive: true },
  { id: "ts2", title: "30대의 인생 방향 토크", host: "인생설계사", hostAvatar: "🧭", topic: "인생", panels: 4, audience: 45, tags: ["#파티", "#인생", "#30대"], vibe: "😊 편안함", isLive: true },
  { id: "ts3", title: "취미로 먹고살 수 있을까?", host: "프리랜서A", hostAvatar: "🎨", topic: "취미", panels: 2, audience: 19, tags: ["#파티", "#취미"], vibe: "🎉 신나는", isLive: true },
  { id: "ts4", title: "직장 vs 창업, 당신의 선택은?", host: "스타트업러버", hostAvatar: "🚀", topic: "커리어", panels: 3, audience: 62, tags: ["#파티", "#커리어"], vibe: "🔥 열정적", isLive: true },
  { id: "ts5", title: "MZ세대 소통법 분석", host: "트렌드워처", hostAvatar: "📱", topic: "문화", panels: 4, audience: 33, tags: ["#파티", "#MZ"], vibe: "🎉 신나는", isLive: false },
  { id: "ts6", title: "결혼, 해야 할까? 말아야 할까?", host: "솔직한사람", hostAvatar: "💍", topic: "연애", panels: 3, audience: 57, tags: ["#파티", "#결혼"], vibe: "😊 편안함", isLive: true },
];

const TOPIC_COLORS: Record<string, string> = {
  "연애": "#ec4899", "인생": "#8B5CF6", "취미": "#06b6d4", "커리어": "#f59e0b", "문화": "#22c55e",
};

export default function TalkShowLobbyPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("연애");
  const [maxPanels, setMaxPanels] = useState(4);
  const [filter, setFilter] = useState("전체");

  const totalAudience = MOCK_ROOMS.reduce((s, r) => s + r.audience, 0);
  const filtered = filter === "전체" ? MOCK_ROOMS : MOCK_ROOMS.filter(r => r.topic === filter || r.tags.some(t => t.includes(filter.replace("#", ""))));

  return (
    <div className="min-h-screen bg-[#070707] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 right-[-5%] w-[500px] h-[500px] rounded-full opacity-12"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)`, filter: "blur(80px)", animation: "float-blob 14s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 left-[-5%] w-[400px] h-[400px] rounded-full opacity-08"
          style={{ background: `radial-gradient(circle, ${ACCENT2} 0%, transparent 70%)`, filter: "blur(80px)", animation: "float-blob 18s ease-in-out infinite reverse" }} />
      </div>

      <Link href="/" className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 backdrop-blur-md border border-white/10 transition-all" style={{ color: ACCENT }}>
        ← L&apos;OXYGÈNE
      </Link>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-20">
        <div className="text-center mb-12">
          <p className="text-white/40 text-xs tracking-[0.35em] uppercase mb-3">L&apos;Oxygène Presents</p>
          <h1 className="text-5xl font-black tracking-widest mb-3"
            style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}, 0 0 60px rgba(139,92,246,0.4)`, letterSpacing: "0.18em" }}>
            TALK SHOW
          </h1>
          <p className="text-white/45 text-base mb-6">방구석 토크쇼</p>
          <div className="inline-flex items-center gap-2.5 bg-white/[0.03] border px-5 py-2.5 rounded-full" style={{ borderColor: `${ACCENT}30` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, animation: "pulse-neon 1.5s ease-in-out infinite" }} />
            <span className="text-white/75 text-sm">현재 <span className="font-bold" style={{ color: ACCENT }}>{totalAudience}</span>명 청중 중</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {["전체", "연애", "인생", "취미", "커리어", "문화"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm transition-all"
                style={filter === f
                  ? { background: `rgba(139,92,246,0.18)`, border: `1px solid ${ACCENT}60`, color: ACCENT }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: `rgba(139,92,246,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT, boxShadow: `0 0 15px rgba(139,92,246,0.2)` }}>
            <Icon icon="solar:add-circle-bold" className="w-4 h-4" /> 방 만들기
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(room => (
            <div key={room.id} className="group rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
              {/* Host + badges */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {room.hostAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {room.isLive
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>🔴 LIVE</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full text-white/25" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>예정</span>
                    }
                    <span className="text-[10px] text-white/35">{room.vibe}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight group-hover:text-purple-300 transition-colors">{room.title}</h3>
                  <p className="text-white/40 text-xs mt-0.5">호스트 · {room.host}</p>
                </div>
              </div>

              {/* Avatar stack + stats */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {["👤","😊","🎵"].map((a, i) => (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(7,7,7,0.9)" }}>{a}</div>
                  ))}
                </div>
                <span className="text-xs text-white/40">+{room.audience}명</span>
                <span className="ml-auto text-[10px] text-white/30">패널 {room.panels}명</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {room.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(139,92,246,0.08)", color: "rgba(196,181,253,0.7)", border: "1px solid rgba(139,92,246,0.18)" }}>{t}</span>
                ))}
              </div>

              <Link href={`/rooms/talkshow/${room.id}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: `rgba(139,92,246,0.12)`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
                파티 입장 →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5" style={{ background: "rgba(10,8,16,0.98)", border: `1px solid ${ACCENT}30`, boxShadow: `0 0 60px rgba(139,92,246,0.15)` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">🎙️ 새 토크방 만들기</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white/60"><Icon icon="solar:close-circle-bold" className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 tracking-wider">토크 주제</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 오늘의 토픽을 입력하세요"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", caretColor: ACCENT }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 tracking-wider">카테고리</label>
              <div className="grid grid-cols-3 gap-2">
                {["연애", "인생", "취미", "커리어", "문화", "기타"].map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    className="py-2 rounded-xl text-xs font-medium transition-all"
                    style={topic === t ? { background: `rgba(139,92,246,0.18)`, border: `1px solid ${ACCENT}50`, color: ACCENT } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 tracking-wider">최대 패널 수: <span style={{ color: ACCENT }}>{maxPanels}명</span></label>
              <input type="range" min={2} max={8} value={maxPanels} onChange={e => setMaxPanels(Number(e.target.value))} className="w-full" />
            </div>
            <button onClick={() => setShowCreate(false)}
              className="w-full py-3 rounded-xl font-bold transition-all active:scale-95"
              style={{ background: `rgba(139,92,246,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
              🎙️ 토크방 만들기
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
