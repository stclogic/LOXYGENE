"use client";

import { useState, useRef, useEffect } from "react";
import type { DailyParticipant } from "@/hooks/useDailyCall";
import Link from "next/link";
import { Icon } from "@iconify/react";

const MOCK_PARTICIPANTS = [
  { id: "p1", name: "별빛가수", isPaid: true, isMuted: false, isKaraoke: true },
  { id: "p2", name: "달빛연인", isPaid: true, isMuted: false, isKaraoke: false },
  { id: "p3", name: "구름위", isPaid: false, isMuted: true, isKaraoke: false },
  { id: "p4", name: "바람소리", isPaid: true, isMuted: false, isKaraoke: false },
  { id: "p5", name: "하늘별", isPaid: false, isMuted: true, isKaraoke: false },
  { id: "p6", name: "봄날의꿈", isPaid: true, isMuted: false, isKaraoke: false },
];

const BG_OPTIONS = [
  { id: "city",       label: "🌃 도시야경",  from: "#0f0c29", via: "#302b63", to: "#24243e" },
  { id: "beach",      label: "🏖️ 비치파티",  from: "#f7971e", via: "#ffd200", to: "#f7971e" },
  { id: "fireworks",  label: "🎆 불꽃놀이",  from: "#360033", via: "#0b8793", to: "#360033" },
  { id: "space",      label: "🌌 우주파티",  from: "#0f0c29", via: "#302b63", to: "#000000" },
];

const IS_FREE = false; // mock — derive from session in production

interface Props {
  roomName: string;
  roomSubtitle?: string;
  backHref: string;
  accentColor?: string;
  participantCount?: number;
  panelTitle?: string;
  panelContent?: React.ReactNode;
  extraBarControls?: React.ReactNode;
  dailyParticipants?: Record<string, DailyParticipant>;
  karaokeVideoId?: string;
}

// ── In-room mini settings components ──────────────────────────────────────

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <span className="text-sm text-white/70">{label}</span>
      {children}
    </div>
  );
}

function MiniToggle({ checked, onChange, label = "토글" }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200"
      style={{ background: checked ? "#06b6d4" : "rgba(255,255,255,0.1)", boxShadow: checked ? "0 0 8px rgba(6,182,212,0.35)" : "none" }}
    >
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200" style={{ left: checked ? "calc(100% - 18px)" : "2px" }} />
    </button>
  );
}

function MiniSlider({ value, onChange, min = 0, max = 100, label = "슬라이더" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label?: string }) {
  const step = Math.round((max - min) / 20) || 1;
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <button
        type="button"
        aria-label={`${label} 줄이기`}
        onClick={dec}
        className="w-6 h-6 rounded-md flex items-center justify-center text-white/60 hover:text-white transition-colors flex-shrink-0 bg-white/[0.08] border border-white/10"
      >
        <Icon icon="solar:minus-bold" className="w-3 h-3" />
      </button>
      <div className="relative w-20 h-1.5 rounded-full flex-shrink-0 bg-white/10">
        <div className="absolute inset-y-0 left-0 rounded-full bg-cyan-500" style={{ width: `${pct}%` }} />
      </div>
      <button
        type="button"
        aria-label={`${label} 높이기`}
        onClick={inc}
        className="w-6 h-6 rounded-md flex items-center justify-center text-white/60 hover:text-white transition-colors flex-shrink-0 bg-white/[0.08] border border-white/10"
      >
        <Icon icon="solar:add-bold" className="w-3 h-3" />
      </button>
      <span className="text-xs text-white/40 w-7 text-right tabular-nums flex-shrink-0">{value}</span>
    </div>
  );
}

function InRoomAudioSettings() {
  const [vol, setVol] = useState(80);
  const [noise, setNoise] = useState(true);
  const [echo, setEcho] = useState(true);
  return (
    <div className="flex flex-col">
      <SettingRow label="마이크 볼륨"><MiniSlider value={vol} onChange={setVol} /></SettingRow>
      <SettingRow label="노이즈 캔슬링"><MiniToggle checked={noise} onChange={setNoise} /></SettingRow>
      <SettingRow label="에코 제거"><MiniToggle checked={echo} onChange={setEcho} /></SettingRow>
    </div>
  );
}

function InRoomVideoSettings() {
  const [blur, setBlur] = useState(0);
  const [vBg, setVBg] = useState(false);
  return (
    <div className="flex flex-col">
      <SettingRow label="배경 블러"><MiniSlider value={blur} onChange={setBlur} /></SettingRow>
      <SettingRow label="가상 배경"><MiniToggle checked={vBg} onChange={setVBg} /></SettingRow>
    </div>
  );
}

function InRoomEQSettings() {
  const bands = [
    { label: "저음",   key: "bass" },
    { label: "중저음", key: "low-mid" },
    { label: "중음",   key: "mid" },
    { label: "중고음", key: "hi-mid" },
    { label: "고음",   key: "treble" },
  ];
  const [vals, setVals] = useState<Record<string, number>>({ bass: 50, "low-mid": 50, mid: 50, "hi-mid": 50, treble: 50 });
  return (
    <div className="flex flex-col">
      {bands.map(b => (
        <SettingRow key={b.key} label={b.label}>
          <MiniSlider value={vals[b.key]} onChange={v => setVals(p => ({ ...p, [b.key]: v }))} />
        </SettingRow>
      ))}
    </div>
  );
}

function InRoomLightingSettings() {
  const [autoOn, setAutoOn] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("loxygene-lighting-auto") === "true" : false
  );
  const [brightness, setBrightness] = useState(70);

  const toggle = (v: boolean) => {
    setAutoOn(v);
    localStorage.setItem("loxygene-lighting-auto", String(v));
  };

  return (
    <div className="flex flex-col">
      <SettingRow label="입장 시 자동 조명 켜기"><MiniToggle checked={autoOn} onChange={toggle} /></SettingRow>
      <SettingRow label="밝기"><MiniSlider value={brightness} onChange={setBrightness} /></SettingRow>
      <p className="text-[11px] text-white/30 mt-3">전체 조명 설정은 컨트롤 패널에서 확인하세요.</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────

function VideoTile({ track, name }: { track?: MediaStreamTrack | null; name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = track ? new MediaStream([track]) : null;
  }, [track]);

  return (
    <div className="h-16 relative flex items-center justify-center overflow-hidden">
      {track ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl">👤</span>
      )}
      <span className="absolute bottom-0.5 left-0 right-0 text-[9px] text-white/70 truncate text-center px-1 leading-tight">
        {name}
      </span>
    </div>
  );
}

export function PartyRoomShell({
  roomName,
  roomSubtitle,
  backHref,
  accentColor = "#00E5FF",
  participantCount = 127,
  panelTitle = "🎤 노래방",
  panelContent,
  extraBarControls,
  dailyParticipants,
  karaokeVideoId,
}: Props) {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [gridCollapsed, setGridCollapsed] = useState(false);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [selectedBg, setSelectedBg] = useState(BG_OPTIONS[0]);
  const [spotlighted, setSpotlighted] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pid: string } | null>(null);
  const [isHost] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [allMuted, setAllMuted] = useState(false);
  const [karaokeOn, setKaraokeOn] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"audio" | "video" | "eq" | "lighting">("audio");
  const settingsHistoryPushed = useRef(false);

  const closeSettings = () => {
    if (settingsHistoryPushed.current) {
      settingsHistoryPushed.current = false;
      history.back(); // popstate handler will call setSettingsOpen(false)
    } else {
      setSettingsOpen(false);
    }
  };
  const [lightingToastVisible, setLightingToastVisible] = useState(false);
  const [lightingOn, setLightingOn] = useState(false);
  const [fnbOpen, setFnbOpen] = useState(false);
  const [fnbMenu, setFnbMenu] = useState<Record<string, { id: string; name: string; price_coins: number; delivery_minutes: number }[]>>({});
  const [fnbToast, setFnbToast] = useState("");

  // Camera background mode
  const [bgMode, setBgMode] = useState<"gradient" | "camera">("gradient");
  const [hostStream, setHostStream] = useState<MediaStream | null>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const [hiddenParticipants, setHiddenParticipants] = useState<Set<string>>(new Set());

  // Chat input
  const [chatInput, setChatInput] = useState("");

  const activateCameraBg = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setHostStream(prev => { prev?.getTracks().forEach(t => t.stop()); return stream; });
      setBgMode("camera");
    } catch {
      // permission denied — stay on gradient
    }
    setBgPickerOpen(false);
  };

  const deactivateCameraBg = () => {
    hostStream?.getTracks().forEach(t => t.stop());
    setHostStream(null);
    setBgMode("gradient");
  };

  const toggleParticipantVisibility = (pid: string) => {
    setHiddenParticipants(prev => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  };

  // Wire host camera stream to video element
  useEffect(() => {
    if (hostVideoRef.current && hostStream) {
      hostVideoRef.current.srcObject = hostStream;
    }
  }, [hostStream]);

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => { hostStream?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLighting = () => {
    setLightingOn(v => {
      const next = !v;
      localStorage.setItem("loxygene-lighting-auto", String(next));
      return next;
    });
  };

  // Lighting auto-on preference + toast on mount
  useEffect(() => {
    const autoOn = localStorage.getItem("loxygene-lighting-auto") === "true";
    setLightingOn(autoOn);
    if (!autoOn) {
      const shown = localStorage.getItem("loxygene-lighting-toast-shown");
      if (!shown) {
        setLightingToastVisible(true);
        localStorage.setItem("loxygene-lighting-toast-shown", "true");
        setTimeout(() => setLightingToastVisible(false), 3000);
      }
    }
  }, []);

  // F&B menu — lazy fetch on first open
  useEffect(() => {
    if (!fnbOpen || Object.keys(fnbMenu).length > 0) return;
    fetch("/api/fnb/menu")
      .then(r => r.json())
      .then(d => setFnbMenu(d.menu ?? {}))
      .catch(() => {});
  }, [fnbOpen, fnbMenu]);

  // ESC + back-navigation closes settings drawer (keeps user in room)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeSettings(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      // Push a history entry so browser back closes the drawer instead of leaving the room
      history.pushState({ settingsOpen: true }, "");
      settingsHistoryPushed.current = true;
    }
    const handlePop = () => {
      settingsHistoryPushed.current = false;
      setSettingsOpen(false);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [settingsOpen]);

  // Panel drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelDragged, setPanelDragged] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const hasDailyParticipants = dailyParticipants && Object.keys(dailyParticipants).length > 0;
  const displayParticipants = hasDailyParticipants ? null : MOCK_PARTICIPANTS;
  const spotlightedName = spotlighted
    ? (dailyParticipants?.[spotlighted]?.user_name ?? MOCK_PARTICIPANTS.find(p => p.id === spotlighted)?.name ?? "")
    : "";
  const spotlightedP = spotlighted ? { name: spotlightedName } : null;

  const startDrag = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragging.current = true;
    setPanelDragged(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: rect.left, py: rect.top };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setPanelPos({
        x: dragStart.current.px + ev.clientX - dragStart.current.mx,
        y: dragStart.current.py + ev.clientY - dragStart.current.my,
      });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
    <div className="fixed inset-0 flex flex-col bg-[#070707] overflow-hidden">

      {/* ── FULL-SCREEN HOST STAGE BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
        {bgMode === "camera" && hostStream ? (
          <video ref={hostVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${selectedBg.from}, ${selectedBg.via}, ${selectedBg.to})` }}
          />
        )}
        {/* YouTube karaoke embed */}
        {karaokeOn && karaokeVideoId ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
            <div className="w-full" style={{ maxWidth: "min(90vw, calc(90vh * 16/9))", aspectRatio: "16/9" }}>
              <iframe
                key={karaokeVideoId}
                title="노래방 유튜브"
                src={`https://www.youtube.com/embed/${karaokeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="w-full h-full rounded-xl border-0"
              />
            </div>
          </div>
        ) : (
          /* Mock camera silhouette */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[18vw] opacity-[0.04]">{spotlightedP ? "👤" : "🎙️"}</span>
          </div>
        )}
        {/* Vignette — skip when video is playing */}
        {!(karaokeOn && karaokeVideoId) && (
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.8) 100%)" }} />
        )}
        {/* Spotlight name tag */}
        {spotlightedP && (
          <div
            className="absolute bottom-28 left-6 z-10 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(0,0,0,0.65)", border: "1.5px solid rgba(0,229,255,0.55)", boxShadow: "0 0 18px rgba(0,229,255,0.2)", backdropFilter: "blur(12px)" }}
          >
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse block" />
            <span className="text-white font-semibold text-sm">{spotlightedP.name}</span>
            <span className="text-[10px] text-[#00E5FF]">스포트라이트</span>
          </div>
        )}
      </div>

      {/* ── HEADER ── */}
      <header
        className="relative z-20 flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link href={backHref} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-medium">
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" /> 나가기
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-black tracking-widest" style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}80` }}>
            {roomName}
          </h1>
          {roomSubtitle && <p className="text-white/30 text-[10px] mt-0.5">{roomSubtitle}</p>}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse block" />
            <span className="text-[10px] text-red-400 font-semibold">LIVE</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="solar:user-bold" className="text-white/30 w-3.5 h-3.5" />
            <span className="text-white/50 text-xs">{participantCount}</span>
          </div>
        </div>
      </header>

      {/* ── FREE MEMBER BANNER ── */}
      {IS_FREE && !bannerDismissed && (
        <div
          className="relative z-20 flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{ background: "rgba(0,229,255,0.07)", borderBottom: "1px solid rgba(0,229,255,0.18)" }}
        >
          <span className="text-xs text-[#00E5FF]">
            🔒 마이크를 사용하려면 유료 멤버십이 필요합니다
            <Link href="/payments/charge" className="ml-2 underline font-semibold hover:text-white transition-colors">업그레이드</Link>
          </span>
          <button onClick={() => setBannerDismissed(true)} className="text-[#00E5FF]/50 hover:text-[#00E5FF] ml-3 flex-shrink-0 transition-colors">
            <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── HOST TOOLS BAR ── */}
      {isHost && (
        <div
          className="relative z-20 flex items-center gap-2 px-4 py-2 flex-shrink-0 overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,255,255,0.04)", scrollbarWidth: "none" }}
        >
          <div className="flex items-center gap-1.5 mr-2 flex-shrink-0">
            <Icon icon="solar:crown-bold" className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-400 tracking-wider">호스트 도구</span>
          </div>
          <button
            onClick={() => { setKaraokeOn(v => !v); setPanelOpen(v => !v); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
            style={{
              background: karaokeOn ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${karaokeOn ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: karaokeOn ? "#ec4899" : "rgba(255,255,255,0.5)",
            }}
          >
            🎤 노래방 {karaokeOn ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setBgPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            🖼️ 배경 변경
          </button>
          <button
            onClick={() => setAllMuted(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
            style={{
              background: allMuted ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${allMuted ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: allMuted ? "#ef4444" : "rgba(255,255,255,0.5)",
            }}
          >
            🔊 전체 {allMuted ? "뮤트중" : "마이크"}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            🎯 참여자 선택
          </button>
        </div>
      )}

      {/* ── PARTICIPANT GRID (top-right floating overlay) ── */}
      <div className="absolute z-30" style={{ top: isHost ? 148 : 108, right: 12 }}>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => setGridCollapsed(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.4)" }}
          >
            <Icon icon={gridCollapsed ? "solar:users-group-two-rounded-bold" : "solar:arrow-right-linear"} className="w-3 h-3" />
            {gridCollapsed
              ? `${hasDailyParticipants ? Object.keys(dailyParticipants!).length : MOCK_PARTICIPANTS.length}명`
              : "접기"}
          </button>
          {!gridCollapsed && (
            <div className="grid grid-cols-2 gap-1.5" style={{ width: 168 }}>
              {hasDailyParticipants
                ? Object.entries(dailyParticipants!).map(([sid, p]) => (
                    <div
                      key={sid}
                      className="relative rounded-xl overflow-hidden cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: `1.5px solid ${spotlighted === sid ? "rgba(0,229,255,0.65)" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: spotlighted === sid ? "0 0 10px rgba(0,229,255,0.25)" : "none",
                      }}
                      onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, pid: sid }); }}
                    >
                      <VideoTile
                        track={p.tracks?.video?.persistentTrack}
                        name={p.user_name ?? sid.slice(0, 8)}
                      />
                      <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                        <Icon
                          icon={p.tracks?.audio?.state === "off" ? "solar:microphone-slash-bold" : "solar:microphone-bold"}
                          className={`w-3 h-3 ${p.tracks?.audio?.state === "off" ? "text-white/15" : "text-white/60"}`}
                        />
                      </div>
                    </div>
                  ))
                : (displayParticipants ?? MOCK_PARTICIPANTS).map(p => (
                    hiddenParticipants.has(p.id) ? (
                      isHost && (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleParticipantVisibility(p.id)}
                          className="relative rounded-xl overflow-hidden h-16 flex flex-col items-center justify-center gap-0.5"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}
                        >
                          <Icon icon="solar:eye-bold" className="w-3.5 h-3.5 text-white/20" />
                          <span className="text-[8px] text-white/25 truncate px-1 text-center">{p.name}</span>
                        </button>
                      )
                    ) : (
                      <div
                        key={p.id}
                        className="relative rounded-xl overflow-hidden cursor-pointer group"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: `1.5px solid ${p.isKaraoke ? "rgba(236,72,153,0.65)" : spotlighted === p.id ? "rgba(0,229,255,0.65)" : "rgba(255,255,255,0.08)"}`,
                          boxShadow: p.isKaraoke ? "0 0 10px rgba(236,72,153,0.25)" : spotlighted === p.id ? "0 0 10px rgba(0,229,255,0.25)" : "none",
                        }}
                        onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, pid: p.id }); }}
                      >
                        <div className="h-16 flex flex-col items-center justify-center gap-1 p-1">
                          <span className="text-2xl">👤</span>
                          <span className="text-[9px] text-white/70 truncate w-full text-center px-1 leading-tight">{p.name}</span>
                        </div>
                        <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                          {p.isKaraoke && <span className="text-[9px] leading-none">🎤</span>}
                          {p.isPaid
                            ? <Icon icon={p.isMuted ? "solar:microphone-slash-bold" : "solar:microphone-bold"} className={`w-3 h-3 ${p.isMuted ? "text-white/15" : "text-white/60"}`} />
                            : <span className="text-[9px]">🔒</span>
                          }
                        </div>
                        {isHost && (
                          <button
                            type="button"
                            aria-label="참여자 화면 숨기기"
                            onClick={e => { e.stopPropagation(); toggleParticipantVisibility(p.id); }}
                            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-0.5"
                            style={{ background: "rgba(0,0,0,0.6)" }}
                          >
                            <Icon icon="solar:eye-slash-bold" className="w-3 h-3 text-white/50" />
                          </button>
                        )}
                      </div>
                    )
                  ))
              }
            </div>
          )}
        </div>
      </div>

      {/* ── PARTICIPANT CONTEXT MENU ── */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 rounded-xl overflow-hidden flex flex-col py-1"
            style={{
              top: Math.max(10, contextMenu.y - 10),
              left: Math.min(contextMenu.x, window.innerWidth - 210),
              minWidth: 195,
              background: "rgba(8,8,20,0.96)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            {[
              { icon: "solar:star-bold",              label: "메인으로 올리기",       action: () => setSpotlighted(contextMenu.pid) },
              { icon: "solar:microphone-bold",         label: "마이크 켜기 / 끄기",    action: () => {} },
              { icon: "solar:music-note-2-bold",       label: "노래방 마이크 활성화",  action: () => {} },
              {
                icon: hiddenParticipants.has(contextMenu.pid) ? "solar:eye-bold" : "solar:eye-slash-bold",
                label: hiddenParticipants.has(contextMenu.pid) ? "화면 보이기" : "화면 숨기기",
                action: () => toggleParticipantVisibility(contextMenu.pid),
              },
              { icon: "solar:user-block-rounded-bold", label: "내보내기",              action: () => {}, danger: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => { item.action(); setContextMenu(null); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                style={{ color: item.danger ? "#ef4444" : "rgba(255,255,255,0.75)" }}
              >
                <Icon icon={item.icon} className="w-3.5 h-3.5 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── FLOATING OPTIONAL PANEL ── */}
      {panelOpen && panelContent && (
        <div
          ref={panelRef}
          className="absolute z-40 flex flex-col rounded-2xl overflow-hidden"
          style={{
            ...(panelDragged
              ? { left: panelPos.x, top: panelPos.y }
              : { right: 12, bottom: 72 }),
            width: "min(360px, 92vw)",
            maxHeight: "60vh",
            background: "rgba(4,4,14,0.93)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          }}
        >
          {/* Drag handle header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b cursor-move flex-shrink-0 select-none"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
            onMouseDown={startDrag}
          >
            <div className="flex items-center gap-2">
              <Icon icon="solar:cursor-bold" className="w-3 h-3 text-white/20" />
              <span className="text-xs font-bold text-white/70">{panelTitle}</span>
            </div>
            <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white/60 transition-colors ml-2">
              <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
            {panelContent}
          </div>
        </div>
      )}

      {/* ── BACKGROUND PICKER MODAL ── */}
      {bgPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(4,4,16,0.99)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">🖼️ 배경 선택</h2>
              <button onClick={() => setBgPickerOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BG_OPTIONS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => { setSelectedBg(bg); setBgPickerOpen(false); }}
                  className="relative h-20 rounded-xl overflow-hidden transition-all flex items-end p-2"
                  style={{
                    background: `linear-gradient(135deg, ${bg.from}, ${bg.via}, ${bg.to})`,
                    outline: selectedBg.id === bg.id ? "2px solid #00E5FF" : "none",
                    outlineOffset: 2,
                  }}
                >
                  <span className="relative z-10 text-[10px] font-semibold text-white drop-shadow-lg">{bg.label}</span>
                </button>
              ))}
              <button
                onClick={activateCameraBg}
                className="h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:border-white/30"
                style={{
                  background: bgMode === "camera" ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.03)",
                  border: bgMode === "camera" ? "2px solid rgba(0,229,255,0.6)" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Icon icon="solar:camera-bold" className="w-6 h-6" style={{ color: bgMode === "camera" ? "#00E5FF" : "rgba(255,255,255,0.4)" }} />
                <span className="text-[10px]" style={{ color: bgMode === "camera" ? "#00E5FF" : "rgba(255,255,255,0.35)" }}>카메라</span>
              </button>
              {bgMode === "camera" && (
                <button
                  onClick={() => { deactivateCameraBg(); setBgPickerOpen(false); }}
                  className="col-span-2 py-2 rounded-xl text-[11px] font-medium transition-all"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
                >
                  📷 카메라 배경 끄기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT DRAWER ── */}
      {chatOpen && (
        <div
          className="absolute right-0 top-0 bottom-0 z-30 flex flex-col w-72"
          style={{ background: "rgba(4,4,14,0.93)", borderLeft: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(24px)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <span className="text-sm font-bold text-white/70">💬 채팅</span>
            <button onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-3 flex items-center justify-center">
            <p className="text-xs text-white/20">채팅이 여기에 표시됩니다</p>
          </div>
          <div className="p-3 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <textarea
              rows={1}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (chatInput.trim()) setChatInput("");
                }
              }}
              placeholder="메시지 입력... (Enter 전송 / Shift+Enter 줄바꿈)"
              className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20 resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", maxHeight: 80 }}
            />
          </div>
        </div>
      )}

      {/* ── LIGHTING TOAST ── */}
      {lightingToastVisible && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs text-white/80 text-center whitespace-nowrap pointer-events-none"
          style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
        >
          💡 조명이 꺼져 있어요. 컨트롤 패널에서 켤 수 있어요.
        </div>
      )}

      {/* ── FLOATING SETTINGS GEAR BUTTON ── */}
      <button
        onClick={() => setSettingsOpen(true)}
        title="설정"
        className="fixed z-30 flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95"
        style={{
          bottom: 76,
          right: 16,
          background: "#0f172a",
          border: "1px solid rgba(6,182,212,0.3)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <Icon icon="solar:settings-bold" className="w-5 h-5 text-cyan-400" />
      </button>

      {/* ── IN-ROOM SETTINGS DRAWER ── */}
      {settingsOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={closeSettings}
          />
          {/* Drawer */}
          <div
            className="fixed left-0 right-0 bottom-0 z-50 flex flex-col rounded-t-2xl"
            style={{ height: "70vh", background: "#0a0f1e", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <Icon icon="solar:settings-bold" className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white/80">설정</span>
              </div>
              <button
                onClick={closeSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                style={{ background: "rgba(255,255,255,0.08)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-white" />
                <span className="text-xs text-white">닫기</span>
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {(["audio", "video", "eq", "lighting"] as const).map(tab => {
                const labels = { audio: "🎙️ 오디오", video: "📷 비디오", eq: "🎚️ EQ", lighting: "💡 조명" };
                return (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className="flex-1 py-3 text-xs font-medium transition-all"
                    style={{
                      color: settingsTab === tab ? "#06b6d4" : "rgba(255,255,255,0.4)",
                      borderBottom: settingsTab === tab ? "2px solid #06b6d4" : "2px solid transparent",
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: "none" }}>
              {settingsTab === "audio" && <InRoomAudioSettings />}
              {settingsTab === "video" && <InRoomVideoSettings />}
              {settingsTab === "eq" && <InRoomEQSettings />}
              {settingsTab === "lighting" && <InRoomLightingSettings />}
            </div>
          </div>
        </>
      )}

      {/* ── SPACER (fills space between header bars and bottom bar) ── */}
      <div className="flex-1" />

      {/* ── BOTTOM ACTION BAR ── */}
      <div
        className="relative z-20 flex-shrink-0 px-4 py-3 flex items-center gap-2"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Camera */}
        <button
          onClick={() => setCamOn(v => !v)}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{
            background: camOn ? "rgba(0,229,255,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${camOn ? "rgba(0,229,255,0.4)" : "rgba(239,68,68,0.3)"}`,
          }}
        >
          <Icon icon={camOn ? "solar:camera-bold" : "solar:camera-slash-bold"} className="w-5 h-5" style={{ color: camOn ? "#00E5FF" : "#ef4444" }} />
        </button>

        {/* Mic */}
        <div className="relative flex-shrink-0" title={IS_FREE ? "유료 회원 전용" : undefined}>
          <button
            onClick={() => { if (!IS_FREE) setMicOn(v => !v); }}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: IS_FREE ? "rgba(255,255,255,0.03)" : micOn ? "rgba(0,229,255,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${IS_FREE ? "rgba(255,255,255,0.08)" : micOn ? "rgba(0,229,255,0.4)" : "rgba(239,68,68,0.3)"}`,
              opacity: IS_FREE ? 0.5 : 1,
              cursor: IS_FREE ? "not-allowed" : "pointer",
            }}
          >
            <Icon
              icon={micOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
              className="w-5 h-5"
              style={{ color: IS_FREE ? "rgba(255,255,255,0.2)" : micOn ? "#00E5FF" : "#ef4444" }}
            />
          </button>
          {IS_FREE && <span className="absolute -top-1 -right-1 text-[10px] leading-none">🔒</span>}
        </div>

        {/* Chat */}
        <button
          onClick={() => setChatOpen(v => !v)}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{
            background: chatOpen ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${chatOpen ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <Icon icon="solar:chat-round-bold" className="w-5 h-5" style={{ color: chatOpen ? "#00E5FF" : "rgba(255,255,255,0.4)" }} />
        </button>

        {/* F&B Delivery */}
        <button
          onClick={() => setFnbOpen(true)}
          aria-label="F&B 딜리버리"
          title="F&B 딜리버리"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 flex-shrink-0"
          style={{ background: fnbOpen ? "rgba(255,0,127,0.2)" : "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.3)" }}
        >
          🥂
        </button>

        {/* Lighting toggle */}
        <button
          onClick={toggleLighting}
          title="조명 켜기 / 끄기"
          aria-label="조명 켜기 / 끄기"
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{
            background: lightingOn ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${lightingOn ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <Icon
            icon={lightingOn ? "solar:lightbulb-bold" : "solar:lightbulb-slash-bold"}
            className="w-5 h-5"
            style={{ color: lightingOn ? "#00E5FF" : "rgba(255,255,255,0.35)" }}
          />
        </button>

        {/* Optional panel toggle */}
        {panelContent && (
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all active:scale-95 min-w-0"
            style={{
              background: panelOpen ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${panelOpen ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: panelOpen ? "#ec4899" : "rgba(255,255,255,0.45)",
            }}
          >
            <span className="text-base">{panelTitle.split(" ")[0]}</span>
            <span className="text-xs truncate hidden sm:block">{panelTitle.replace(/^[^\s]+\s/, "")}</span>
          </button>
        )}

        {/* Room-specific extra controls */}
        {extraBarControls}

        {/* More */}
        <button
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Icon icon="solar:menu-dots-bold" className="w-5 h-5 text-white/35" />
        </button>
      </div>
    </div>

    {/* ── F&B DELIVERY DRAWER ── */}
    {fnbOpen && (
      <>
        <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setFnbOpen(false)} />
        <div className="fixed left-0 right-0 bottom-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
          style={{ height: "65vh", background: "#0a0f1e", borderTop: "1px solid rgba(255,0,127,0.2)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div>
              <p className="text-white font-bold">🥂 F&B 딜리버리</p>
              <p className="text-[11px] text-white/30 mt-0.5">코인으로 음료·음식을 주문하세요</p>
            </div>
            <button type="button" aria-label="닫기" onClick={() => setFnbOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
            {Object.keys(fnbMenu).length === 0 && (
              <div className="text-center py-8 text-white/25 text-sm">메뉴 불러오는 중...</div>
            )}
            {Object.entries(fnbMenu).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-[10px] font-bold tracking-widest text-white/30 mb-2">
                  {cat === "premium" ? "🥂 PREMIUM" : cat === "drinks" ? "🍸 DRINKS" : "🍽️ FOOD"}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{item.name}</p>
                        <p className="text-[11px] font-bold mt-0.5" style={{ color: "#FFD700" }}>
                          {item.price_coins.toLocaleString()} O₂ · {item.delivery_minutes}분
                        </p>
                      </div>
                      <button type="button"
                        onClick={async () => {
                          const res = await fetch("/api/fnb/order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ itemId: item.id, quantity: 1 }),
                          }).then(r => r.json()).catch(() => null);
                          setFnbOpen(false);
                          const msg = res?.orderId
                            ? `🥂 주문이 접수됐어요! ${item.delivery_minutes}분 후 도착`
                            : "❌ 주문 실패. 코인 잔액을 확인하세요.";
                          setFnbToast(msg);
                          setTimeout(() => setFnbToast(""), 4000);
                        }}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(255,0,127,0.12)", border: "1px solid rgba(255,0,127,0.3)", color: "#FF007F" }}>
                        주문
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )}

    {/* F&B floating toast */}
    {fnbToast && (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl text-sm font-medium text-white whitespace-nowrap pointer-events-none"
        style={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,0,127,0.3)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        {fnbToast}
      </div>
    )}
    </>
  );
}
