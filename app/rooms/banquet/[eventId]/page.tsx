"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";
import { FloatingPanel } from "@/components/room/PartyRoomShell";

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
  title: "이벤트 룸", host: "호스트", date: "2026.04.12",
  theme: "bubble_pink" as const, type: "파티",
};

const THEMES = {
  bubble_pink:  { accent: "#FF007F", accentSoft: "rgba(255,0,127,0.15)",  accentGlow: "rgba(255,0,127,0.4)",  banner: "linear-gradient(135deg, rgba(255,0,127,0.18) 0%, rgba(168,0,255,0.12) 100%)",    badge: "rgba(255,0,127,0.2)",   badgeBorder: "rgba(255,0,127,0.4)"  },
  gold_black:   { accent: "#C9A84C", accentSoft: "rgba(201,168,76,0.12)",  accentGlow: "rgba(201,168,76,0.4)", banner: "linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(120,80,10,0.12) 100%)",    badge: "rgba(201,168,76,0.2)",  badgeBorder: "rgba(201,168,76,0.4)" },
  neon_cyber:   { accent: "#00E5FF", accentSoft: "rgba(0,229,255,0.12)",   accentGlow: "rgba(0,229,255,0.4)",  banner: "linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,80,255,0.10) 100%)",      badge: "rgba(0,229,255,0.15)",  badgeBorder: "rgba(0,229,255,0.4)"  },
  classic_white:{ accent: "#FFFFFF", accentSoft: "rgba(255,255,255,0.08)", accentGlow: "rgba(255,255,255,0.3)",banner: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(200,200,220,0.05) 100%)", badge: "rgba(255,255,255,0.12)",badgeBorder: "rgba(255,255,255,0.3)"},
};

const MOCK_GUESTS = [
  { id: 1, name: "김민준", role: "host", mic: true,  cam: true  },
  { id: 2, name: "이수연", role: "guest", mic: true,  cam: false },
  { id: 3, name: "박태현", role: "guest", mic: false, cam: true  },
  { id: 4, name: "최지아", role: "guest", mic: true,  cam: true  },
  { id: 5, name: "한동훈", role: "guest", mic: false, cam: false },
  { id: 6, name: "오미래", role: "guest", mic: true,  cam: false },
  { id: 7, name: "정우진", role: "guest", mic: false, cam: true  },
  { id: 8, name: "나예린", role: "guest", mic: true,  cam: true  },
];

const MOCK_GIFTS = [
  { id: 1, from: "이수연", amount: 50000,  message: "생일 축하해요! 🎉",    time: "19:12" },
  { id: 2, from: "박태현", amount: 100000, message: "건강하고 행복하세요 ✨", time: "19:15" },
  { id: 3, from: "최지아", amount: 30000,  message: "오래오래 건강하게!",     time: "19:21" },
  { id: 4, from: "한동훈", amount: 200000, message: "축하드립니다 🥳",        time: "19:28" },
];

const MOCK_CHAT = [
  { id: "c1", name: "이수연",  text: "와! 파티 너무 신나요 🎉",     ts: "19:10" },
  { id: "c2", name: "박태현",  text: "축하드립니다!!",               ts: "19:11" },
  { id: "c3", name: "최지아",  text: "노래 틀어주세요~~",            ts: "19:13" },
  { id: "c4", name: "시스템",  text: "노래방 기능이 활성화되었습니다 🎤", ts: "19:15", system: true },
];

const QUICK_AMOUNTS = [10000, 30000, 50000, 100000, 200000, 500000];

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? (url.match(/^[a-zA-Z0-9_-]{11}$/) ? url : null);
}

// ─── Ornament SVG ──────────────────────────────────────────────────────────

function OrnamentLeft({ color }: { color: string }) {
  return (
    <svg width="48" height="80" viewBox="0 0 48 80" fill="none">
      <path d="M24 4 C24 4, 10 14, 6 28 C2 42, 10 54, 24 58" stroke={color} strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <path d="M24 58 C24 58, 10 62, 8 70 C7 75, 14 80, 24 80" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
      <circle cx="24" cy="4"  r="2"   fill={color} opacity="0.5" />
      <circle cx="24" cy="58" r="1.5" fill={color} opacity="0.4" />
      <circle cx="24" cy="80" r="1"   fill={color} opacity="0.3" />
    </svg>
  );
}
function OrnamentRight({ color }: { color: string }) {
  return <OrnamentLeft color={color} />;
}

interface Bouquet { id: number; x: number; emoji: string }
interface ChatMsg  { id: string; name: string; text: string; ts: string; system?: boolean }

// ─── Main page ─────────────────────────────────────────────────────────────

export default function BanquetRoomPage() {
  const params  = useParams();
  const eventId = typeof params.eventId === "string" ? params.eventId : "ev1";
  const meta    = EVENT_META[eventId] ?? DEFAULT_EVENT;
  const theme   = THEMES[meta.theme];

  const isHost = true; // derive from session in production

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [directorOpen, setDirectorOpen] = useState(false);

  // Gift modal
  const [giftOpen,   setGiftOpen]   = useState(false);
  const [giftAmount, setGiftAmount] = useState(50000);
  const [giftMsg,    setGiftMsg]    = useState("");
  const [giftSent,   setGiftSent]   = useState(false);
  const [gifts,      setGifts]      = useState(MOCK_GIFTS);
  const [bouquets,   setBouquets]   = useState<Bouquet[]>([]);
  const bouquetIdRef = useRef(0);

  // Chat popup
  const [chatOpen,  setChatOpen]  = useState(false);
  const [chatMsgs,  setChatMsgs]  = useState<ChatMsg[]>(MOCK_CHAT);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Host camera
  const [hostStream,   setHostStream]   = useState<MediaStream | null>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);

  // Host video panel resize (vertical drag handle)
  const [hostH, setHostH] = useState(0);  // 0 = not yet initialised
  const hostResizing = useRef(false);
  const hostResizeY  = useRef(0);
  const hostResizeH  = useRef(0);

  // Karaoke
  const [karaokeVideoId,  setKaraokeVideoId]  = useState<string | null>(null);
  const [karaokeLyrics,   setKaraokeLyrics]   = useState<string[]>([]);
  const [karaokeInput,    setKaraokeInput]     = useState("");
  const [karaokeOpen,     setKaraokeOpen]      = useState(false);
  const [karaokeUrlErr,   setKaraokeUrlErr]    = useState(false);

  // Reactions / gifts
  const [reactionBurst, setReactionBurst] = useState(false);
  const totalGifts = gifts.reduce((s, g) => s + g.amount, 0);

  // ── Init host panel height ───────────────────────────────────────────────
  useEffect(() => {
    setHostH(Math.round(window.innerHeight * 0.5));
  }, []);

  // ── Host camera ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isHost) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => setHostStream(s))
      .catch(() => {});
    return () => { hostStream?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hostVideoRef.current && hostStream) {
      hostVideoRef.current.srcObject = hostStream;
    }
  }, [hostStream]);

  // ── Host panel vertical resize ───────────────────────────────────────────
  const startHostResize = (e: React.MouseEvent) => {
    e.preventDefault();
    hostResizing.current = true;
    hostResizeY.current  = e.clientY;
    hostResizeH.current  = hostH;
    const onMove = (ev: MouseEvent) => {
      if (!hostResizing.current) return;
      const delta = ev.clientY - hostResizeY.current;
      setHostH(Math.max(160, Math.min(window.innerHeight * 0.8, hostResizeH.current + delta)));
    };
    const onUp = () => { hostResizing.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Chat ─────────────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs.length]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMsgs(prev => [...prev, { id: `m${Date.now()}`, name: "나", text, ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }]);
    setChatInput("");
  };

  // ── Gifts ─────────────────────────────────────────────────────────────────
  const spawnBouquet = useCallback(() => {
    const emojis = ["💐","🌸","🌺","🎀","✨","🎊","🎉"];
    const items: Bouquet[] = Array.from({ length: 8 }, (_, i) => ({
      id: bouquetIdRef.current + i, x: 10 + Math.floor((i / 8) * 80),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    bouquetIdRef.current += 8;
    setBouquets(prev => [...prev, ...items]);
    setTimeout(() => setBouquets(prev => prev.filter(b => !items.find(n => n.id === b.id))), 2000);
  }, []);

  const handleSendGift = () => {
    setGiftSent(true); spawnBouquet();
    setGifts(prev => [{ id: Date.now(), from: "나", amount: giftAmount, message: giftMsg || "축하드립니다!", time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    setTimeout(() => { setGiftOpen(false); setGiftSent(false); setGiftMsg(""); }, 1800);
  };

  // ── Karaoke ───────────────────────────────────────────────────────────────
  const loadKaraoke = () => {
    const id = extractYouTubeId(karaokeInput.trim());
    if (id) { setKaraokeVideoId(id); setKaraokeOpen(false); setKaraokeUrlErr(false); }
    else setKaraokeUrlErr(true);
  };

  // ── ESC ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setGiftOpen(false); setDirectorOpen(false); setChatOpen(false); setKaraokeOpen(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = giftOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [giftOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#070707" }}>

      {/* Director FAB */}
      <button onClick={() => setDirectorOpen(true)}
        className="fixed bottom-20 left-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F", backdropFilter: "blur(12px)" }}>
        <Icon icon="solar:user-star-bold" className="w-3.5 h-3.5" />디렉터 호출
      </button>
      <QuickCallModal open={directorOpen} onClose={() => setDirectorOpen(false)} roomId={eventId} />

      {/* Bouquet particles */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {bouquets.map(b => (
          <div key={b.id} className="absolute text-2xl" style={{ left: `${b.x}%`, bottom: "80px", animation: "bouquet-rise 2s ease-out forwards" }}>
            {b.emoji}
          </div>
        ))}
      </div>

      {/* ── Event Banner ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-4 py-2.5" style={{ background: theme.banner, borderBottom: `1px solid ${theme.accentSoft}` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/rooms/banquet" className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ color: theme.accent, background: theme.accentSoft, border: `1px solid ${theme.accentSoft}` }}>
              ← 뱅큇홀
            </Link>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0"><OrnamentLeft color={theme.accent} /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase"
                  style={{ background: theme.badge, border: `1px solid ${theme.badgeBorder}`, color: theme.accent }}>
                  {meta.type}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{meta.date}</span>
              </div>
              <h1 className="text-sm font-light tracking-wide truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{meta.title}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0"><OrnamentRight color={theme.accent} /></div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accent }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{MOCK_GUESTS.length}명 참석</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Icon icon="solar:gift-bold" className="w-3 h-3" style={{ color: theme.accent }} />
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{totalGifts.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">

        {/* Host camera panel (resizable height) */}
        {hostH > 0 && (
          <div className="relative flex-shrink-0 overflow-hidden" style={{ height: hostH }}>
            {hostStream ? (
              <video ref={hostVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                style={{ background: `radial-gradient(ellipse at center, ${theme.accentSoft}, #070707 70%)` }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-light"
                  style={{ background: theme.accentSoft, border: `2px solid ${theme.accent}`, boxShadow: `0 0 32px ${theme.accentGlow}` }}>
                  {meta.host.charAt(0)}
                </div>
                <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.7)" }}>{meta.host}</span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: theme.badge, color: theme.accent, border: `1px solid ${theme.badgeBorder}` }}>HOST</span>
              </div>
            )}
            {/* LIVE badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accent }} />
              <span className="text-[10px] font-bold tracking-wider" style={{ color: theme.accent }}>LIVE</span>
            </div>
            {/* Reaction burst ring */}
            {reactionBurst && <div className="absolute inset-0 pointer-events-none rounded-none" style={{ boxShadow: `inset 0 0 50px ${theme.accentGlow}` }} />}
            {/* Karaoke popover (host only) */}
            {isHost && karaokeOpen && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 w-80 rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: "rgba(8,8,20,0.97)", border: `1px solid ${theme.badgeBorder}`, backdropFilter: "blur(20px)", boxShadow: "0 12px 40px rgba(0,0,0,0.7)" }}>
                <p className="text-[11px] font-bold tracking-widest" style={{ color: theme.accent }}>🎤 노래방 YouTube URL</p>
                <div className="flex gap-2">
                  <input value={karaokeInput} onChange={e => { setKaraokeInput(e.target.value); setKaraokeUrlErr(false); }}
                    onKeyDown={e => { if (e.key === "Enter") loadKaraoke(); }}
                    placeholder="youtube.com/watch?v=... 또는 ID"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${karaokeUrlErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}` }} />
                  <button type="button" onClick={loadKaraoke}
                    className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ background: theme.accentSoft, border: `1px solid ${theme.badgeBorder}`, color: theme.accent }}>재생</button>
                </div>
                {karaokeUrlErr && <p className="text-[10px] text-red-400">올바른 YouTube URL을 입력해주세요.</p>}
                {karaokeVideoId && (
                  <button type="button" onClick={() => { setKaraokeVideoId(null); setKaraokeInput(""); }}
                    className="text-[11px] py-1.5 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.8)" }}>
                    🔴 영상 중지
                  </button>
                )}
                <div className="border-t pt-2.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>가사 입력 (선택)</p>
                  <textarea placeholder={"가사를 한 줄씩 입력하면\n화면 하단에 표시됩니다"}
                    rows={3} className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20 resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.7 }}
                    onChange={e => setKaraokeLyrics(e.target.value.split("\n").filter(l => l.trim()))} />
                </div>
              </div>
            )}
            {/* Vertical resize handle */}
            <div className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize flex items-center justify-center group"
              style={{ background: "rgba(0,0,0,0.4)" }} onMouseDown={startHostResize}>
              <div className="w-10 h-0.5 rounded-full transition-all group-hover:w-16"
                style={{ background: theme.accent, opacity: 0.6 }} />
            </div>
          </div>
        )}

        {/* Guest dock (horizontal scroll) */}
        <div className="flex-shrink-0 px-3 py-2 overflow-x-auto flex items-center gap-2"
          style={{ background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", scrollbarWidth: "none" }}>
          {MOCK_GUESTS.map(g => (
            <div key={g.id} className="relative flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group" style={{ width: 56 }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-light relative overflow-hidden"
                style={{ background: g.role === "host" ? theme.accentSoft : "rgba(255,255,255,0.06)", border: `1.5px solid ${g.role === "host" ? theme.accent : "rgba(255,255,255,0.1)"}`, boxShadow: g.role === "host" ? `0 0 12px ${theme.accentGlow}` : "none" }}>
                {g.name.charAt(0)}
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: g.mic ? "rgba(0,229,255,0.9)" : "rgba(239,68,68,0.8)" }} />
              </div>
              <span className="text-[8px] truncate w-full text-center leading-tight px-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {g.name}
              </span>
              {g.role === "host" && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px] px-1 rounded font-bold"
                  style={{ background: theme.badge, color: theme.accent, border: `1px solid ${theme.badgeBorder}` }}>
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />
      </div>

      {/* ── Karaoke YouTube floating panel ───────────────────────────────── */}
      {karaokeVideoId && (
        <FloatingPanel key={karaokeVideoId} defaultW={640} aspectRatio={16 / 9} zIndex={60}>
          <iframe title="노래방" src={`https://www.youtube.com/embed/${karaokeVideoId}?rel=0&modestbranding=1&autoplay=1`}
            allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="absolute inset-0 w-full h-full border-0" />
        </FloatingPanel>
      )}

      {/* ── Karaoke lyrics teleprompter ──────────────────────────────────── */}
      {karaokeVideoId && karaokeLyrics.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-1 px-6 py-3 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}>
          {karaokeLyrics.slice(0, 4).map((line, i) => (
            <p key={i} className="text-center font-semibold drop-shadow-lg"
              style={{ fontSize: i === 0 ? "1.1rem" : "0.8rem", color: i === 0 ? theme.accent : "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
              {line}
            </p>
          ))}
        </div>
      )}

      {/* ── Floating Chat ─────────────────────────────────────────────────── */}
      {chatOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 rounded-2xl flex flex-col overflow-hidden"
          style={{ height: 380, background: "rgba(6,6,16,0.96)", border: `1px solid ${theme.badgeBorder}`, backdropFilter: "blur(24px)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-xs font-bold" style={{ color: theme.accent }}>💬 채팅</span>
            <button type="button" onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 min-h-0" style={{ scrollbarWidth: "none" }}>
            {chatMsgs.map(msg => msg.system ? (
              <div key={msg.id} className="text-center">
                <span className="text-[10px] text-white/30 italic">{msg.text}</span>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                  style={{ background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.badgeBorder}` }}>
                  {msg.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{msg.name}</span>
                    <span className="text-[9px] text-white/25">{msg.ts}</span>
                  </div>
                  <p className="text-xs text-white/65 mt-0.5 break-words">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
              placeholder="채팅 입력..." maxLength={100}
              className="flex-1 bg-white/5 text-white/80 text-xs px-3 py-1.5 rounded-lg placeholder-white/25 outline-none"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => (e.currentTarget.style.borderColor = theme.accent + "80")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
            <button type="button" onClick={sendChat}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs transition-all active:scale-95"
              style={{ background: theme.accentSoft, border: `1px solid ${theme.badgeBorder}`, color: theme.accent }}>
              <Icon icon="solar:plain-2-linear" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2"
        style={{ background: "rgba(7,7,7,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px)" }}>
        {/* Mic */}
        <button onClick={() => setMicOn(v => !v)}
          className="w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-95 flex-shrink-0"
          style={{ background: micOn ? theme.accentSoft : "rgba(255,255,255,0.04)", border: `1px solid ${micOn ? theme.badgeBorder : "rgba(255,255,255,0.08)"}` }}>
          <Icon icon={micOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"} className="w-5 h-5"
            style={{ color: micOn ? theme.accent : "rgba(255,255,255,0.3)" }} />
        </button>
        {/* Camera */}
        <button onClick={() => setCamOn(v => !v)}
          className="w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-95 flex-shrink-0"
          style={{ background: camOn ? theme.accentSoft : "rgba(255,255,255,0.04)", border: `1px solid ${camOn ? theme.badgeBorder : "rgba(255,255,255,0.08)"}` }}>
          <Icon icon={camOn ? "solar:camera-bold" : "solar:camera-slash-bold"} className="w-5 h-5"
            style={{ color: camOn ? theme.accent : "rgba(255,255,255,0.3)" }} />
        </button>

        {/* Chat */}
        <button onClick={() => setChatOpen(v => !v)}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-95 flex-shrink-0"
          style={{ background: chatOpen ? theme.accentSoft : "rgba(255,255,255,0.05)", border: `1px solid ${chatOpen ? theme.badgeBorder : "rgba(255,255,255,0.1)"}` }}>
          <Icon icon="solar:chat-round-bold" className="w-5 h-5" style={{ color: chatOpen ? theme.accent : "rgba(255,255,255,0.4)" }} />
        </button>

        {/* Karaoke */}
        {isHost && (
          <button onClick={() => setKaraokeOpen(v => !v)}
            className="w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-95 flex-shrink-0"
            style={{ background: karaokeVideoId ? theme.accentSoft : "rgba(255,255,255,0.05)", border: `1px solid ${karaokeVideoId ? theme.badgeBorder : "rgba(255,255,255,0.1)"}` }}>
            <Icon icon="solar:music-note-2-bold" className="w-5 h-5" style={{ color: karaokeVideoId ? theme.accent : "rgba(255,255,255,0.4)" }} />
          </button>
        )}

        {/* Reaction */}
        <button onClick={() => { setReactionBurst(true); spawnBouquet(); setTimeout(() => setReactionBurst(false), 600); }}
          className="w-12 h-12 flex items-center justify-center rounded-xl text-xl transition-all active:scale-95 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          🎉
        </button>

        {/* Gift */}
        <button onClick={() => setGiftOpen(true)}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-light tracking-wide text-sm transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.4)", color: "#FF007F", animation: "pulse-glow-pink 3s ease-in-out infinite" }}>
          <Icon icon="solar:gift-bold" className="w-4 h-4" />
          축의금 보내기
        </button>
      </div>

      {/* ── Gift Modal ────────────────────────────────────────────────────── */}
      {giftOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          onClick={e => { if (e.target === e.currentTarget) setGiftOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "rgba(15,15,18,0.98)", border: "1px solid rgba(255,0,127,0.2)", boxShadow: "0 0 60px rgba(255,0,127,0.15)" }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2"><span className="text-xl">💌</span><span className="text-sm font-medium text-white/90">축의금 전송</span></div>
              <button onClick={() => setGiftOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon icon="solar:close-bold" className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,0,127,0.06)", border: "1px solid rgba(255,0,127,0.15)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm" style={{ background: "rgba(255,0,127,0.15)", color: "#FF007F" }}>{meta.host.charAt(0)}</div>
                <div><p className="text-xs font-medium text-white/80">{meta.host}</p><p className="text-[10px] text-white/30">축의금 수령인</p></div>
              </div>
              <div>
                <p className="text-[10px] mb-2 tracking-wider uppercase text-white/30">금액 선택</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_AMOUNTS.map(amt => (
                    <button key={amt} onClick={() => setGiftAmount(amt)}
                      className="py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                      style={{ background: giftAmount === amt ? "rgba(255,0,127,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${giftAmount === amt ? "rgba(255,0,127,0.5)" : "rgba(255,255,255,0.06)"}`, color: giftAmount === amt ? "#FF007F" : "rgba(255,255,255,0.5)" }}>
                      {(amt / 10000).toLocaleString()}만
                    </button>
                  ))}
                </div>
              </div>
              <input type="number" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))}
                className="w-full py-3 px-4 rounded-xl outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", caretColor: "#FF007F" }} />
              <textarea rows={2} placeholder="축하 메시지 (선택)" value={giftMsg} onChange={e => setGiftMsg(e.target.value)}
                className="w-full py-3 px-4 rounded-xl outline-none text-sm resize-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", caretColor: "#FF007F" }} />
              <button onClick={handleSendGift} disabled={giftSent || giftAmount < 1000}
                className="w-full py-3.5 rounded-xl font-light tracking-wider text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "rgba(255,0,127,0.12)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F" }}>
                {giftSent ? <span className="flex items-center justify-center gap-2"><Icon icon="solar:check-circle-bold" className="w-4 h-4" />전송 완료! 💐</span>
                  : `${giftAmount.toLocaleString()}원 전송`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bouquet-rise {
          0%   { transform: translateY(0) scale(0.5); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(-180px) scale(1.2); opacity: 0; }
        }
        @keyframes pulse-glow-pink {
          0%, 100% { box-shadow: 0 0 10px rgba(255,0,127,0.3); }
          50%       { box-shadow: 0 0 24px rgba(255,0,127,0.7); }
        }
      `}</style>
    </div>
  );
}
