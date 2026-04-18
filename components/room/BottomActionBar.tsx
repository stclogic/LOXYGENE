"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useRoomStore } from "@/lib/store/roomStore";
import { useLocalStream } from "@/components/room/ZoomVideoRoom";
import { useWallet } from "@/lib/hooks/useWallet";
import dynamic from "next/dynamic";

const ChargeModal = dynamic(() => import("@/components/ui/ChargeModal"), { ssr: false });

interface GiftParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

interface BottomActionBarProps {
  roomId?: string;
  hostId?: string;
  directorId?: string | null;
}

export function BottomActionBar({ roomId, hostId, directorId }: BottomActionBarProps) {
  const { isInQueue, queuePosition, joinQueue, leaveQueue } = useRoomStore();
  const { isCameraActive, isMicActive, toggleMic, toggleCamera } = useLocalStream();
  const { wallet, sendGift, chargeCredits } = useWallet();
  const [particles, setParticles] = useState<GiftParticle[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);

  const BOUQUET_PRICE = 1000;
  const CHAMPAGNE_PRICE = 3000;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const spawnParticles = (emoji: string) => {
    const newParticles: GiftParticle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50,
      y: Math.random() * -80 - 20,
      emoji,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)));
    }, 900);
  };

  const handleGift = async (type: "bouquet" | "champagne") => {
    const price = type === "bouquet" ? BOUQUET_PRICE : CHAMPAGNE_PRICE;

    if (wallet.balance < price) {
      showToast("크레딧이 부족합니다. 충전하세요");
      setChargeModalOpen(true);
      return;
    }

    spawnParticles(type === "bouquet" ? "💐" : "🍾");

    const result = await sendGift(
      hostId ?? "host",
      directorId ?? null,
      roomId ?? "room-001",
      type,
      1
    );

    if (!result.success) {
      showToast(result.error ?? "선물 전송에 실패했습니다");
    }
  };

  const insufficientBouquet = wallet.balance < BOUQUET_PRICE;
  const insufficientChampagne = wallet.balance < CHAMPAGNE_PRICE;

  return (
    <div
      className="relative flex items-end justify-between gap-2 sm:gap-3 px-2 sm:px-4 py-2.5 rounded-2xl"
      style={{
        background: "rgba(7,7,7,0.95)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Particles */}
      {particles.map((p) => (
        <div key={p.id} className="pointer-events-none absolute text-2xl z-50"
          style={{ bottom: "100%", left: "50%", transform: `translate(${p.x}px, ${p.y}px)`, animation: "particle-burst 0.8s ease-out forwards" }}>
          {p.emoji}
        </div>
      ))}

      {/* Toast */}
      {toast && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium pointer-events-none"
          style={{ background: "rgba(12,12,12,0.95)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff5555" }}
        >
          {toast}
        </div>
      )}

      {/* ── Left: Mic + Camera ── */}
      <div className="flex items-end gap-2">

        {/* Mic */}
        <button
          onClick={toggleMic}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all duration-200 active:scale-95"
          style={{
            background: isMicActive ? "rgba(0,229,255,0.15)" : "rgba(255,50,50,0.1)",
            border: isMicActive ? "1px solid rgba(0,229,255,0.4)" : "1px solid rgba(255,50,50,0.3)",
          }}
        >
          <Icon
            icon={isMicActive ? "solar:microphone-bold" : "solar:microphone-slash-bold"}
            className="text-xl lg:text-base w-6 h-6 lg:w-5 lg:h-5"
            style={{ color: isMicActive ? "#00E5FF" : "#ff5555" }}
          />
          <span className="text-[10px] leading-none lg:hidden" style={{ color: isMicActive ? "#00E5FF" : "#ff5555" }}>
            마이크
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={toggleCamera}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all duration-200 active:scale-95"
          style={{
            background: isCameraActive ? "rgba(0,229,255,0.15)" : "rgba(255,50,50,0.1)",
            border: isCameraActive ? "1px solid rgba(0,229,255,0.4)" : "1px solid rgba(255,50,50,0.3)",
          }}
        >
          <Icon
            icon={isCameraActive ? "solar:camera-bold" : "solar:camera-slash-bold"}
            className="text-xl lg:text-base w-6 h-6 lg:w-5 lg:h-5"
            style={{ color: isCameraActive ? "#00E5FF" : "#ff5555" }}
          />
          <span className="text-[10px] leading-none lg:hidden" style={{ color: isCameraActive ? "#00E5FF" : "#ff5555" }}>카메라</span>
        </button>
      </div>

      {/* ── Center: Join Queue ── */}
      <button
        onClick={isInQueue ? leaveQueue : joinQueue}
        className="flex flex-col items-center justify-center gap-1 min-h-[44px] flex-1 lg:flex-none px-2 lg:px-4 py-2 rounded-xl font-semibold transition-all duration-200 active:scale-95"
        style={
          isInQueue
            ? { background: "rgba(255,0,127,0.15)", border: "1px solid rgba(255,0,127,0.4)", color: "#FF007F", boxShadow: "0 0 15px rgba(255,0,127,0.3)" }
            : { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", boxShadow: "0 0 10px rgba(0,229,255,0.2)" }
        }
      >
        {/* Desktop: icon + text inline */}
        <div className="hidden lg:flex items-center gap-2">
          <Icon icon={isInQueue ? "solar:close-circle-bold" : "solar:microphone-bold"} className="w-4 h-4" />
          <span className="text-sm">{isInQueue ? `대기 중 (${queuePosition}번)` : "마이크 잡기"}</span>
        </div>
        {/* Mobile: icon stacked + label */}
        <Icon icon={isInQueue ? "solar:close-circle-bold" : "solar:microphone-bold"} className="lg:hidden text-xl w-6 h-6" />
        <span className="text-[10px] leading-none lg:hidden">
          {isInQueue ? `${queuePosition}번 대기` : "마이크잡기"}
        </span>
      </button>

      {/* ── Right: Gifts + F&B ── */}
      <div className="flex items-end gap-2">

        {/* Bouquet */}
        <button
          onClick={() => handleGift("bouquet")}
          title={insufficientBouquet ? "크레딧이 부족합니다. 충전하세요" : "꽃다발 1,000 O₂"}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all duration-200 active:scale-95"
          style={{
            background: insufficientBouquet ? "rgba(255,50,50,0.08)" : "rgba(255,0,127,0.12)",
            border: insufficientBouquet ? "1px solid rgba(255,50,50,0.25)" : "1px solid rgba(255,0,127,0.35)",
          }}
        >
          <span className="text-xl leading-none">💐</span>
          <span className="text-[10px] leading-none" style={{ color: insufficientBouquet ? "#ff5555" : "#FF007F" }}>꽃다발</span>
        </button>

        {/* Champagne */}
        <button
          onClick={() => handleGift("champagne")}
          title={insufficientChampagne ? "크레딧이 부족합니다. 충전하세요" : "샴페인 3,000 O₂"}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all duration-200 active:scale-95"
          style={{
            background: insufficientChampagne ? "rgba(255,50,50,0.08)" : "rgba(255,215,0,0.08)",
            border: insufficientChampagne ? "1px solid rgba(255,50,50,0.25)" : "1px solid rgba(255,215,0,0.25)",
          }}
        >
          <span className="text-xl leading-none">🍾</span>
          <span className="text-[10px] leading-none" style={{ color: insufficientChampagne ? "#ff5555" : "rgba(250,204,21,0.7)" }}>샴페인</span>
        </button>

        {/* F&B — hidden below 375px */}
        <button
          className="hidden min-[375px]:flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all duration-200 active:scale-95"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Icon icon="solar:wine-glass-bold" className="text-xl lg:text-base w-6 h-6 lg:w-5 lg:h-5 text-white/40" />
          <span className="text-[10px] leading-none text-white/30 lg:hidden">F&amp;B</span>
        </button>

        {/* Settings / Control Panel */}
        <Link
          href="/control-panel"
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl px-2 py-2 transition-all duration-200 active:scale-95"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          title="컨트롤 패널"
        >
          <Icon icon="solar:settings-linear" className="text-xl lg:text-base w-6 h-6 lg:w-5 lg:h-5 text-white/40" />
          <span className="text-[10px] leading-none text-white/30 lg:hidden">설정</span>
        </Link>
      </div>

      {/* Charge modal — rendered in-place when needed from action bar */}
      <ChargeModal
        open={chargeModalOpen}
        currentBalance={wallet.balance}
        onClose={() => setChargeModalOpen(false)}
        onCharge={chargeCredits}
      />
    </div>
  );
}
