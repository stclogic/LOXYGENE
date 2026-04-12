"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

const FILTER_TABS = [
  { id: "all", label: "전체" },
  { id: "birthday", label: "생일파티" },
  { id: "doljanchi", label: "돌잔치" },
  { id: "longevity", label: "칠순·팔순" },
  { id: "corporate", label: "기업행사" },
  { id: "private", label: "프라이빗" },
];

const EVENT_THEMES: Record<string, { label: string; gradient: string; accent: string }> = {
  bubble_pink: { label: "버블핑크", gradient: "from-pink-400/30 to-purple-400/20", accent: "#FF007F" },
  gold_black: { label: "골드블랙", gradient: "from-yellow-400/30 to-amber-600/20", accent: "#FFD700" },
  neon_cyber: { label: "네온사이버", gradient: "from-cyan-400/30 to-blue-500/20", accent: "#00E5FF" },
  classic_white: { label: "클래식화이트", gradient: "from-white/10 to-white/5", accent: "#FFFFFF" },
};

const MOCK_EVENTS = [
  {
    id: "ev1",
    type: "birthday",
    typeLabel: "생일파티",
    title: "🎂 축 서른! 김민준의 생일파티",
    host: "민준이친구들",
    date: "2026.04.12 (토) 오후 7시",
    guests: 14,
    maxGuests: 30,
    theme: "bubble_pink",
    isLive: true,
    password: false,
  },
  {
    id: "ev2",
    type: "doljanchi",
    typeLabel: "돌잔치",
    title: "👶 박서연 첫돌잔치",
    host: "박준혁·이수진",
    date: "2026.04.13 (일) 오후 2시",
    guests: 22,
    maxGuests: 50,
    theme: "classic_white",
    isLive: false,
    password: false,
  },
  {
    id: "ev3",
    type: "longevity",
    typeLabel: "칠순·팔순",
    title: "🎊 부모님 칠순 기념 가족모임",
    host: "김현수",
    date: "2026.04.14 (월) 오후 6시",
    guests: 8,
    maxGuests: 20,
    theme: "gold_black",
    isLive: true,
    password: true,
  },
  {
    id: "ev4",
    type: "corporate",
    typeLabel: "기업행사",
    title: "🏢 넥스트레벨 팀 창립 3주년",
    host: "NEXTLEVEL",
    date: "2026.04.15 (화) 오후 8시",
    guests: 35,
    maxGuests: 100,
    theme: "neon_cyber",
    isLive: false,
    password: true,
  },
  {
    id: "ev5",
    type: "birthday",
    typeLabel: "생일파티",
    title: "🎉 이하은 25번째 봄",
    host: "하은서프라이즈",
    date: "2026.04.16 (수) 오후 9시",
    guests: 6,
    maxGuests: 15,
    theme: "bubble_pink",
    isLive: false,
    password: false,
  },
  {
    id: "ev6",
    type: "private",
    typeLabel: "프라이빗",
    title: "✨ 우리끼리 소소한 모임",
    host: "비공개",
    date: "2026.04.16 (수) 오후 10시",
    guests: 3,
    maxGuests: 8,
    theme: "classic_white",
    isLive: true,
    password: true,
  },
];

const THEME_SELECTOR_OPTIONS = Object.entries(EVENT_THEMES).map(([id, v]) => ({ id, ...v }));
const EVENT_TYPES = [
  { id: "birthday", label: "생일파티" },
  { id: "doljanchi", label: "돌잔치" },
  { id: "longevity", label: "칠순·팔순" },
  { id: "corporate", label: "기업행사" },
  { id: "private", label: "프라이빗" },
];

function OrnamentLeft() {
  return (
    <svg width="32" height="64" viewBox="0 0 32 64" fill="none" className="opacity-40">
      <path d="M16 2 C8 12, 2 20, 2 32 C2 44, 8 52, 16 62" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="16" cy="2" r="2" fill="currentColor"/>
      <circle cx="16" cy="62" r="2" fill="currentColor"/>
      <path d="M16 12 C10 16, 8 20, 10 24 C12 28, 16 28, 16 28 C16 28, 20 28, 22 24 C24 20, 22 16, 16 12Z" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M16 36 C10 40, 8 44, 10 48 C12 52, 16 52, 16 52 C16 52, 20 52, 22 48 C24 44, 22 40, 16 36Z" stroke="currentColor" strokeWidth="1" fill="none"/>
    </svg>
  );
}

export default function BanquetLobbyPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  // Modal state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("birthday");
  const [formDate, setFormDate] = useState("");
  const [formMaxGuests, setFormMaxGuests] = useState(20);
  const [formTheme, setFormTheme] = useState("bubble_pink");
  const [formPassword, setFormPassword] = useState(false);
  const [formPasswordVal, setFormPasswordVal] = useState("");
  const [formInviteGenerated, setFormInviteGenerated] = useState(false);

  const filtered = activeFilter === "all"
    ? MOCK_EVENTS
    : MOCK_EVENTS.filter((e) => e.type === activeFilter);

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
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #FF007F 0%, transparent 70%)", filter: "blur(100px)", animation: "float-blob 15s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #FFD700 0%, transparent 70%)", filter: "blur(100px)", animation: "float-blob 18s ease-in-out infinite reverse" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Header */}
      <div className="relative z-20 flex flex-col items-center justify-center pt-16 pb-8 px-4">
        {/* Ornamental top rule */}
        <div className="flex items-center gap-4 mb-4 w-full max-w-xl">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,0,127,0.4))" }} />
          <span className="text-[#FF007F] text-xl">✦</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,0,127,0.4))" }} />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-widest uppercase mb-1"
          style={{ color: "#FF007F", textShadow: "0 0 20px rgba(255,0,127,0.6), 0 0 40px rgba(255,0,127,0.3)" }}>
          THE BANQUET HALL
        </h1>
        <p className="text-white/50 text-sm sm:text-base tracking-wide text-center">
          온동네의 모든 대소사, 여기서 시작됩니다
        </p>

        {/* Ornamental bottom rule */}
        <div className="flex items-center gap-4 mt-4 w-full max-w-xl">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,215,0,0.3))" }} />
          <span className="text-yellow-400/60 text-sm">❧</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,215,0,0.3))" }} />
        </div>
      </div>

      {/* Filter + Create */}
      <div className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto w-full mb-6">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  activeFilter === tab.id
                    ? { background: "rgba(255,0,127,0.2)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Create event button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: "rgba(255,0,127,0.15)", border: "1px solid rgba(255,0,127,0.4)", color: "#FF007F", boxShadow: "0 0 12px rgba(255,0,127,0.2)" }}
          >
            <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
            이벤트 만들기
          </button>
        </div>
      </div>

      {/* Event cards grid */}
      <div className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto w-full pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => {
            const theme = EVENT_THEMES[event.theme];
            return (
              <Link key={event.id} href={`/rooms/banquet/${event.id}`} className="block group">
                <div
                  className="relative rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02] cursor-pointer overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${theme.accent}22`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Theme accent glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                    style={{ boxShadow: `inset 0 0 30px ${theme.accent}15` }} />

                  {/* Top row: type badge + live indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: `${theme.accent}20`, color: theme.accent, border: `1px solid ${theme.accent}40` }}>
                      {event.typeLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      {event.password && (
                        <Icon icon="solar:lock-bold" className="w-3.5 h-3.5 text-white/30" />
                      )}
                      {event.isLive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-bold text-sm leading-snug">{event.title}</h3>

                  {/* Ornamental divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${theme.accent}30, transparent)` }} />
                    <span className="text-[10px]" style={{ color: `${theme.accent}60` }}>✦</span>
                  </div>

                  {/* Host + date */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      <Icon icon="solar:crown-bold" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.accent + "80" }} />
                      <span className="truncate">{event.host}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      <Icon icon="solar:calendar-bold" className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{event.date}</span>
                    </div>
                  </div>

                  {/* Guest count + progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/30 text-[11px]">참가자</span>
                      <span className="text-xs font-semibold" style={{ color: theme.accent }}>
                        {event.guests} / {event.maxGuests}명
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${(event.guests / event.maxGuests) * 100}%`, background: `linear-gradient(to right, ${theme.accent}80, ${theme.accent})` }} />
                    </div>
                  </div>

                  {/* Enter button */}
                  <button
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 mt-auto"
                    style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}40`, color: theme.accent }}
                  >
                    {event.password ? "🔐 입장하기" : "입장하기"}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/20">
            <Icon icon="solar:ghost-bold" className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">현재 진행 중인 이벤트가 없습니다</p>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto hide-scrollbar"
            style={{ background: "rgba(10,10,15,0.98)", border: "1px solid rgba(255,0,127,0.2)", boxShadow: "0 0 60px rgba(255,0,127,0.1)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-black text-lg tracking-wider">이벤트 만들기</h2>
                <p className="text-white/30 text-xs mt-0.5">소중한 순간을 L&apos;Oxygène에서</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/70 transition-colors">
                <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: "rgba(255,0,127,0.15)" }} />

            {/* Event title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/50 text-xs font-semibold tracking-wider">이벤트 제목</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="예) 🎂 축 서른! 김민준의 생일파티"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            {/* Event type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/50 text-xs font-semibold tracking-wider">이벤트 종류</label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFormType(t.id)}
                    className="py-2 rounded-lg text-xs font-semibold transition-all"
                    style={
                      formType === t.id
                        ? { background: "rgba(255,0,127,0.2)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date/time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/50 text-xs font-semibold tracking-wider">날짜 및 시간</label>
              <input
                type="datetime-local"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all [color-scheme:dark]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            {/* Max attendees slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-white/50 text-xs font-semibold tracking-wider">최대 참가 인원</label>
                <span className="text-sm font-black" style={{ color: "#FF007F" }}>{formMaxGuests}명</span>
              </div>
              <input
                type="range"
                min={2}
                max={200}
                value={formMaxGuests}
                onChange={(e) => setFormMaxGuests(Number(e.target.value))}
                className="w-full accent-[#FF007F]"
              />
              <div className="flex justify-between text-[10px] text-white/20">
                <span>2명</span>
                <span>200명</span>
              </div>
            </div>

            {/* Theme */}
            <div className="flex flex-col gap-2">
              <label className="text-white/50 text-xs font-semibold tracking-wider">테마</label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_SELECTOR_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFormTheme(t.id)}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                    style={
                      formTheme === t.id
                        ? { background: `${t.accent}20`, border: `1px solid ${t.accent}60`, color: t.accent }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Password toggle */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-white/50 text-xs font-semibold tracking-wider">비공개 설정</label>
                <button
                  onClick={() => setFormPassword(!formPassword)}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: formPassword ? "rgba(255,0,127,0.4)" : "rgba(255,255,255,0.1)" }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: formPassword ? "calc(100% - 18px)" : "2px" }}
                  />
                </button>
              </div>
              {formPassword && (
                <input
                  type="password"
                  value={formPasswordVal}
                  onChange={(e) => setFormPasswordVal(e.target.value)}
                  placeholder="입장 비밀번호"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,0,127,0.2)" }}
                />
              )}
            </div>

            {/* Invite link */}
            <div className="flex flex-col gap-2">
              <label className="text-white/50 text-xs font-semibold tracking-wider">초대 링크</label>
              {formInviteGenerated ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-xl text-xs text-[#00E5FF] font-mono truncate"
                    style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.2)" }}>
                    loxygene.app/invite/ev-{Math.random().toString(36).slice(2, 8)}
                  </div>
                  <button className="px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    복사
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setFormInviteGenerated(true)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Icon icon="solar:link-bold" className="w-3.5 h-3.5 inline mr-1.5" />
                  초대 링크 생성
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              className="w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all active:scale-95 mt-1"
              style={{ background: "rgba(255,0,127,0.2)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F", boxShadow: "0 0 20px rgba(255,0,127,0.2)" }}
            >
              <Icon icon="solar:confetti-bold" className="w-4 h-4 inline mr-2" />
              이벤트 생성하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
