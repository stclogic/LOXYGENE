"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

interface ChargePackage {
  credits: number;
  bonus: number;
  priceKRW: number;
  label?: string;
}

const PACKAGES: ChargePackage[] = [
  { credits: 1000,  bonus: 0,     priceKRW: 10000  },
  { credits: 3000,  bonus: 0,     priceKRW: 30000  },
  { credits: 5000,  bonus: 500,   priceKRW: 50000,  label: "🎁" },
  { credits: 10000, bonus: 2000,  priceKRW: 100000, label: "🎁" },
  { credits: 25000, bonus: 5000,  priceKRW: 250000, label: "🎁" },
  { credits: 50000, bonus: 20000, priceKRW: 500000, label: "🎁" },
];

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  vvipOnly?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "card",       label: "신용카드",   icon: "solar:card-2-bold" },
  { id: "kakaopay",   label: "카카오페이", icon: "solar:smartphone-bold" },
  { id: "tosspay",    label: "토스페이",   icon: "solar:transfer-horizontal-bold" },
  { id: "bank",       label: "무통장입금", icon: "solar:buildings-2-bold" },
  { id: "usdt",       label: "USDT",       icon: "solar:diamond-bold", vvipOnly: true },
];

interface ChargeModalProps {
  open: boolean;
  currentBalance: number;
  onClose: () => void;
  onCharge: (amountKRW: number, pgProvider: string) => Promise<{ success: boolean; creditsAdded?: number; error?: string }>;
}

type Stage = "select" | "payment" | "processing" | "success" | "error";

export default function ChargeModal({ open, currentBalance, onClose, onCharge }: ChargeModalProps) {
  const [stage, setStage] = useState<Stage>("select");
  const [selectedPkg, setSelectedPkg] = useState<ChargePackage | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("card");
  const [errorMsg, setErrorMsg] = useState("");
  const [creditsAdded, setCreditsAdded] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStage("select");
      setSelectedPkg(null);
      setSelectedMethod("card");
      setErrorMsg("");
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!selectedPkg) return;
    setStage("processing");

    // Fire confetti on success
    const fireConfetti = () => {
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.55 },
          colors: ["#00E5FF", "#FF007F", "#C9A84C", "#ffffff"],
          scalar: 0.9,
        });
      });
    };

    const result = await onCharge(selectedPkg.priceKRW, selectedMethod);

    if (result.success) {
      setCreditsAdded(result.creditsAdded ?? (selectedPkg.credits + selectedPkg.bonus));
      setStage("success");
      fireConfetti();
    } else {
      setErrorMsg(result.error ?? "충전에 실패했습니다");
      setStage("error");
    }
  }, [selectedPkg, selectedMethod, onCharge]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(10,10,12,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "90dvh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)" }}>
              <Icon icon="solar:wallet-bold" className="w-4 h-4 text-[#00E5FF]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">O₂ 크레딧 충전</h2>
              <p className="text-[10px] text-white/35">
                현재 잔액 <span className="text-[#00E5FF]">{currentBalance.toLocaleString()}</span> O₂
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* ── Select package ── */}
          {stage === "select" && (
            <>
              <p className="text-[10px] text-white/30 tracking-widest mb-3">충전 패키지 선택</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPkg?.priceKRW === pkg.priceKRW;
                  const totalCredits = pkg.credits + pkg.bonus;
                  return (
                    <button
                      key={pkg.priceKRW}
                      onClick={() => setSelectedPkg(pkg)}
                      className="relative flex flex-col gap-0.5 p-3 rounded-xl text-left transition-all duration-200 active:scale-[0.97]"
                      style={{
                        background: isSelected ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.02)",
                        border: isSelected ? "1px solid rgba(0,229,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: isSelected ? "0 0 12px rgba(0,229,255,0.08)" : "none",
                      }}
                    >
                      {pkg.label && (
                        <span className="absolute top-2 right-2 text-[10px]">{pkg.label}</span>
                      )}
                      <span className="text-sm font-black"
                        style={{ color: isSelected ? "#00E5FF" : "rgba(255,255,255,0.9)" }}>
                        {totalCredits.toLocaleString()} O₂
                      </span>
                      {pkg.bonus > 0 && (
                        <span className="text-[9px] font-medium text-[#C9A84C]">
                          +{pkg.bonus.toLocaleString()} 보너스
                        </span>
                      )}
                      <span className="text-[11px] text-white/40 mt-0.5">
                        ₩{pkg.priceKRW.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Payment methods */}
              <p className="text-[10px] text-white/30 tracking-widest mb-2">결제 수단</p>
              <div className="flex flex-col gap-1.5 mb-5">
                {PAYMENT_METHODS.map((m) => {
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                      style={{
                        background: isSelected ? "rgba(0,229,255,0.06)" : "rgba(255,255,255,0.02)",
                        border: isSelected
                          ? m.id === "usdt" ? "1px solid rgba(201,168,76,0.5)" : "1px solid rgba(0,229,255,0.3)"
                          : "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <Icon icon={m.icon}
                        className="w-4 h-4 flex-shrink-0"
                        style={{
                          color: isSelected
                            ? m.id === "usdt" ? "#C9A84C" : "#00E5FF"
                            : "rgba(255,255,255,0.35)",
                        }}
                      />
                      <span className="text-xs flex-1 text-left"
                        style={{ color: isSelected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }}>
                        {m.label}
                      </span>
                      {m.vvipOnly && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}>
                          VVIP
                        </span>
                      )}
                      {isSelected && (
                        <Icon icon="solar:check-circle-bold" className="w-4 h-4 flex-shrink-0"
                          style={{ color: m.id === "usdt" ? "#C9A84C" : "#00E5FF" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* VAT notice */}
              <p className="text-[10px] text-white/20 mb-4">* 부가세 10% 포함 금액입니다</p>

              {/* Confirm */}
              <button
                onClick={() => selectedPkg && setStage("payment")}
                disabled={!selectedPkg}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{
                  background: selectedPkg ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: selectedPkg ? "1px solid rgba(0,229,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  color: selectedPkg ? "#00E5FF" : "rgba(255,255,255,0.2)",
                  boxShadow: selectedPkg ? "0 0 16px rgba(0,229,255,0.1)" : "none",
                  cursor: selectedPkg ? "pointer" : "not-allowed",
                }}
              >
                {selectedPkg
                  ? `₩${selectedPkg.priceKRW.toLocaleString()} 결제하기`
                  : "패키지를 선택하세요"}
              </button>
            </>
          )}

          {/* ── Payment confirm ── */}
          {stage === "payment" && selectedPkg && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl flex flex-col gap-2"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">충전 크레딧</span>
                  <span className="text-white font-medium">{(selectedPkg.credits + selectedPkg.bonus).toLocaleString()} O₂</span>
                </div>
                {selectedPkg.bonus > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">보너스</span>
                    <span className="text-[#C9A84C]">+{selectedPkg.bonus.toLocaleString()} O₂</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">결제 수단</span>
                  <span className="text-white/70">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}</span>
                </div>
                <div className="border-t border-white/5 mt-1 pt-2 flex justify-between">
                  <span className="text-xs text-white/40">결제 금액 (VAT 포함)</span>
                  <span className="text-sm font-black text-white">₩{selectedPkg.priceKRW.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStage("select")}
                  className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
                >
                  뒤로
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-[2] py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", boxShadow: "0 0 16px rgba(0,229,255,0.12)" }}
                >
                  결제 확인
                </button>
              </div>
            </div>
          )}

          {/* ── Processing ── */}
          {stage === "processing" && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full animate-ping"
                  style={{ border: "2px solid rgba(0,229,255,0.35)", animationDuration: "1s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon icon="solar:wallet-bold" className="w-7 h-7 text-[#00E5FF]" />
                </div>
              </div>
              <p className="text-white/70 text-sm">결제 처리 중...</p>
            </div>
          )}

          {/* ── Success ── */}
          {stage === "success" && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)" }}>
                <Icon icon="solar:check-circle-bold" className="w-8 h-8 text-[#00E5FF]" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base">충전 완료!</p>
                <p className="text-[#00E5FF] text-2xl font-black mt-1">
                  +{creditsAdded.toLocaleString()} O₂
                </p>
                <p className="text-white/35 text-xs mt-2">
                  잔액: {(currentBalance + creditsAdded).toLocaleString()} O₂
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}
              >
                확인
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {stage === "error" && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <Icon icon="solar:close-circle-bold" className="w-7 h-7 text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">결제 실패</p>
                <p className="text-white/40 text-xs mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                  닫기
                </button>
                <button onClick={() => setStage("payment")}
                  className="flex-[2] py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                  다시 시도
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
