"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageContext";
import { LangCode, FLAGS, LANG_NAMES, T } from "@/lib/i18n/translations";
import { useWallet } from "@/lib/hooks/useWallet";
import { useSettings } from "@/lib/context/SettingsContext";
import { getUserNickname, setUserNickname, getUserMembership } from "@/lib/utils/userSession";
import dynamic from "next/dynamic";

const ChargeModal = dynamic(() => import("@/components/ui/ChargeModal"), { ssr: false });

// ── Mock data ─────────────────────────────────────────────────
const MOCK_ROOMS = [
  { id: "r1", type: "colosseum", title: "90년대 감성 여행 🎵", host: "별빛가수", viewers: 127, isLive: true, tags: ["#발라드", "#트로트"], href: "/rooms/colosseum" },
  { id: "r2", type: "banquet", title: "🎂 축 서른! 김민준의 생일파티", host: "민준이친구들", viewers: 14, isLive: true, tags: ["#생일파티"], href: "/rooms/banquet/ev1" },
  { id: "r3", type: "singertalk", title: "1:1 노래 매칭 중", host: "랜덤매칭", viewers: 2, isLive: true, tags: ["#팝", "#힙합"], href: "/rooms/singertalk" },
  { id: "r4", type: "colosseum", title: "K-POP 배틀 🎤", host: "가왕도전자", viewers: 89, isLive: false, tags: ["#팝"], href: "/rooms/colosseum" },
  { id: "r5", type: "banquet", title: "🏢 넥스트레벨 창립 3주년", host: "NEXTLEVEL", viewers: 35, isLive: false, tags: ["#기업행사"], href: "/rooms/banquet/ev4" },
];

const RECENT_SEARCHES = ["90년대 감성", "발라드 매칭", "생일파티"];

const SEARCH_CHIPS = [
  { id: "all", label: "전체" },
  { id: "colosseum", label: "방구석가왕" },
  { id: "banquet", label: "온동네라운지" },
  { id: "singertalk", label: "싱어톡" },
  { id: "black", label: "Black" },
  { id: "ballad", label: "#발라드" },
  { id: "pop", label: "#팝" },
  { id: "trot", label: "#트로트" },
  { id: "hiphop", label: "#힙합" },
  { id: "jazz", label: "#재즈" },
  { id: "live", label: "#LIVE중" },
  { id: "available", label: "#입장가능" },
];

const ROOM_TYPE_COLORS: Record<string, string> = {
  colosseum: "#00E5FF",
  banquet: "#C9A84C",
  singertalk: "#FF007F",
  black: "#C9A84C",
};

type VVIPScreen = "closed" | "preview" | "signup" | "success";
const LANGS: LangCode[] = ["KR", "EN", "JP", "CN"];

// ── Gold dust ─────────────────────────────────────────────────
function GoldDustSmall() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 37 + 11) % 100}%`,
    size: (i % 3) * 0.5 + 0.8,
    duration: (i % 6) * 3 + 12,
    delay: (i % 5) * 2.4,
    dx: ((i % 5) - 2) * 25,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {particles.map((p) => (
        <div key={p.id} className="absolute rounded-full"
          style={{ left: p.left, bottom: "-2px", width: `${p.size}px`, height: `${p.size}px`, background: "#C9A84C", opacity: 0, ["--dx" as string]: `${p.dx}px`, animation: `gold-drift-sm ${p.duration}s linear ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

// ── Form field ────────────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>{label}</label>
      {children}
    </div>
  );
}

// ── Control Panel sidebar body ────────────────────────────────
function ControlPanelBody() {
  const { t } = useLanguage();
  return (
    <div className="p-5 flex flex-col gap-8">
      {/* Kit Store */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-white/60 tracking-widest">{t.sidebar.kitStore}</h4>
          <a className="text-[10px] text-[#00E5FF] hover:underline" href="#">{t.sidebar.viewAll}</a>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-white/[0.04] transition-all cursor-pointer group">
            <Icon icon="solar:camera-linear" className="text-2xl text-white/50 group-hover:text-[#00E5FF] group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] transition-all" />
            <span className="text-[10px] font-light text-white/80">{t.sidebar.cam}</span>
            <button className="w-full mt-1 py-1 text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] rounded hover:bg-[#00E5FF]/20 transition-colors">450 O₂</button>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-white/[0.04] transition-all cursor-pointer group">
            <Icon icon="solar:microphone-linear" className="text-2xl text-white/50 group-hover:text-[#FF007F] group-hover:drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] transition-all" />
            <span className="text-[10px] font-light text-white/80">{t.sidebar.mic}</span>
            <button className="w-full mt-1 py-1 text-[10px] bg-[#FF007F]/10 text-[#FF007F] rounded hover:bg-[#FF007F]/20 transition-colors">300 O₂</button>
          </div>
        </div>
      </div>
      {/* F&B */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-medium text-white/60 tracking-widest">{t.sidebar.fnb}</h4>
        <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 hover:border-[#00E5FF]/30 transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform">
              <Icon icon="solar:bottle-linear" className="text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white/90">Dom Pérignon L.</span>
              <span className="text-[10px] font-light text-[#00E5FF]/70">{t.sidebar.camLoc}</span>
            </div>
          </div>
          <button className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-[#00E5FF]/20 text-white/50 hover:text-[#00E5FF] rounded transition-all">
            <Icon icon="solar:add-linear" className="text-sm" />
          </button>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center text-white/70 group-hover:scale-110 transition-transform">
              <Icon icon="solar:wineglass-triangle-linear" className="text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white/90">{t.sidebar.cocktails}</span>
              <span className="text-[10px] font-light text-white/40">{t.sidebar.cocktailsLoc}</span>
            </div>
          </div>
          <button className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/50 hover:text-white rounded transition-all">
            <Icon icon="solar:add-linear" className="text-sm" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] text-white/40 flex items-center gap-1">
            <Icon icon="solar:map-point-linear" /> {t.sidebar.autoDropLocation}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input defaultChecked className="sr-only peer" type="checkbox" />
            <div className="w-7 h-4 bg-white/10 rounded-full peer peer-checked:after:translate-x-[12px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00E5FF] peer-checked:shadow-[0_0_8px_rgba(0,229,255,0.4)] border border-white/5"></div>
          </label>
        </div>
      </div>
      {/* Inventory */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-medium text-white/60 tracking-widest">{t.sidebar.inventory}</h4>
        <div className="bg-black/40 border border-white/5 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#FF007F]/10 flex items-center justify-center text-[#FF007F]"><Icon icon="solar:stars-linear" className="text-sm" /></div>
              <span className="text-xs text-white/80">{t.sidebar.bouquets}</span>
            </div>
            <span className="text-xs font-medium text-white">x12</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF]"><Icon icon="solar:cup-star-linear" className="text-sm" /></div>
              <span className="text-xs text-white/80">{t.sidebar.champagne}</span>
            </div>
            <span className="text-xs font-medium text-white">x3</span>
          </div>
          <Link href="/payments/charge" className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-medium tracking-widest uppercase text-white/80 rounded transition-colors border border-white/5 block text-center">
            {t.sidebar.recharge}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Hamburger menu ────────────────────────────────────────────
function HamburgerMenu({
  open, onClose, onSearchOpen, onChargeOpen, walletBalance,
}: {
  open: boolean; onClose: () => void; onSearchOpen: () => void;
  onChargeOpen: () => void; walletBalance: number;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [displayNick, setDisplayNick] = useState("...");
  const [membership, setMembership] = useState<"free" | "vip" | "black">("free");

  useEffect(() => {
    if (!open) return;
    setDisplayNick(getUserNickname());
    setMembership(getUserMembership());
  }, [open]);

  const navigate = (href: string) => { onClose(); router.push(href); };

  const NAV_ITEMS = [
    { icon: "🎤", label: t.nav.roomKing, href: "/rooms/colosseum" },
    { icon: "🥂", label: t.nav.banquet, href: "/rooms/banquet" },
    { icon: "💬", label: t.nav.singerTalk, href: "/rooms/singertalk" },
    { icon: "🖤", label: t.nav.black, href: "/rooms/black" },
    { icon: "🛍️", label: t.nav.shop, href: "/shop" },
    { icon: "🎭", label: t.nav.vibeDirector, href: "/entertainers" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={onClose} />}

      {/* Slide-down panel */}
      <div
        className="fixed top-16 left-0 right-0 z-50 overflow-y-auto hide-scrollbar"
        style={{
          maxHeight: "calc(100vh - 64px)",
          background: "rgba(7,7,7,0.92)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transform: open ? "translateY(0)" : "translateY(-12px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 300ms ease, opacity 300ms ease",
        }}
      >
        <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto">

          {/* Live status */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF007F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF007F]" />
            </div>
            <span className="text-xs font-light text-white/70">
              {t.header.live} <span className="text-white/40 mx-1">|</span>
              <span className="text-white font-medium">1,204</span> {t.header.users} <span className="text-white/40 mx-1">|</span>
              <span className="text-white font-medium">342</span> {t.header.rooms}
            </span>
          </div>

          {/* Wallet */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onClose(); onChargeOpen(); }}
              className="flex items-center gap-2 p-3 rounded-xl transition-all hover:border-[#00E5FF]/25"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Icon icon="solar:wallet-linear" className="text-lg text-[#00E5FF]/70" />
              <span className="text-xs font-medium text-white/90 tabular-nums">{walletBalance.toLocaleString()} <span className="text-white/40 font-light">O₂</span></span>
            </button>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Icon icon="solar:stars-linear" className="text-lg text-[#FF007F]/70" />
              <span className="text-xs font-medium text-white/90">12 <span className="text-white/40 font-light">BQ</span></span>
            </div>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Profile" className="w-full h-full object-cover"
                src="https://blogger.googleusercontent.com/img/a/AVvXsEh8T2CGGbCPmxEBGwiq2v-luepjn0bvKXYnpLLMOI9Rvh8XtVXD-ela3NDn9kNbUiDdQURDhafZDywL3qtFsx9UWYG-UEN_qDUgIjdXW1tcItXYIsa3NaxAdg4d9IBU-ffGusPR04wAuvxhNPNJ5Gr0MMHLHxH-chB8z_is36bhvHZhVBDPguHXAs_QEI8?img=32" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{displayNick}</p>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded self-start tracking-wider"
                style={
                  membership === "black"
                    ? { background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }
                    : membership === "vip"
                    ? { background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }
                }
              >
                {membership === "black" ? "BLACK" : membership === "vip" ? "VIP" : "FREE"}
              </span>
            </div>
          </div>

          {/* Wallet charge */}
          <button
            onClick={() => { onClose(); onChargeOpen(); }}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: "rgba(0,229,255,0.07)", border: "1px solid rgba(0,229,255,0.28)", color: "#00E5FF" }}
          >
            💎 {walletBalance.toLocaleString()} O₂ · 잔액 충전
          </button>

          {/* Search shortcut */}
          <button onClick={() => { onClose(); onSearchOpen(); }}
            className="flex items-center gap-2 w-full p-3 rounded-xl text-sm text-white/40 transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Icon icon="solar:magnifer-linear" className="w-4 h-4" />
            <span className="text-xs">{t.search.placeholder}</span>
          </button>

          {/* Navigation */}
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.href} onClick={() => navigate(item.href)}
                className="flex items-center gap-3 w-full p-3.5 rounded-xl text-sm font-medium text-white/70 hover:text-[#00E5FF] transition-all active:scale-95 text-left"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-base">{item.icon}</span>
                {item.label}
                <Icon icon="solar:arrow-right-linear" className="w-3.5 h-3.5 ml-auto opacity-40" />
              </button>
            ))}
          </div>

          {/* Close */}
          <button onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs text-white/30 transition-all active:scale-95"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
            {t.nav.close}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Search Modal ──────────────────────────────────────────────
function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setFilter("all");
      setSelectedIdx(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelectedIdx(-1); }, [query, filter]);

  const filtered = MOCK_ROOMS.filter((r) => {
    const q = query.toLowerCase();
    const matchesQuery = q === "" || r.title.toLowerCase().includes(q) || r.host.toLowerCase().includes(q) || r.tags.some((tg) => tg.toLowerCase().includes(q));
    const matchesFilter = filter === "all" || r.type === filter || (filter.startsWith("#") ? r.tags.includes(filter) : r.tags.some((tg) => tg.includes(filter)));
    return matchesQuery && matchesFilter;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && selectedIdx >= 0) { onClose(); router.push(filtered[selectedIdx].href); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-0 px-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl flex flex-col gap-4 p-5 rounded-2xl max-h-[80vh] overflow-hidden"
        style={{ background: "rgba(5,5,5,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 60px rgba(0,0,0,0.8)" }}>

        {/* Header row */}
        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-white/40 font-medium tracking-wider">{t.search.title}</span>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-shrink-0">
          <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t.search.placeholder}
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,229,255,0.3)", boxShadow: "0 0 12px rgba(0,229,255,0.08)", caretColor: "#00E5FF" }} />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 flex-shrink-0 -mx-1 px-1">
          {SEARCH_CHIPS.map((chip) => (
            <button key={chip.id} onClick={() => setFilter(chip.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
              style={
                filter === chip.id
                  ? { background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.5)", color: "#00E5FF" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
              }>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Results / recent searches */}
        <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar flex-1 min-h-0">
          {query === "" && filter === "all" ? (
            <>
              <p className="text-[10px] text-white/30 font-medium tracking-wider flex-shrink-0">{t.search.recent}</p>
              <div className="flex flex-wrap gap-2">
                {RECENT_SEARCHES.map((s) => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    <Icon icon="solar:clock-circle-linear" className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>
              <div className="h-px mt-2" style={{ background: "rgba(255,255,255,0.05)" }} />
              <p className="text-[10px] text-white/20 tracking-wider">추천 방</p>
            </>
          ) : null}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/20 text-sm">
              {t.search.empty}
            </div>
          ) : (
            filtered.map((room, idx) => {
              const color = ROOM_TYPE_COLORS[room.type] ?? "#00E5FF";
              return (
                <button key={room.id}
                  onClick={() => { onClose(); router.push(room.href); }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-95"
                  style={{
                    background: idx === selectedIdx ? "rgba(0,229,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${idx === selectedIdx ? "rgba(0,229,255,0.25)" : "rgba(255,255,255,0.05)"}`,
                  }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                    <Icon
                      icon={room.type === "colosseum" ? "solar:microphone-bold" : room.type === "banquet" ? "solar:calendar-bold" : room.type === "singertalk" ? "solar:chat-round-bold" : "solar:shield-keyhole-bold"}
                      className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {room.isLive && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-[#FF007F]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] animate-pulse" />{t.search.live}
                        </span>
                      )}
                      <p className="text-xs font-semibold text-white/85 truncate">{room.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                      <span>{room.host}</span>
                      <span>·</span>
                      <span>{room.viewers}명</span>
                      {room.tags.slice(0, 2).map((tg) => <span key={tg} className="text-[#00E5FF]/50">{tg}</span>)}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold flex-shrink-0 px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                    {t.search.enter}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className="relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200"
      style={{
        background: checked
          ? disabled ? "rgba(0,229,255,0.35)" : "#00E5FF"
          : "rgba(255,255,255,0.1)",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: checked && !disabled ? "0 0 8px rgba(0,229,255,0.3)" : "none",
      }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

// ── Settings row ──────────────────────────────────────────────
function SettingRow({
  icon,
  label,
  note,
  control,
}: {
  icon: string;
  label: string;
  note?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm flex-shrink-0">{icon}</span>
        <span className="text-xs text-white/55">{label}</span>
        {note && <span className="text-[9px] text-white/20 truncate">{note}</span>}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

// ── Profile Dropdown ──────────────────────────────────────────
function ProfileDropdown({
  open,
  onClose,
  walletBalance,
  onChargeOpen,
  isVVIPMember,
  isVVIPApplied,
  onOpenVVIP,
}: {
  open: boolean;
  onClose: () => void;
  walletBalance: number;
  onChargeOpen: () => void;
  isVVIPMember: boolean;
  isVVIPApplied: boolean;
  onOpenVVIP: () => void;
}) {
  const { lang, setLang } = useLanguage();
  const { screenEffects, soundEffects, notifications, setScreenEffects, setSoundEffects, setNotifications } = useSettings();
  const router = useRouter();

  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [displayNick, setDisplayNick] = useState("...");
  const [membership, setMembership] = useState<"free" | "vip" | "black">("free");
  const nickInputRef = useRef<HTMLInputElement>(null);

  // Read profile data whenever dropdown opens
  useEffect(() => {
    if (!open) return;
    const nick = getUserNickname();
    setDisplayNick(nick);
    setNickInput(nick);
    setMembership(getUserMembership());
  }, [open]);

  useEffect(() => {
    if (editingNick) nickInputRef.current?.focus();
  }, [editingNick]);

  const saveNickname = () => {
    const trimmed = nickInput.trim();
    if (trimmed) {
      setUserNickname(trimmed);
      setDisplayNick(trimmed);
    }
    setEditingNick(false);
  };

  const handleLogout = async () => {
    try { localStorage.clear(); } catch {}
    await signOut({ callbackUrl: "/auth/login" });
  };

  const badge =
    membership === "black"
      ? { bg: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C", label: "BLACK" }
      : membership === "vip"
      ? { bg: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF", label: "VIP" }
      : { bg: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)", label: "FREE" };

  if (!open) return null;

  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 flex flex-col overflow-hidden"
      style={{
        width: 296,
        maxWidth: "calc(100vw - 16px)",
        background: "rgba(8,8,10,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.04)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        animation: "dropdown-in 180ms ease forwards",
      }}
    >
      <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: "min(560px, 85dvh)" }}>

        {/* ── §1 Profile ── */}
        <div className="p-4 flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Avatar"
                className="w-full h-full object-cover"
                src="https://blogger.googleusercontent.com/img/a/AVvXsEh8T2CGGbCPmxEBGwiq2v-luepjn0bvKXYnpLLMOI9Rvh8XtVXD-ela3NDn9kNbUiDdQURDhafZDywL3qtFsx9UWYG-UEN_qDUgIjdXW1tcItXYIsa3NaxAdg4d9IBU-ffGusPR04wAuvxhNPNJ5Gr0MMHLHxH-chB8z_is36bhvHZhVBDPguHXAs_QEI8?img=32"
              />
            </div>
            {/* Online dot */}
            <div
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: "#4ade80", borderColor: "rgb(8,8,10)" }}
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {/* Nickname row */}
            <div className="flex items-center gap-1.5">
              {editingNick ? (
                <input
                  ref={nickInputRef}
                  value={nickInput}
                  onChange={(e) => setNickInput(e.target.value)}
                  onBlur={saveNickname}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveNickname();
                    if (e.key === "Escape") { setEditingNick(false); }
                  }}
                  className="text-sm font-medium text-white bg-transparent border-b outline-none flex-1 pb-0.5 min-w-0"
                  style={{ borderColor: "rgba(0,229,255,0.5)", caretColor: "#00E5FF" }}
                  maxLength={20}
                />
              ) : (
                <span className="text-sm font-medium text-white/90 truncate flex-1">{displayNick}</span>
              )}
              <button
                onClick={() => setEditingNick((v) => !v)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors hover:text-[#00E5FF]"
                style={{ color: "rgba(255,255,255,0.22)" }}
                title="닉네임 변경"
              >
                <Icon icon="solar:pen-2-linear" className="w-3 h-3" />
              </button>
            </div>
            {/* Membership badge */}
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded self-start tracking-wider"
              style={{ background: badge.bg, border: badge.border, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* ── §2 Wallet ── */}
        <div className="px-4 pb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black tabular-nums" style={{ color: "#00E5FF" }}>
              💎 {walletBalance.toLocaleString()}
              <span className="text-xs font-medium ml-1" style={{ color: "rgba(0,229,255,0.55)" }}>O₂</span>
            </span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,0,127,0.75)" }}>⭐ 12 BQ</span>
          </div>
          <Link
            href="/payments/charge"
            onClick={onClose}
            className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] block text-center"
            style={{ background: "rgba(0,229,255,0.07)", border: "1px solid rgba(0,229,255,0.28)", color: "#00E5FF" }}
          >
            잔액 충전
          </Link>
        </div>

        <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* ── §4 Settings ── */}
        <div className="px-4 py-3 flex flex-col gap-3.5">

          {/* Language */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🌐</span>
              <span className="text-xs text-white/55">언어</span>
            </div>
            <div className="flex items-center gap-1">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="w-8 h-7 flex items-center justify-center rounded-lg text-sm transition-all"
                  style={
                    lang === l
                      ? { background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
                  }
                  title={LANG_NAMES[l]}
                >
                  {FLAGS[l]}
                </button>
              ))}
            </div>
          </div>

          <SettingRow icon="🔔" label="알림" control={<Toggle checked={notifications} onChange={setNotifications} />} />
          <SettingRow icon="🔊" label="사운드" control={<Toggle checked={soundEffects} onChange={setSoundEffects} />} />
          <SettingRow icon="✨" label="화면 효과" control={<Toggle checked={screenEffects} onChange={setScreenEffects} />} />
          <SettingRow
            icon="🌙"
            label="다크모드"
            note="항상 다크모드"
            control={<Toggle checked disabled onChange={() => {}} />}
          />
        </div>

        <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* ── §6 My Activity ── */}
        <div className="px-2 py-1.5 flex flex-col">
          <button
            onClick={() => { onClose(); router.push("/admin"); }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white/55 hover:bg-white/[0.04] hover:text-white/85 transition-all text-left"
          >
            <span className="text-sm">📊</span>
            내 활동 통계
            <Icon icon="solar:arrow-right-linear" className="w-3 h-3 ml-auto opacity-25" />
          </button>
          <button
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white/55 hover:bg-white/[0.04] hover:text-white/85 transition-all text-left"
          >
            <span className="text-sm">💸</span>
            수익 출금
            <Icon icon="solar:arrow-right-linear" className="w-3 h-3 ml-auto opacity-25" />
          </button>
        </div>

        <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* ── §8 VVIP ── */}
        <div className="px-4 py-3">
          {isVVIPMember ? (
            <div className="flex items-center gap-2 text-xs font-medium py-1" style={{ color: "#C9A84C" }}>
              🖤 Black 멤버 ✓
            </div>
          ) : isVVIPApplied ? (
            <div className="flex items-center gap-2 text-xs py-1" style={{ color: "rgba(201,168,76,0.5)" }}>
              🖤 심사중...
            </div>
          ) : (
            <button
              onClick={() => { onClose(); onOpenVVIP(); }}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.28)", color: "#C9A84C" }}
            >
              🖤 Black 멤버십 신청
            </button>
          )}
        </div>

        <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* ── §10 Bottom actions ── */}
        <div className="px-2 py-1.5 flex flex-col">
          <a
            href="mailto:support@loxygene.com"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all"
          >
            <span className="text-sm">💬</span>
            고객센터
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs hover:bg-red-500/10 transition-all text-left"
            style={{ color: "rgba(239,68,68,0.65)" }}
          >
            <span className="text-sm">🚪</span>
            로그아웃
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────
function Home() {
  const router = useRouter();
  const { status } = useSession();
  const { t, fading } = useLanguage();

  // Auth guard — redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  // Wallet
  const { wallet, chargeCredits } = useWallet();
  const [chargeModalOpen, setChargeModalOpen] = useState(false);

  // Header overlays
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // VVIP state
  const [accessCode, setAccessCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [isVVIPApplied, setIsVVIPApplied] = useState(false);
  const [isVVIPMember, setIsVVIPMember] = useState(false);
  const [codeInputFocused, setCodeInputFocused] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [vvipScreen, setVvipScreen] = useState<VVIPScreen>("closed");
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [codeShake, setCodeShake] = useState(false);

  // VVIP form
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formReferral, setFormReferral] = useState("");
  const [formScale, setFormScale] = useState("");
  const [formAgreed, setFormAgreed] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsVVIPApplied(localStorage.getItem("isVVIPApplied") === "true");
    setIsVVIPMember(localStorage.getItem("isVVIPMember") === "true");
  }, []);

  // Global ESC handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
        setVvipScreen("closed");
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen || vvipScreen !== "closed" || chargeModalOpen || profileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, searchOpen, vvipScreen, chargeModalOpen, profileOpen]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const openVVIP = useCallback(() => {
    if (isVVIPMember) { codeInputRef.current?.focus(); return; }
    setVvipScreen("preview");
  }, [isVVIPMember]);

  const handleCodeSubmit = () => {
    if (!accessCode.trim()) {
      setCodeError("코드를 입력하세요");
      setCodeShake(true);
      setTimeout(() => { setCodeShake(false); setCodeError(""); }, 1500);
      return;
    }
    if (accessCode.toUpperCase() === "BLACK2024") {
      setCodeError("");
      setIsScanning(true);
      setTimeout(() => { setScanDone(true); setTimeout(() => router.push("/rooms/black"), 600); }, 1400);
    } else {
      setCodeError("잘못된 코드입니다");
      setCodeShake(true);
      setTimeout(() => { setCodeShake(false); setCodeError(""); setAccessCode(""); }, 1500);
    }
  };

  const handleSignupSubmit = () => {
    localStorage.setItem("isVVIPApplied", "true");
    setIsVVIPApplied(true);
    setVvipScreen("success");
  };

  const closeVVIP = () => { setVvipScreen("closed"); setPreviewPlaying(false); };

  // Derived values
  const codeDisabled = isScanning;
  const codePlaceholder = isVVIPMember ? t.cards.black.codePlaceholder : isVVIPApplied ? t.cards.black.waitingPlaceholder : t.cards.black.codePlaceholder;

  const blackBadge = isVVIPMember ? (
    <div className="px-2 py-1 border border-[#C9A84C]/50 bg-[#C9A84C]/10 rounded text-[9px] tracking-[0.2em]" style={{ color: "#C9A84C" }}>{t.cards.black.member}</div>
  ) : isVVIPApplied ? (
    <div className="px-2 py-1 border border-[#C9A84C]/30 bg-[#C9A84C]/5 rounded text-[9px] tracking-[0.2em]" style={{ color: "rgba(201,168,76,0.7)" }}>{t.cards.black.pending}</div>
  ) : (
    <div className="px-2 py-1 border border-[#FF007F]/30 bg-[#FF007F]/5 rounded text-[9px] text-[#FF007F] tracking-[0.2em]">{t.cards.black.locked}</div>
  );

  const featureCards = [
    { icon: "🔏", title: t.vvip.feature1Title, label: t.vvip.feature1Label, desc: t.vvip.feature1Desc },
    { icon: "🍾", title: t.vvip.feature2Title, label: t.vvip.feature2Label, desc: t.vvip.feature2Desc },
    { icon: "💎", title: t.vvip.feature3Title, label: t.vvip.feature3Label, desc: t.vvip.feature3Desc },
  ];

  const scaleOptions = [
    { id: "small", label: t.vvip.scaleSmall },
    { id: "mid", label: t.vvip.scaleMid },
    { id: "large", label: t.vvip.scaleLarge },
    { id: "director", label: t.vvip.scaleDirector },
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col antialiased selection:bg-[#00E5FF] selection:text-black">

      {/* ── Global Header ── */}
      <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white/[0.01] backdrop-blur-xl border-b border-white/5 z-40 shrink-0 gap-2">

        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <h1 className="text-xl tracking-tighter font-light text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)] select-none">
            L&apos;OXYGÈNE
          </h1>
        </div>

        {/* Live status — desktop only */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF007F] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF007F] drop-shadow-[0_0_5px_rgba(255,0,127,1)]" />
          </div>
          <span className="text-xs font-light tracking-wide text-white/80">
            {t.header.live} <span className="text-white/40 mx-1">|</span>{" "}
            <span className="font-medium text-white">1,204</span> {t.header.users}{" "}
            <span className="text-white/40 mx-1">|</span>{" "}
            <span className="font-medium text-white">342</span> {t.header.rooms}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search — always visible */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center w-11 h-11 rounded-xl transition-all hover:border-white/20"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            aria-label="Search">
            <Icon icon="solar:magnifer-linear" className="w-4 h-4 text-white/60" />
          </button>

          {/* Shop — desktop only */}
          <Link
            href="/shop"
            title="쇼핑몰"
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:bg-white/10 group"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <Icon icon="solar:bag-3-linear" className="w-4.5 h-4.5 text-white/60 group-hover:text-[#00E5FF] transition-colors" />
          </Link>

          {/* Profile avatar + dropdown — desktop */}
          <div className="relative hidden lg:block" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="w-11 h-11 rounded-full border overflow-hidden relative group flex-shrink-0 transition-all"
              style={{
                borderColor: profileOpen ? "rgba(0,229,255,0.6)" : "rgba(255,255,255,0.1)",
                boxShadow: profileOpen ? "0 0 12px rgba(0,229,255,0.35)" : "none",
              }}
              aria-label="프로필 메뉴"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF]/20 to-[#FF007F]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Profile" className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:opacity-100 group-hover:mix-blend-normal transition-all"
                src="https://blogger.googleusercontent.com/img/a/AVvXsEh8T2CGGbCPmxEBGwiq2v-luepjn0bvKXYnpLLMOI9Rvh8XtVXD-ela3NDn9kNbUiDdQURDhafZDywL3qtFsx9UWYG-UEN_qDUgIjdXW1tcItXYIsa3NaxAdg4d9IBU-ffGusPR04wAuvxhNPNJ5Gr0MMHLHxH-chB8z_is36bhvHZhVBDPguHXAs_QEI8?img=32" />
            </button>
            <ProfileDropdown
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              walletBalance={wallet.balance}
              onChargeOpen={() => setChargeModalOpen(true)}
              isVVIPMember={isVVIPMember}
              isVVIPApplied={isVVIPApplied}
              onOpenVVIP={openVVIP}
            />
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:bg-white/10"
            style={{
              background: menuOpen ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.05)",
              border: menuOpen ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(255,255,255,0.10)",
            }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <div style={{ position: "relative", width: 20, height: 20 }}>
              <div style={{
                position: "absolute", inset: 0,
                transition: "opacity 200ms ease, transform 200ms ease",
                opacity: menuOpen ? 0 : 1,
                transform: menuOpen ? "rotate(90deg) scale(0.7)" : "rotate(0deg) scale(1)",
                color: "rgba(255,255,255,0.8)",
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{
                position: "absolute", inset: 0,
                transition: "opacity 200ms ease, transform 200ms ease",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.7)",
                color: "#00E5FF",
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* ── Hamburger menu overlay ── */}
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSearchOpen={() => setSearchOpen(true)} onChargeOpen={() => setChargeModalOpen(true)} walletBalance={wallet.balance} />

      {/* ── Main layout (content fades on lang change) ── */}
      <div className="flex-1 flex overflow-hidden relative" style={{ opacity: fading ? 0 : 1, transition: "opacity 0.2s ease" }}>

        {/* Dashboard main — scrollable */}
        <main className="flex-1 overflow-y-auto hide-scrollbar p-4 lg:p-8 flex flex-col gap-6 relative">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00E5FF]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF007F]/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Hero */}
          <section className="relative w-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 backdrop-blur-sm min-h-[220px] sm:min-h-[280px] lg:min-h-[340px] flex flex-col items-center justify-center p-4 sm:p-8 group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10 pointer-events-none" />
            <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-700 mix-blend-screen pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,229,255,0.2), #070707, #070707)" }} />
            <div className="absolute inset-0 opacity-20 z-10 pointer-events-none mix-blend-overlay"
              style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+")` }} />
            <div className="relative z-20 flex flex-col items-center text-center gap-4 sm:gap-6 w-full max-w-2xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <Icon icon="solar:fire-linear" className="text-sm text-[#FF007F] animate-pulse" />
                <span className="text-[10px] sm:text-xs font-light tracking-widest text-white/80 uppercase">{t.hero.trending}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 drop-shadow-lg">
                {t.hero.tagline}
              </h2>
              {t.hero.taglineSub && (
                <p className="text-xs sm:text-sm text-white/45 max-w-md text-center leading-relaxed">
                  {t.hero.taglineSub}
                </p>
              )}
              <Link href="/rooms/colosseum/room-001"
                className="relative mt-1 sm:mt-2 px-5 sm:px-8 py-3 sm:py-4 bg-[#FF007F]/10 border border-[#FF007F]/50 rounded-full overflow-hidden transition-all hover:scale-[1.02] active:scale-95 group/btn"
                style={{ animation: "pulse-glow-pink 3s infinite" }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF007F]/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 flex items-center gap-2 sm:gap-3 text-sm sm:text-lg lg:text-xl font-medium tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                  <Icon icon="solar:play-circle-linear" className="text-xl sm:text-2xl text-[#FF007F] group-hover/btn:scale-110 transition-transform flex-shrink-0" />
                  {t.hero.cta}
                </span>
              </Link>
            </div>
          </section>

          {/* Feature highlights */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "🎉", title: "자유로운 파티", desc: "최대 50명과 실시간 화상 파티", color: "#00E5FF" },
              { icon: "🎤", title: "노래방 옵션",   desc: "필요할 때 켜는 온라인 가라오케", color: "#ec4899" },
              { icon: "🥂", title: "F&B 딜리버리", desc: "파티에 음료와 음식을 배달",     color: "#f59e0b" },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: f.color }}>{f.title}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate">{f.desc}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Cards grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">

            {/* Card A: Room King */}
            <div className="group relative bg-white/[0.02] border border-white/5 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/[0.02] rounded-xl p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="absolute -right-6 -top-6 text-[#00E5FF]/5 text-8xl group-hover:text-[#00E5FF]/10 transition-colors rotate-12 pointer-events-none">
                <Icon icon="solar:microphone-3-linear" />
              </div>
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all">
                  <Icon icon="solar:crown-linear" className="text-xl" />
                </div>
                <span className="text-[10px] font-medium px-2 py-1 bg-white/5 rounded text-white/50 tracking-widest">{t.cards.roomKing.badge}</span>
              </div>
              <div className="z-10 mt-2">
                <h3 className="text-lg tracking-tight font-medium text-white/90 group-hover:text-[#00E5FF] transition-colors">{t.cards.roomKing.title}</h3>
                <p className="text-xs font-light text-white/50 mt-1">{t.cards.roomKing.desc}</p>
              </div>
              <div className="z-10 mt-auto pt-4 flex gap-2 w-full">
                <Link href="/rooms/colosseum" className="flex-1 py-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs font-medium text-white/80 transition-all text-center">{t.cards.roomKing.create}</Link>
                <Link href="/rooms/colosseum" className="flex-1 py-2.5 rounded bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 hover:border-[#00E5FF] text-xs font-medium text-[#00E5FF] hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all text-center">{t.cards.roomKing.join}</Link>
              </div>
            </div>

            {/* Card B: Local Lounge */}
            <div className="group relative bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] rounded-xl p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="absolute -right-6 -top-6 text-white/5 text-8xl group-hover:text-white/10 transition-colors rotate-12 pointer-events-none">
                <Icon icon="solar:champagne-linear" />
              </div>
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-white/80 border border-white/10 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
                  <Icon icon="solar:calendar-linear" className="text-xl" />
                </div>
                <span className="text-[10px] font-medium px-2 py-1 bg-white/5 rounded text-white/50 tracking-widest">{t.cards.localLounge.badge}</span>
              </div>
              <div className="z-10 mt-2">
                <h3 className="text-lg tracking-tight font-medium text-white/90">{t.cards.localLounge.title}</h3>
                <p className="text-xs font-light text-white/50 mt-1">{t.cards.localLounge.desc}</p>
              </div>
              <div className="z-10 mt-auto pt-4 w-full">
                <Link href="/rooms/banquet" className="w-full py-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs font-medium text-white/80 transition-all flex items-center justify-center gap-2">
                  <Icon icon="solar:add-circle-linear" className="text-sm" />
                  {t.cards.localLounge.book}
                </Link>
              </div>
            </div>

            {/* Card C: Sing & Talk */}
            <div className="group relative bg-white/[0.02] border border-white/5 hover:border-[#FF007F]/40 hover:bg-[#FF007F]/[0.02] rounded-xl p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="absolute -right-6 -top-6 text-[#FF007F]/5 text-8xl group-hover:text-[#FF007F]/10 transition-colors rotate-12 pointer-events-none">
                <Icon icon="solar:chat-round-linear" />
              </div>
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/20 group-hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] transition-all">
                  <Icon icon="solar:users-group-two-rounded-linear" className="text-xl" />
                </div>
                <span className="text-[10px] font-medium px-2 py-1 bg-white/5 rounded text-white/50 tracking-widest">{t.cards.singTalk.badge}</span>
              </div>
              <div className="z-10 mt-2">
                <h3 className="text-lg tracking-tight font-medium text-white/90 group-hover:text-[#FF007F] transition-colors">{t.cards.singTalk.title}</h3>
                <p className="text-xs font-light text-white/50 mt-1">{t.cards.singTalk.desc}</p>
              </div>
              <div className="z-10 mt-auto pt-4 w-full">
                <Link href="/rooms/singertalk" className="w-full py-2.5 rounded bg-[#FF007F]/10 hover:bg-[#FF007F]/20 border border-[#FF007F]/30 hover:border-[#FF007F] text-xs font-medium text-[#FF007F] hover:shadow-[0_0_10px_rgba(255,0,127,0.3)] transition-all flex items-center justify-center gap-2">
                  <Icon icon="solar:magic-stick-3-linear" className="text-sm" />
                  {t.cards.singTalk.match}
                </Link>
              </div>
            </div>

            {/* Card D: L'Oxygène Black */}
            <div
              className="group relative bg-white/[0.02] border border-white/5 hover:border-[#FF007F]/40 hover:bg-[#FF007F]/[0.02] rounded-xl p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer"
              onClick={(e) => { if ((e.target as HTMLElement).closest("input,button")) return; openVVIP(); }}
            >
              {/* Decorative bg icon */}
              <div className="absolute -right-6 -top-6 text-[#FF007F]/5 text-8xl group-hover:text-[#FF007F]/10 transition-colors rotate-12 pointer-events-none z-0">
                <Icon icon="solar:shield-keyhole-linear" />
              </div>

              {/* Top row: icon badge + VVIP ONLY */}
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/20 group-hover:shadow-[0_0_15px_rgba(255,0,127,0.3)] transition-all">
                  <Icon icon="solar:shield-keyhole-linear" className="text-xl" />
                </div>
                <span className="text-[10px] font-medium px-2 py-1 bg-white/5 rounded text-white/50 tracking-widest">{t.cards.black.vvipOnly}</span>
              </div>

              {/* Title + desc */}
              <div className="z-10 mt-2">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg tracking-tight font-medium text-white/90 group-hover:text-[#FF007F] transition-colors">L&apos;Oxygène Black</h3>
                  {blackBadge}
                </div>
                <p className="text-xs font-light text-white/50">최상위 VVIP 전용 구역. 초대받은 자만 입장 가능합니다</p>
              </div>

              {/* Input + actions */}
              <div className="z-10 mt-auto flex flex-col gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                {/* Input wrapper */}
                <div className={`relative w-full ${codeShake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
                  {/* Scan overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden z-10 pointer-events-none">
                      <div className="absolute inset-x-0 h-0.5 opacity-80"
                        style={{ background: "linear-gradient(to right, transparent, #00E5FF, transparent)", animation: "scan-vertical-input 0.8s ease-in-out infinite" }} />
                    </div>
                  )}
                  {/* Fingerprint icon */}
                  <Icon
                    icon={scanDone ? "solar:check-circle-bold" : "solar:fingerprint-linear"}
                    className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10"
                    style={{ color: isScanning || scanDone ? "#00E5FF" : codeInputFocused ? "#00E5FF" : "rgba(255,255,255,0.2)" }}
                  />
                  {/* Input */}
                  <input
                    ref={codeInputRef}
                    type="password"
                    placeholder={t.cards.black.codePlaceholder}
                    value={accessCode}
                    disabled={codeDisabled}
                    onChange={(e) => { setAccessCode(e.target.value); if (codeError) setCodeError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCodeSubmit(); }}
                    onFocus={() => setCodeInputFocused(true)}
                    onBlur={() => setCodeInputFocused(false)}
                    className="w-full bg-black/60 border rounded-lg py-2.5 pl-10 pr-9 text-xs font-mono placeholder:text-white/20 focus:outline-none transition-all tracking-widest disabled:cursor-not-allowed"
                    style={{
                      borderColor: codeError ? "rgba(239,68,68,0.5)" : codeInputFocused ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.1)",
                      boxShadow: codeInputFocused && !codeError ? "0 0 15px rgba(0,229,255,0.2)" : "none",
                      color: isScanning || scanDone ? "#00E5FF" : "rgba(255,255,255,0.7)",
                    }}
                  />
                  {/* Arrow submit button */}
                  {accessCode.length > 0 && !codeDisabled && (
                    <button
                      onClick={handleCodeSubmit}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 transition-colors hover:text-[#00E5FF]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Error / info message */}
                {codeError ? (
                  <p className="text-[10px] text-red-400 tracking-wide">{codeError}</p>
                ) : !isVVIPMember ? (
                  <button
                    onClick={() => openVVIP()}
                    className="text-[10px] tracking-wider text-center transition-colors hover:text-[#FF007F]/60"
                    style={{ color: "rgba(255,0,127,0.3)" }}
                  >
                    {isVVIPApplied ? t.cards.black.reviewNote : t.cards.black.vvipInfo}
                  </button>
                ) : (
                  <button
                    onClick={handleCodeSubmit}
                    className="w-full py-2 rounded-lg text-xs font-light tracking-widest uppercase transition-all active:scale-95"
                    style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", color: "rgba(201,168,76,0.8)" }}
                  >
                    {t.cards.black.submit}
                  </button>
                )}
              </div>
            </div>

            {/* Card E: Vibe Director */}
            <div className="group relative bg-white/[0.02] border border-white/5 hover:border-[#FF007F]/30 hover:bg-[#FF007F]/[0.02] rounded-xl p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="absolute -right-6 -top-6 text-[#00E5FF]/5 text-8xl group-hover:text-[#00E5FF]/10 transition-colors rotate-12 pointer-events-none">
                <Icon icon="solar:user-star-linear" />
              </div>
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <span className="text-[10px] font-medium px-2 py-1 bg-white/5 rounded text-white/50 tracking-widest">{t.cards.vibeDirector.badge}</span>
              </div>
              <div className="z-10 mt-2">
                <h3 className="text-lg tracking-tight font-medium text-white/90 group-hover:text-[#FF007F] transition-colors">{t.cards.vibeDirector.title}</h3>
                <p className="text-xs font-light text-white/50 mt-1">{t.cards.vibeDirector.desc}</p>
              </div>
              <div className="z-10 mt-auto pt-4 flex gap-2 w-full">
                <Link href="/entertainers" className="flex-1 py-2.5 rounded bg-[#FF007F]/10 hover:bg-[#FF007F]/20 border border-[#FF007F]/30 hover:border-[#FF007F] text-xs font-medium text-[#FF007F] hover:shadow-[0_0_10px_rgba(255,0,127,0.3)] transition-all text-center">{t.cards.vibeDirector.callNow}</Link>
                <Link href="/entertainers" className="flex-1 py-2.5 rounded bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 hover:border-[#00E5FF] text-xs font-medium text-[#00E5FF] hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all text-center">{t.cards.vibeDirector.preBook}</Link>
              </div>
            </div>

          </section>

          {/* Mobile control panel */}
          <section className="lg:hidden flex flex-col gap-0 rounded-2xl overflow-hidden"
            style={{ background: "rgba(5,5,5,0.8)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(24px)" }}>
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm tracking-tight font-medium text-white/80 uppercase">{t.sidebar.title}</h3>
              <Link href="/control-panel" title="컨트롤 패널">
                <Icon icon="solar:settings-linear" className="text-white/40 hover:text-[#00E5FF] transition-colors" />
              </Link>
            </div>
            <ControlPanelBody />
          </section>

        </main>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-80 bg-[#050505]/80 backdrop-blur-2xl border-l border-white/5 flex-col overflow-y-auto hide-scrollbar shrink-0 z-30">
          <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#050505]/90 backdrop-blur-md z-10">
            <h3 className="text-sm tracking-tight font-medium text-white/80 uppercase">{t.sidebar.title}</h3>
            <Link href="/control-panel" title="컨트롤 패널">
              <Icon icon="solar:settings-linear" className="text-white/40 hover:text-[#00E5FF] cursor-pointer transition-colors" />
            </Link>
          </div>
          <ControlPanelBody />
        </aside>

      </div>

      {/* Ticker */}
      <footer className="h-8 bg-black border-t border-white/5 overflow-hidden shrink-0 relative z-40">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        <div className="animate-ticker text-[10px] font-mono tracking-widest text-white/40">
          <span className="text-[#00E5FF]">Sys.MSG_01:</span>{" "}{t.ticker[0]}
          <span className="mx-10 text-white/20">·</span>
          <span className="text-[#FF007F]">{t.tickerLabels.alert}</span>{" "}{t.ticker[1]}
          <span className="mx-10 text-white/20">·</span>
          <span className="text-[#00E5FF]">Sys.MSG_02:</span>{" "}{t.ticker[2]}
          <span className="mx-10 text-white/20">·</span>
          <span className="text-white/60">{t.tickerLabels.notice}</span>{" "}{t.ticker[3]}
          <span className="mx-10 text-white/20">·</span>
          <span className="text-[#00E5FF]">Sys.MSG_01:</span>{" "}{t.ticker[0]}
        </div>
      </footer>

      {/* ── Search Modal ── */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── VVIP Modal System ── */}
      {vvipScreen !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeVVIP(); }}>
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto hide-scrollbar rounded-t-2xl sm:rounded-2xl flex flex-col"
            style={{ background: "#000000", border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 0 80px rgba(201,168,76,0.06), 0 0 120px rgba(0,0,0,0.8)" }}>
            <GoldDustSmall />
            <button onClick={closeVVIP} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>
              <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
            </button>

            {/* Preview screen */}
            {vvipScreen === "preview" && (
              <div className="flex flex-col gap-6 p-6 pb-8">
                <div className="flex justify-center pt-2">
                  <span className="text-xs font-light tracking-[0.35em] px-4 py-1.5 rounded-full"
                    style={{ color: "rgba(201,168,76,0.7)", border: "1px solid rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.04)" }}>
                    {t.vvip.badge}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-[0.3em] uppercase"
                    style={{ color: "#C9A84C", textShadow: "0 0 30px rgba(201,168,76,0.3)" }}>{t.vvip.title}</h2>
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.35)" }}>{t.vvip.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.2))" }} />
                  <span className="text-[10px]" style={{ color: "rgba(201,168,76,0.3)" }}>✦</span>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,168,76,0.2))" }} />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
                  {featureCards.map((c) => (
                    <div key={c.title} className="flex-shrink-0 w-40 flex flex-col gap-2.5 p-4 rounded-xl"
                      style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)" }}>
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <p className="text-[9px] tracking-widest mb-1" style={{ color: "rgba(201,168,76,0.4)" }}>{c.label}</p>
                        <p className="text-xs font-semibold text-white/80 mb-1.5">{c.title}</p>
                        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative w-full rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer"
                  style={{ height: "140px", background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "inset 0 0 30px rgba(201,168,76,0.04)" }}
                  onClick={() => setPreviewPlaying(!previewPlaying)}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06), transparent 70%)" }} />
                  {previewPlaying ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-end gap-0.5 h-6">
                        {[3, 6, 4, 8, 5, 7, 3, 6, 4].map((h, i) => (
                          <div key={i} className="w-1 rounded-full" style={{ height: `${h * 3}px`, background: "#C9A84C", animation: "bar-dance 0.8s ease-in-out infinite", animationDelay: `${i * 0.1}s`, opacity: 0.7 }} />
                        ))}
                      </div>
                      <span className="text-xs tracking-widest" style={{ color: "rgba(201,168,76,0.6)" }}>{t.vvip.playing}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
                        <Icon icon="solar:play-bold" className="w-4 h-4 ml-0.5" style={{ color: "#C9A84C" }} />
                      </div>
                      <span className="text-[10px] tracking-[0.25em]" style={{ color: "rgba(201,168,76,0.5)" }}>{t.vvip.previewLabel}</span>
                    </div>
                  )}
                </div>
                <div className="text-center py-2 px-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>{t.vvip.socialProof}</p>
                </div>
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => setVvipScreen("signup")}
                    className="relative w-full py-3.5 rounded-xl font-light tracking-[0.25em] text-sm uppercase overflow-hidden transition-all active:scale-95"
                    style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }}>
                    <span className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(201,168,76,0.18) 50%, transparent 70%)", animation: "shimmer 2.5s ease-in-out infinite", transform: "translateX(-100%)" }} />
                    {t.vvip.apply}
                  </button>
                  <button onClick={closeVVIP} className="w-full py-2.5 rounded-xl text-xs transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
                    {t.vvip.later}
                  </button>
                </div>
              </div>
            )}

            {/* Sign-up form */}
            {vvipScreen === "signup" && (
              <div className="flex flex-col gap-5 p-6 pb-8">
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => setVvipScreen("preview")} className="text-xs flex-shrink-0" style={{ color: "rgba(201,168,76,0.4)" }}>←</button>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:lock-keyhole-bold" className="w-4 h-4" style={{ color: "#C9A84C" }} />
                      <h2 className="text-base font-light tracking-[0.2em]" style={{ color: "#C9A84C" }}>{t.vvip.formTitle}</h2>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{t.vvip.formSubtitle}</p>
                  </div>
                </div>
                <div className="h-px" style={{ background: "rgba(201,168,76,0.1)" }} />
                <div className="flex flex-col gap-3.5">
                  <FormField label={t.vvip.name}><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t.vvip.name} className="form-input" /></FormField>
                  <FormField label={t.vvip.phone}><input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="010-0000-0000" className="form-input" /></FormField>
                  <FormField label={t.vvip.email}><input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="your@email.com" className="form-input" /></FormField>
                  <FormField label={t.vvip.bio}><textarea value={formBio} onChange={(e) => setFormBio(e.target.value)} placeholder={t.vvip.bioPlaceholder} rows={3} className="form-input resize-none" /></FormField>
                  <FormField label={t.vvip.referral}><input type="text" value={formReferral} onChange={(e) => setFormReferral(e.target.value)} placeholder={t.vvip.referralPlaceholder} className="form-input" /></FormField>
                  <FormField label={t.vvip.scale}>
                    <div className="grid grid-cols-1 gap-2">
                      {scaleOptions.map((o) => (
                        <button key={o.id} onClick={() => setFormScale(o.id)} className="py-2.5 px-3 rounded-xl text-xs text-left transition-all active:scale-95"
                          style={formScale === o.id ? { background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" } : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FormField>
                  <button onClick={() => setFormAgreed(!formAgreed)}
                    className="flex items-start gap-3 text-left py-3 px-3 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${formAgreed ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                      style={{ background: formAgreed ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.05)", border: `1px solid ${formAgreed ? "rgba(201,168,76,0.6)" : "rgba(255,255,255,0.1)"}` }}>
                      {formAgreed && <Icon icon="solar:check-bold" className="w-2.5 h-2.5" style={{ color: "#C9A84C" }} />}
                    </div>
                    <span className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{t.vvip.agree}</span>
                  </button>
                </div>
                <button onClick={handleSignupSubmit} disabled={!formName || !formEmail || !formScale || !formAgreed}
                  className="relative w-full py-3.5 rounded-xl font-light tracking-[0.25em] text-sm uppercase overflow-hidden transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mt-1"
                  style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }}>
                  <span className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(201,168,76,0.18) 50%, transparent 70%)", animation: "shimmer 2.5s ease-in-out infinite", transform: "translateX(-100%)" }} />
                  {t.vvip.submitBtn}
                </button>
                <button onClick={() => setVvipScreen("preview")} className="text-[11px] text-center transition-colors" style={{ color: "rgba(255,255,255,0.15)" }}>{t.vvip.back}</button>
              </div>
            )}

            {/* Success */}
            {vvipScreen === "success" && (
              <div className="flex flex-col items-center gap-6 px-6 py-12 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: "radial-gradient(circle, rgba(201,168,76,0.2), rgba(201,168,76,0.05))", border: "2px solid rgba(201,168,76,0.5)", boxShadow: "0 0 30px rgba(201,168,76,0.15)", animation: "wax-seal-pulse 2s ease-in-out infinite" }}>
                  💎
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-light tracking-[0.2em]" style={{ color: "#C9A84C" }}>{t.vvip.successTitle}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {t.vvip.successDesc.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full max-w-xs">
                  <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.15)" }} />
                  <span className="text-[10px]" style={{ color: "rgba(201,168,76,0.3)" }}>✦</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.15)" }} />
                </div>
                <p className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>BLACK MEMBERSHIP · APPLICATION RECEIVED</p>
                <button onClick={closeVVIP} className="px-8 py-3 rounded-xl font-light tracking-[0.2em] text-sm uppercase transition-all active:scale-95 mt-2"
                  style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
                  {t.vvip.confirm}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropdown-in {
          0%   { opacity: 0; transform: translateY(-6px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gold-drift-sm {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(var(--dx, 15px)); opacity: 0; }
        }
        @keyframes scan-vertical-input {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes bar-dance {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.4); }
        }
        @keyframes wax-seal-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(201,168,76,0.15); }
          50% { box-shadow: 0 0 50px rgba(201,168,76,0.35); }
        }
        .form-input {
          width: 100%; padding: 10px 14px; border-radius: 10px; font-size: 12px;
          color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07); outline: none;
          transition: border-color 0.2s; font-family: inherit;
        }
        .form-input::placeholder { color: rgba(255,255,255,0.15); }
        .form-input:focus { border-color: rgba(201,168,76,0.35); background: rgba(201,168,76,0.02); }
      `}</style>

      {/* Charge modal */}
      <ChargeModal
        open={chargeModalOpen}
        currentBalance={wallet.balance}
        onClose={() => setChargeModalOpen(false)}
        onCharge={chargeCredits}
      />
    </div>
  );
}

// ── Page wrapper (provides language context) ──────────────────
export default function PageWrapper() {
  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}
