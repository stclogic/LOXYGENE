"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";

// ─── Mock data ───────────────────────────────────────────────────────────────

const EVENT_META: Record<string, {
  title: string;
  host: string;
  date: string;
  theme: "bubble_pink" | "gold_black" | "neon_cyber" | "classic_white";
  type: string;
}> = {
  ev1: { title: "축 서른! 김민준의 생일파티", host: "김민준", date: "2026.04.12 (토) 오후 7시", theme: "bubble_pink", type: "생일파티" },
  ev2: { title: "이하늘 아기의 돌잔치", host: "이준호·박소연", date: "2026.04.13 (일) 낮 12시", theme: "classic_white", type: "돌잔치" },
  ev3: { title: "박정수 어르신 칠순잔치", host: "박정수 가족", date: "2026.04.15 (화) 오후 6시", theme: "gold_black", type: "칠순잔치" },
  ev4: { title: "TechCorp 2026 연례 파티", host: "TechCorp HR팀", date: "2026.04.18 (금) 오후 8시", theme: "neon_cyber", type: "기업행사" },
  ev5: { title: "이지은 결혼기념일", host: "이지은·박민재", date: "2026.04.20 (일) 오후 7시", theme: "bubble_pink", type: "프라이빗" },
  ev6: { title: "강씨네 팔순잔치", host: "강씨 가족", date: "2026.04.22 (화) 오후 5시", theme: "gold_black", type: "팔순잔치" },
};

const DEFAULT_EVENT = {
  title: "이벤트 룸",
  host: "호스트",
  date: "2026.04.12",
  theme: "bubble_pink" as const,
  type: "파티",
};

const THEMES = {
  bubble_pink: {
    accent: "#FF007F",
    accentSoft: "rgba(255,0,127,0.15)",
    accentGlow: "rgba(255,0,127,0.4)",
    banner: "linear-gradient(135deg, rgba(255,0,127,0.18) 0%, rgba(168,0,255,0.12) 100%)",
    badge: "rgba(255,0,127,0.2)",
    badgeBorder: "rgba(255,0,127,0.4)",
  },
  gold_black: {
    accent: "#C9A84C",
    accentSoft: "rgba(201,168,76,0.12)",
    accentGlow: "rgba(201,168,76,0.4)",
    banner: "linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(120,80,10,0.12) 100%)",
    badge: "rgba(201,168,76,0.2)",
    badgeBorder: "rgba(201,168,76,0.4)",
  },
  neon_cyber: {
    accent: "#00E5FF",
    accentSoft: "rgba(0,229,255,0.12)",
    accentGlow: "rgba(0,229,255,0.4)",
    banner: "linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,80,255,0.10) 100%)",
    badge: "rgba(0,229,255,0.15)",
    badgeBorder: "rgba(0,229,255,0.4)",
  },
  classic_white: {
    accent: "#FFFFFF",
    accentSoft: "rgba(255,255,255,0.08)",
    accentGlow: "rgba(255,255,255,0.3)",
    banner: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(200,200,220,0.05) 100%)",
    badge: "rgba(255,255,255,0.12)",
    badgeBorder: "rgba(255,255,255,0.3)",
  },
};

const MOCK_GUESTS = [
  { id: 1, name: "김민준", role: "host", mic: true, cam: true, reacted: false },
  { id: 2, name: "이수연", role: "guest", mic: true, cam: false, reacted: true },
  { id: 3, name: "박태현", role: "guest", mic: false, cam: true, reacted: false },
  { id: 4, name: "최지아", role: "guest", mic: true, cam: true, reacted: true },
  { id: 5, name: "한동훈", role: "guest", mic: false, cam: false, reacted: false },
  { id: 6, name: "오미래", role: "guest", mic: true, cam: false, reacted: false },
  { id: 7, name: "정우진", role: "guest", mic: false, cam: true, reacted: true },
  { id: 8, name: "나예린", role: "guest", mic: true, cam: true, reacted: false },
];

const MOCK_GIFTS = [
  { id: 1, from: "이수연", amount: 50000, message: "생일 축하해요! 🎉", time: "19:12" },
  { id: 2, from: "박태현", amount: 100000, message: "건강하고 행복하세요 ✨", time: "19:15" },
  { id: 3, from: "최지아", amount: 30000, message: "오래오래 건강하게!", time: "19:21" },
  { id: 4, from: "한동훈", amount: 200000, message: "축하드립니다 🥳", time: "19:28" },
];

const BGM_TRACKS = [
  { id: 1, title: "Happy Together", artist: "The Turtles", duration: "2:52" },
  { id: 2, title: "Celebrate", artist: "Kool & The Gang", duration: "3:41" },
  { id: 3, title: "Good Times", artist: "Chic", duration: "4:10" },
];

const QUICK_AMOUNTS = [10000, 30000, 50000, 100000, 200000, 500000];

// ─── Ornament SVG ──────────────────────────────────────────────────────────

function OrnamentLeft({ color }: { color: string }) {
  return (
    <svg width="48" height="80" viewBox="0 0 48 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4 C24 4, 10 14, 6 28 C2 42, 10 54, 24 58" stroke={color} strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <path d="M24 58 C24 58, 10 62, 8 70 C7 75, 14 80, 24 80" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
      <path d="M24 4 C20 8, 14 12, 12 18" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
      <path d="M24 4 C28 8, 34 12, 36 18" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
      <circle cx="24" cy="4" r="2" fill={color} opacity="0.5" />
      <circle cx="24" cy="58" r="1.5" fill={color} opacity="0.4" />
      <circle cx="24" cy="80" r="1" fill={color} opacity="0.3" />
    </svg>
  );
}

function OrnamentRight({ color }: { color: string }) {
  return (
    <svg width="48" height="80" viewBox="0 0 48 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "scaleX(-1)" }}>
      <path d="M24 4 C24 4, 10 14, 6 28 C2 42, 10 54, 24 58" stroke={color} strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <path d="M24 58 C24 58, 10 62, 8 70 C7 75, 14 80, 24 80" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
      <path d="M24 4 C20 8, 14 12, 12 18" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
      <path d="M24 4 C28 8, 34 12, 36 18" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
      <circle cx="24" cy="4" r="2" fill={color} opacity="0.5" />
      <circle cx="24" cy="58" r="1.5" fill={color} opacity="0.4" />
      <circle cx="24" cy="80" r="1" fill={color} opacity="0.3" />
    </svg>
  );
}

// ─── Bouquet particle ──────────────────────────────────────────────────────

interface Bouquet { id: number; x: number; emoji: string }

// ─── Main page ─────────────────────────────────────────────────────────────

export default function BanquetRoomPage() {
  const params = useParams();
  const eventId = typeof params.eventId === "string" ? params.eventId : "ev1";
  const meta = EVENT_META[eventId] ?? DEFAULT_EVENT;
  const theme = THEMES[meta.theme];

  // controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [activeTab, setActiveTab] = useState<"guests" | "gifts">("guests");
  const [bgmTrack, setBgmTrack] = useState(0);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [directorOpen, setDirectorOpen] = useState(false);

  // gift modal
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState(50000);
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSent, setGiftSent] = useState(false);
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [gifts, setGifts] = useState(MOCK_GIFTS);
  const bouquetIdRef = useRef(0);

  // reactions
  const [reactionBurst, setReactionBurst] = useState(false);

  const spawnBouquet = useCallback(() => {
    const emojis = ["💐", "🌸", "🌺", "🎀", "✨", "🎊", "🎉"];
    const count = 8;
    const newBouquets: Bouquet[] = Array.from({ length: count }, (_, i) => ({
      id: bouquetIdRef.current + i,
      x: 10 + Math.floor((i / count) * 80),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    bouquetIdRef.current += count;
    setBouquets((prev) => [...prev, ...newBouquets]);
    setTimeout(() => {
      setBouquets((prev) => prev.filter((b) => !newBouquets.find((n) => n.id === b.id)));
    }, 2000);
  }, []);

  const handleSendGift = () => {
    setGiftSent(true);
    spawnBouquet();
    const newGift = {
      id: Date.now(),
      from: "나",
      amount: giftAmount,
      message: giftMessage || "축하드립니다!",
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };
    setGifts((prev) => [newGift, ...prev]);
    setTimeout(() => {
      setGiftOpen(false);
      setGiftSent(false);
      setGiftMessage("");
    }, 1800);
  };

  const handleReaction = () => {
    setReactionBurst(true);
    spawnBouquet();
    setTimeout(() => setReactionBurst(false), 600);
  };

  // ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setGiftOpen(false); setDirectorOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // body scroll lock
  useEffect(() => {
    document.body.style.overflow = giftOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [giftOpen]);

  const totalGifts = gifts.reduce((s, g) => s + g.amount, 0);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "#070707" }}
    >
      {/* Director FAB */}
      <button
        onClick={() => setDirectorOpen(true)}
        className="fixed bottom-20 left-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F", backdropFilter: "blur(12px)", boxShadow: "0 0 12px rgba(255,0,127,0.15)" }}
      >
        <Icon icon="solar:user-star-bold" className="w-3.5 h-3.5" />
        디렉터 호출
      </button>
      <QuickCallModal open={directorOpen} onClose={() => setDirectorOpen(false)} roomId={eventId} />
      {/* Bouquet particles */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {bouquets.map((b) => (
          <div
            key={b.id}
            className="absolute text-2xl"
            style={{
              left: `${b.x}%`,
              bottom: "80px",
              animation: "bouquet-rise 2s ease-out forwards",
            }}
          >
            {b.emoji}
          </div>
        ))}
      </div>

      {/* ── Event Banner ───────────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 px-4 py-3"
        style={{ background: theme.banner, borderBottom: `1px solid ${theme.accentSoft}` }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left ornament + title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/rooms/banquet"
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ color: theme.accent, background: theme.accentSoft, border: `1px solid ${theme.accentSoft}`, backdropFilter: "blur(12px)" }}
            >
              ← 뱅큇홀
            </Link>

            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <OrnamentLeft color={theme.accent} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase"
                  style={{ background: theme.badge, border: `1px solid ${theme.badgeBorder}`, color: theme.accent }}
                >
                  {meta.type}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{meta.date}</span>
              </div>
              <h1
                className="text-sm sm:text-base font-light tracking-wide truncate"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                {meta.title}
              </h1>
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <OrnamentRight color={theme.accent} />
            </div>
          </div>

          {/* Right: stats */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accent }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {MOCK_GUESTS.length}명 참석
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Icon icon="solar:gift-bold" className="w-3 h-3" style={{ color: theme.accent }} />
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                {totalGifts.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Stage + guest grid */}
        <main className="flex-1 flex flex-col overflow-hidden p-3 gap-3 min-w-0">

          {/* Host spotlight */}
          <div
            className="relative rounded-2xl overflow-hidden flex-shrink-0"
            style={{
              height: "200px",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${theme.accentSoft}`,
            }}
          >
            {/* Simulated video placeholder */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: `radial-gradient(ellipse at center, ${theme.accentSoft}, transparent 70%)` }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light"
                style={{
                  background: theme.accentSoft,
                  border: `2px solid ${theme.accent}`,
                  boxShadow: `0 0 24px ${theme.accentGlow}`,
                }}
              >
                {meta.host.charAt(0)}
              </div>
              <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.7)" }}>
                {meta.host}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded"
                style={{ background: theme.badge, color: theme.accent, border: `1px solid ${theme.badgeBorder}` }}
              >
                HOST
              </span>
            </div>

            {/* Corner decoration */}
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5"
              style={{ color: theme.accent }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accent }} />
              <span className="text-[10px] font-medium tracking-wider uppercase">LIVE</span>
            </div>

            {/* Reaction burst */}
            {reactionBurst && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `inset 0 0 40px ${theme.accentGlow}` }} />
            )}
          </div>

          {/* Guest grid */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 pb-2">
              {MOCK_GUESTS.map((g) => (
                <div
                  key={g.id}
                  className="relative flex flex-col items-center gap-1.5 p-2 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: g.reacted
                      ? `1px solid ${theme.accentSoft}`
                      : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-light flex-shrink-0"
                    style={{
                      background: g.reacted ? theme.accentSoft : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${g.reacted ? theme.accent : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    {g.name.charAt(0)}
                  </div>
                  <span className="text-[10px] truncate w-full text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {g.name}
                  </span>
                  {/* Status icons */}
                  <div className="flex items-center gap-1">
                    <Icon
                      icon={g.mic ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
                      className="w-2.5 h-2.5"
                      style={{ color: g.mic ? theme.accent : "rgba(255,255,255,0.2)" }}
                    />
                    <Icon
                      icon={g.cam ? "solar:camera-bold" : "solar:camera-slash-bold"}
                      className="w-2.5 h-2.5"
                      style={{ color: g.cam ? theme.accent : "rgba(255,255,255,0.2)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ── Right sidebar ────────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex w-72 flex-col flex-shrink-0 border-l overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
        >
          {/* Tabs */}
          <div className="flex border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {(["guests", "gifts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-xs font-medium tracking-wider uppercase transition-all"
                style={{
                  color: activeTab === tab ? theme.accent : "rgba(255,255,255,0.3)",
                  borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : "2px solid transparent",
                }}
              >
                {tab === "guests" ? `게스트 (${MOCK_GUESTS.length})` : "축의금"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "none" }}>
            {activeTab === "guests" ? (
              <div className="flex flex-col gap-1.5">
                {MOCK_GUESTS.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: theme.accentSoft, border: `1px solid ${theme.accentSoft}` }}
                    >
                      {g.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                          {g.name}
                        </span>
                        {g.role === "host" && (
                          <span className="text-[9px] px-1 rounded" style={{ background: theme.badge, color: theme.accent }}>
                            HOST
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Icon
                        icon={g.mic ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
                        className="w-3 h-3"
                        style={{ color: g.mic ? theme.accent : "rgba(255,255,255,0.15)" }}
                      />
                      <Icon
                        icon={g.cam ? "solar:camera-bold" : "solar:camera-slash-bold"}
                        className="w-3 h-3"
                        style={{ color: g.cam ? theme.accent : "rgba(255,255,255,0.15)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {/* Total */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-1"
                  style={{ background: theme.accentSoft, border: `1px solid ${theme.badgeBorder}` }}
                >
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>총 축의금</span>
                  <span className="text-sm font-semibold" style={{ color: theme.accent }}>
                    {totalGifts.toLocaleString()}원
                  </span>
                </div>
                {gifts.map((g) => (
                  <div
                    key={g.id}
                    className="px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{g.from}</span>
                      <span className="text-xs font-semibold" style={{ color: theme.accent }}>
                        {g.amount.toLocaleString()}원
                      </span>
                    </div>
                    {g.message && (
                      <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{g.message}</p>
                    )}
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{g.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BGM Controls */}
          <div
            className="flex-shrink-0 p-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="solar:music-note-bold" className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                BGM
              </span>
            </div>
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl mb-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {BGM_TRACKS[bgmTrack].title}
                </p>
                <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {BGM_TRACKS[bgmTrack].artist}
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <button
                  onClick={() => setBgmTrack((t) => (t - 1 + BGM_TRACKS.length) % BGM_TRACKS.length)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <Icon icon="solar:skip-previous-bold" className="w-3 h-3" style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
                <button
                  onClick={() => setBgmPlaying((p) => !p)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: theme.accentSoft, border: `1px solid ${theme.badgeBorder}` }}
                >
                  <Icon
                    icon={bgmPlaying ? "solar:pause-bold" : "solar:play-bold"}
                    className="w-3.5 h-3.5"
                    style={{ color: theme.accent }}
                  />
                </button>
                <button
                  onClick={() => setBgmTrack((t) => (t + 1) % BGM_TRACKS.length)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <Icon icon="solar:skip-next-bold" className="w-3 h-3" style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>
            </div>
            {/* Track list */}
            <div className="flex flex-col gap-0.5">
              {BGM_TRACKS.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => { setBgmTrack(i); setBgmPlaying(true); }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all hover:opacity-80"
                  style={{
                    background: i === bgmTrack ? theme.accentSoft : "transparent",
                  }}
                >
                  {i === bgmTrack && bgmPlaying ? (
                    <Icon icon="solar:volume-loud-bold" className="w-3 h-3 flex-shrink-0" style={{ color: theme.accent }} />
                  ) : (
                    <span className="w-3 h-3 flex items-center justify-center text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {i + 1}
                    </span>
                  )}
                  <span className="text-[10px] truncate flex-1" style={{ color: i === bgmTrack ? theme.accent : "rgba(255,255,255,0.4)" }}>
                    {track.title}
                  </span>
                  <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {track.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center justify-between gap-3"
        style={{
          background: "rgba(7,7,7,0.92)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Left: mic + cam */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMicOn((v) => !v)}
            className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 px-3 rounded-xl transition-all active:scale-95"
            style={{
              background: micOn ? theme.accentSoft : "rgba(255,255,255,0.04)",
              border: `1px solid ${micOn ? theme.badgeBorder : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <Icon
              icon={micOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
              className="w-5 h-5"
              style={{ color: micOn ? theme.accent : "rgba(255,255,255,0.3)" }}
            />
            <span className="text-[9px] font-medium" style={{ color: micOn ? theme.accent : "rgba(255,255,255,0.3)" }}>
              {micOn ? "마이크" : "뮤트"}
            </span>
          </button>

          <button
            onClick={() => setCamOn((v) => !v)}
            className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 px-3 rounded-xl transition-all active:scale-95"
            style={{
              background: camOn ? theme.accentSoft : "rgba(255,255,255,0.04)",
              border: `1px solid ${camOn ? theme.badgeBorder : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <Icon
              icon={camOn ? "solar:camera-bold" : "solar:camera-slash-bold"}
              className="w-5 h-5"
              style={{ color: camOn ? theme.accent : "rgba(255,255,255,0.3)" }}
            />
            <span className="text-[9px] font-medium" style={{ color: camOn ? theme.accent : "rgba(255,255,255,0.3)" }}>
              {camOn ? "카메라" : "카메라 꺼짐"}
            </span>
          </button>
        </div>

        {/* Center: reaction */}
        <button
          onClick={handleReaction}
          className="min-h-[44px] px-4 flex items-center gap-2 rounded-xl transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span className="text-lg">🎉</span>
          <span className="text-xs font-light" style={{ color: "rgba(255,255,255,0.5)" }}>반응</span>
        </button>

        {/* Right: 축의금 */}
        <button
          onClick={() => setGiftOpen(true)}
          className="min-h-[44px] px-5 flex items-center gap-2 rounded-xl font-light tracking-wide text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            background: "rgba(255,0,127,0.1)",
            border: "1px solid rgba(255,0,127,0.4)",
            color: "#FF007F",
            animation: "pulse-glow-pink 3s ease-in-out infinite",
          }}
        >
          <Icon icon="solar:gift-bold" className="w-4 h-4" />
          축의금 보내기
        </button>
      </div>

      {/* ── Gift Modal ────────────────────────────────────────────────── */}
      {giftOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setGiftOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: "rgba(15,15,18,0.98)",
              border: "1px solid rgba(255,0,127,0.2)",
              boxShadow: "0 0 60px rgba(255,0,127,0.15)",
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between border-b"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">💌</span>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                  축의금 전송
                </span>
              </div>
              <button
                onClick={() => setGiftOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <Icon icon="solar:close-bold" className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Recipient */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,0,127,0.06)", border: "1px solid rgba(255,0,127,0.15)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,0,127,0.15)", color: "#FF007F" }}
                >
                  {meta.host.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{meta.host}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>축의금 수령인</p>
                </div>
              </div>

              {/* Quick amounts */}
              <div>
                <p className="text-[10px] mb-2 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>금액 선택</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setGiftAmount(amt)}
                      className="py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                      style={{
                        background: giftAmount === amt ? "rgba(255,0,127,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${giftAmount === amt ? "rgba(255,0,127,0.5)" : "rgba(255,255,255,0.06)"}`,
                        color: giftAmount === amt ? "#FF007F" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {(amt / 10000).toLocaleString()}만
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div className="relative">
                <input
                  type="number"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Number(e.target.value))}
                  className="w-full py-3 px-4 pr-10 rounded-xl outline-none text-sm"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.8)",
                    caretColor: "#FF007F",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  원
                </span>
              </div>

              {/* Message */}
              <textarea
                rows={2}
                placeholder="축하 메시지 (선택)"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                className="w-full py-3 px-4 rounded-xl outline-none text-sm resize-none"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.8)",
                  caretColor: "#FF007F",
                }}
              />

              {/* Send button */}
              <button
                onClick={handleSendGift}
                disabled={giftSent || giftAmount < 1000}
                className="w-full py-3.5 rounded-xl font-light tracking-wider text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: giftSent ? "rgba(255,0,127,0.2)" : "rgba(255,0,127,0.12)",
                  border: "1px solid rgba(255,0,127,0.5)",
                  color: "#FF007F",
                  animation: giftSent ? "none" : "pulse-glow-pink 3s ease-in-out infinite",
                }}
              >
                {giftSent ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    전송 완료! 💐
                  </span>
                ) : (
                  <span>
                    {giftAmount.toLocaleString()}원 전송
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bouquet-rise {
          0% { transform: translateY(0) scale(0.5); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-180px) scale(1.2); opacity: 0; }
        }
        @keyframes pulse-glow-pink {
          0%, 100% { box-shadow: 0 0 10px rgba(255,0,127,0.3); border-color: rgba(255,0,127,0.4); }
          50% { box-shadow: 0 0 24px rgba(255,0,127,0.7); border-color: rgba(255,0,127,0.9); }
        }
      `}</style>
    </div>
  );
}
