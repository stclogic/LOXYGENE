"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";

const IS_DIRECTOR = true; // mock — in prod derive from auth

const MOCK_GUESTS = [
  { id: "g1", label: "호스트", isHost: true, isSpeaking: false },
  { id: "g2", label: "VIP 1", isHost: false, isSpeaking: true },
  { id: "g3", label: "VIP 2", isHost: false, isSpeaking: false },
  { id: "g4", label: "VIP 3", isHost: false, isSpeaking: false },
  { id: "g5", label: "VIP 4", isHost: false, isSpeaking: false },
];

const CHAT_INIT = [
  { id: "c0", from: "concierge", text: "안녕하세요, 컨시어지입니다. 무엇을 도와드릴까요?" },
];

const QUICK_ORDERS = [
  { id: "wine", label: "🍾 프리미엄 주류" },
  { id: "driver", label: "🚗 대리운전" },
  { id: "room", label: "🏨 프라이빗 룸" },
];

function generateOTP() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part(4)}-${part(4)}`;
}

type GiftParticle = { id: number; x: number; y: number };

export default function BlackRoomPage() {
  const params = useParams();
  const roomId = typeof params.roomId === "string" ? params.roomId : "penthouse-1";
  const [controlsVisible, setControlsVisible] = useState(true);
  const [directorOpen, setDirectorOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeMinimized, setConciergeMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState(CHAT_INIT);
  const [chatInput, setChatInput] = useState("");
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState("500");
  const [giftAnon, setGiftAnon] = useState(false);
  const [giftSent, setGiftSent] = useState(false);
  const [otp, setOtp] = useState("7X9K-M2PQ");
  const [otpCopied, setOtpCopied] = useState(false);
  const [captureToast, setCaptureToast] = useState(true);
  const [giftParticles, setGiftParticles] = useState<GiftParticle[]>([]);
  const [watermarkTooltip, setWatermarkTooltip] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!conciergeOpen && !giftModalOpen) setControlsVisible(false);
    }, 3000);
  }, [conciergeOpen, giftModalOpen]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHideTimer]);

  // Keep controls visible when modals are open
  useEffect(() => {
    if (conciergeOpen || giftModalOpen) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setControlsVisible(true);
    } else {
      resetHideTimer();
    }
  }, [conciergeOpen, giftModalOpen, resetHideTimer]);

  // Dismiss capture toast
  useEffect(() => {
    const t = setTimeout(() => setCaptureToast(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChat = (text: string) => {
    if (!text.trim()) return;
    setChatMessages((m) => [...m, { id: `u${Date.now()}`, from: "user", text }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages((m) => [...m, { id: `c${Date.now()}`, from: "concierge", text: "네, 곧 처리해드리겠습니다. 잠시만 기다려주세요." }]);
    }, 1200);
  };

  const handleGiftSend = () => {
    setGiftSent(true);
    const newParticles: GiftParticle[] = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 40 + 30,
    }));
    setGiftParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setGiftParticles((p) => p.filter((pp) => !newParticles.find((n) => n.id === pp.id)));
      setGiftModalOpen(false);
      setGiftSent(false);
    }, 1200);
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(otp).catch(() => {});
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 1500);
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative select-none"
      style={{ background: "#020202", cursor: controlsVisible ? "default" : "none" }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* ── Full-screen host video mock ── */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0a0a0e 0%, #020202 50%, #08060a 100%)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl opacity-20"
          style={{ border: "1px solid rgba(201,168,76,0.15)" }}>
          👑
        </div>
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)" }} />

      {/* Faint grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gift particles */}
      {giftParticles.map((p) => (
        <div key={p.id} className="absolute text-2xl pointer-events-none z-50"
          style={{ left: `${p.x}%`, top: `${p.y}%`, animation: "particle-burst 1s ease-out forwards" }}>
          💎
        </div>
      ))}

      {/* ── Capture prevention toast (always shows on mount) ── */}
      {captureToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap"
          style={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(16px)" }}>
          <Icon icon="solar:shield-check-bold" className="w-3.5 h-3.5" style={{ color: "#C9A84C" }} />
          <span className="text-xs tracking-wider" style={{ color: "rgba(201,168,76,0.8)" }}>캡처 방지 활성화</span>
        </div>
      )}

      {/* ─── FADING CONTROLS ─── */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ opacity: controlsVisible ? 1 : 0 }}>

        {/* Re-enable pointer events on children only when visible */}
        <div className={`absolute inset-0 ${controlsVisible ? "pointer-events-auto" : "pointer-events-none"}`}>

          {/* Home button */}
          <Link
            href="/"
            className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: "#C9A84C", background: "rgba(201,168,76,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(201,168,76,0.15)" }}
          >
            ← L&apos;OXYGÈNE
          </Link>

          {/* Director FAB */}
          <button
            onClick={() => setDirectorOpen(true)}
            className="fixed top-14 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
            style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F", backdropFilter: "blur(12px)", boxShadow: "0 0 12px rgba(255,0,127,0.15)" }}
          >
            <Icon icon="solar:user-star-bold" className="w-3.5 h-3.5" />
            디렉터 호출
          </button>
          <QuickCallModal open={directorOpen} onClose={() => setDirectorOpen(false)} roomId={roomId} />

          {/* OTP panel (host/director) */}
          {IS_DIRECTOR && (
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 p-3 rounded-xl"
              style={{ background: "rgba(8,6,4,0.92)", border: "1px solid rgba(201,168,76,0.18)", backdropFilter: "blur(20px)", minWidth: "200px" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon icon="solar:key-bold" className="w-3 h-3" style={{ color: "#C9A84C" }} />
                <span className="text-[10px] tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>현재 입장 코드</span>
              </div>
              <span className="font-mono text-base font-bold tracking-[0.3em]" style={{ color: "#C9A84C" }}>{otp}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOtp(generateOTP())}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider transition-all active:scale-95"
                  style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(201,168,76,0.7)" }}
                >
                  코드 갱신
                </button>
                <button
                  onClick={copyOtp}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider transition-all active:scale-95"
                  style={{ background: otpCopied ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", color: otpCopied ? "#C9A84C" : "rgba(201,168,76,0.5)" }}
                >
                  {otpCopied ? "복사됨 ✓" : "복사"}
                </button>
              </div>
            </div>
          )}

          {/* Director revenue panel */}
          {IS_DIRECTOR && (
            <div className="fixed top-36 right-4 z-50 flex flex-col gap-2 p-3 rounded-xl"
              style={{ background: "rgba(8,6,4,0.9)", border: "1px solid rgba(201,168,76,0.12)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:chart-bold" className="w-3 h-3" style={{ color: "#C9A84C" }} />
                <span className="text-[10px] tracking-wider" style={{ color: "rgba(201,168,76,0.4)" }}>오늘 수익</span>
              </div>
              <span className="font-black text-sm" style={{ color: "#C9A84C" }}>2,450,000 O₂</span>
              <Link
                href="/admin"
                className="py-1.5 rounded-lg text-[10px] font-semibold text-center tracking-wider transition-all active:scale-95"
                style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "rgba(201,168,76,0.6)" }}
              >
                내 룸 모니터링 →
              </Link>
            </div>
          )}

          {/* Guest thumbnail strip */}
          <div className="fixed bottom-24 left-0 right-0 z-40 flex items-end justify-center gap-2 px-4 pb-1">
            {MOCK_GUESTS.map((g) => (
              <div key={g.id} className="relative flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-all"
                  style={{
                    background: g.isHost ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                    border: g.isSpeaking
                      ? "1px solid rgba(0,229,255,0.8)"
                      : g.isHost
                      ? "1px solid rgba(201,168,76,0.3)"
                      : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: g.isSpeaking ? "0 0 12px rgba(0,229,255,0.4)" : undefined,
                  }}
                >
                  {g.isHost ? "👑" : "👤"}
                </div>
                <span className="text-[9px] tracking-wider"
                  style={{ color: g.isHost ? "rgba(201,168,76,0.6)" : "rgba(255,255,255,0.25)" }}>
                  {g.label}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom action bar */}
          <div className="fixed bottom-0 inset-x-0 z-40 px-4 py-3"
            style={{ background: "linear-gradient(to top, rgba(2,2,2,0.98) 60%, transparent)" }}>
            <div className="flex items-center gap-2 max-w-xl mx-auto">

              {/* Mic */}
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95"
                style={{
                  background: isMicOn ? "rgba(201,168,76,0.08)" : "rgba(255,50,50,0.08)",
                  border: isMicOn ? "1px solid rgba(201,168,76,0.25)" : "1px solid rgba(255,50,50,0.25)",
                }}
              >
                <Icon
                  icon={isMicOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
                  className="w-5 h-5"
                  style={{ color: isMicOn ? "rgba(201,168,76,0.8)" : "#ff5555" }}
                />
                <span className="text-[9px] leading-none" style={{ color: isMicOn ? "rgba(201,168,76,0.5)" : "#ff5555" }}>
                  마이크
                </span>
              </button>

              {/* Cam */}
              <button
                onClick={() => setIsCamOn(!isCamOn)}
                className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all active:scale-95"
                style={{
                  background: isCamOn ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                  border: isCamOn ? "1px solid rgba(201,168,76,0.25)" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Icon
                  icon={isCamOn ? "solar:camera-bold" : "solar:camera-slash-bold"}
                  className="w-5 h-5"
                  style={{ color: isCamOn ? "rgba(201,168,76,0.8)" : "rgba(255,255,255,0.25)" }}
                />
                <span className="text-[9px] leading-none" style={{ color: "rgba(255,255,255,0.25)" }}>카메라</span>
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Digital gift */}
              <button
                onClick={() => setGiftModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[44px] rounded-xl px-3 py-2 transition-all active:scale-95"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.35)",
                  boxShadow: "0 0 12px rgba(201,168,76,0.1)",
                }}
              >
                <span className="text-base leading-none">💎</span>
                <span className="text-[9px] leading-none" style={{ color: "#C9A84C" }}>디지털 선물</span>
              </button>

              {/* Concierge */}
              <button
                onClick={() => { setConciergeOpen(true); setConciergeMinimized(false); }}
                className="flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[44px] rounded-xl px-3 py-2 transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Icon icon="solar:bell-bold" className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                <span className="text-[9px] leading-none text-white/30">컨시어지</span>
              </button>

              {/* Capture prevention badge */}
              <div
                className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 cursor-default"
                style={{ background: "rgba(0,229,255,0.03)", border: "1px solid rgba(0,229,255,0.1)" }}
              >
                <Icon icon="solar:shield-check-bold" className="w-4 h-4" style={{ color: "rgba(0,229,255,0.4)" }} />
                <span className="text-[9px] leading-none" style={{ color: "rgba(0,229,255,0.3)" }}>보호됨</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Digital watermark — always visible, subtle */}
      <div
        className="fixed bottom-28 left-3 z-30 cursor-default"
        onMouseEnter={() => setWatermarkTooltip(true)}
        onMouseLeave={() => setWatermarkTooltip(false)}
      >
        <span className="text-[10px] font-mono" style={{ color: "rgba(201,168,76,0.15)" }}>🔏 보호됨</span>
        {watermarkTooltip && (
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 rounded-lg whitespace-nowrap"
            style={{ background: "rgba(8,6,4,0.96)", border: "1px solid rgba(201,168,76,0.15)", backdropFilter: "blur(12px)" }}>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              비가시성 워터마크가 적용되어 있습니다
            </span>
          </div>
        )}
      </div>

      {/* ── Concierge chat ── */}
      {conciergeOpen && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            width: conciergeMinimized ? "48px" : "280px",
            height: conciergeMinimized ? "48px" : "340px",
            background: "rgba(8,6,4,0.97)",
            border: "1px solid rgba(201,168,76,0.2)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 40px rgba(0,0,0,0.8)",
          }}
        >
          {conciergeMinimized ? (
            <button
              onClick={() => setConciergeMinimized(false)}
              className="w-full h-full flex items-center justify-center"
              style={{ color: "#C9A84C" }}
            >
              <Icon icon="solar:bell-bold" className="w-5 h-5" />
            </button>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                <div className="flex items-center gap-1.5 flex-1">
                  <Icon icon="solar:lock-keyhole-bold" className="w-3 h-3" style={{ color: "rgba(0,229,255,0.5)" }} />
                  <span className="text-[9px] font-bold tracking-widest" style={{ color: "rgba(0,229,255,0.5)" }}>E2EE</span>
                  <span className="text-white/40 text-xs ml-1">컨시어지</span>
                </div>
                <button onClick={() => setConciergeMinimized(true)}
                  className="text-white/20 hover:text-white/50 transition-colors">
                  <Icon icon="solar:minus-square-bold" className="w-4 h-4" />
                </button>
                <button onClick={() => setConciergeOpen(false)}
                  className="text-white/20 hover:text-white/50 transition-colors">
                  <Icon icon="solar:close-square-bold" className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2 flex flex-col gap-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                      style={
                        msg.from === "user"
                          ? { background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(201,168,76,0.9)" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick orders */}
              <div className="flex gap-1.5 px-3 pb-2 flex-wrap flex-shrink-0">
                {QUICK_ORDERS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => sendChat(o.label)}
                    className="text-[9px] px-2 py-1 rounded-lg transition-all active:scale-95"
                    style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.15)", color: "rgba(201,168,76,0.6)" }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2 px-3 pb-3 flex-shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat(chatInput)}
                  placeholder="스페셜 오더 입력..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder-white/15 outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
                <button
                  onClick={() => sendChat(chatInput)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                  style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}
                >
                  <Icon icon="solar:arrow-up-bold" className="w-3.5 h-3.5" style={{ color: "#C9A84C" }} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Gift modal ── */}
      {giftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setGiftModalOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "rgba(6,4,2,0.99)", border: "1px solid rgba(201,168,76,0.25)", boxShadow: "0 0 80px rgba(201,168,76,0.08)" }}
          >
            {/* Wax seal */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: "radial-gradient(circle, rgba(201,168,76,0.2), rgba(201,168,76,0.05))",
                  border: "2px solid rgba(201,168,76,0.4)",
                  animation: giftSent ? "wax-open 0.5s ease-out forwards" : undefined,
                  boxShadow: "0 0 20px rgba(201,168,76,0.15)",
                }}
              >
                💎
              </div>
              <h2 className="text-sm font-light tracking-[0.25em] uppercase" style={{ color: "#C9A84C" }}>
                디지털 선물
              </h2>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.1)" }} />
              <span className="text-[10px]" style={{ color: "rgba(201,168,76,0.3)" }}>✦</span>
              <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.1)" }} />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
                금액 (O₂ 크레딧)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-center font-light tracking-widest text-lg outline-none"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    color: "#C9A84C",
                    caretColor: "#C9A84C",
                  }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(201,168,76,0.4)" }}>
                  O₂
                </span>
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2">
                {["100", "500", "1000", "5000"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setGiftAmount(v)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                    style={
                      giftAmount === v
                        ? { background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }
                        : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>익명으로 보내기</span>
              <button
                onClick={() => setGiftAnon(!giftAnon)}
                className="relative w-9 h-4.5 rounded-full transition-all flex-shrink-0"
                style={{ background: giftAnon ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)", minWidth: "36px", height: "20px" }}
              >
                <span
                  className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all"
                  style={{ left: giftAnon ? "calc(100% - 16px)" : "2px" }}
                />
              </button>
            </div>

            {/* Send button with shimmer */}
            <button
              onClick={handleGiftSend}
              disabled={giftSent}
              className="relative w-full py-3.5 rounded-xl font-light tracking-[0.3em] text-sm uppercase overflow-hidden transition-all active:scale-95 disabled:opacity-70"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C" }}
            >
              {/* Shimmer sweep */}
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 30%, rgba(201,168,76,0.15) 50%, transparent 70%)",
                  animation: "shimmer 2s ease-in-out infinite",
                  transform: "translateX(-100%)",
                }}
              />
              {giftSent ? "전송 중..." : "선물 보내기"}
            </button>

            <button
              onClick={() => setGiftModalOpen(false)}
              className="text-[11px] text-center transition-colors"
              style={{ color: "rgba(255,255,255,0.12)" }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wax-open {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(15deg); }
          100% { transform: scale(0) rotate(30deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
