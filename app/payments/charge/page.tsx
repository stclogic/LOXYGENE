"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#00E5FF";
const GOLD = "#FFD700";
const SUCCESS = "#22C55E";

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
  label?: string;
  badge?: string;
  badgeColor?: string;
}

const PACKAGES: CoinPackage[] = [
  { id: "p1", coins: 1000, price: 1000, bonus: 0 },
  { id: "p2", coins: 5000, price: 5000, bonus: 300, badge: "인기", badgeColor: ACCENT },
  { id: "p3", coins: 10000, price: 10000, bonus: 1000, badge: "+10%", badgeColor: ACCENT },
  { id: "p4", coins: 30000, price: 30000, bonus: 5000, badge: "+17%", badgeColor: "#7C3AED" },
  { id: "p5", coins: 50000, price: 50000, bonus: 10000, badge: "BEST", badgeColor: GOLD },
  { id: "p6", coins: 100000, price: 100000, bonus: 25000, label: "VIP 전용", badge: "+25%", badgeColor: GOLD },
];

const PAYMENT_METHODS = [
  { id: "card", label: "신용카드", icon: "solar:card-bold" },
  { id: "kakao", label: "카카오페이", icon: "solar:smartphone-bold" },
  { id: "naver", label: "네이버페이", icon: "solar:smartphone-bold" },
  { id: "toss", label: "토스", icon: "solar:wallet-bold" },
  { id: "bank", label: "계좌이체", icon: "solar:bank-bold" },
];

// Confetti particle
function Confetti({ count = 60 }: { count?: number }) {
  const COLORS = [ACCENT, GOLD, "#FF6B6B", "#A78BFA", "#34D399", "#F472B6"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const color = COLORS[i % COLORS.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.5 + Math.random() * 1.5;
        const size = 6 + Math.random() * 8;
        const rotate = Math.random() * 360;
        return (
          <div key={i} className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.6,
              background: color,
              transform: `rotate(${rotate}deg)`,
              animation: `confettiFall ${duration}s ${delay}s ease-in forwards`,
              opacity: 0.9,
            }} />
        );
      })}
    </div>
  );
}

export default function ChargePage() {
  const [selected, setSelected] = useState<string>("p2");
  const [payMethod, setPayMethod] = useState("card");
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [balance, setBalance] = useState(12400);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const pkg = PACKAGES.find(p => p.id === selected)!;
  const totalCoins = pkg.coins + pkg.bonus;

  const handlePay = () => {
    setStep("confirm");
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBalance(b => b + totalCoins);
      setStep("success");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 1500);
  };

  // Format coin number
  const fc = (n: number) => n.toLocaleString();

  return (
    <div className="min-h-screen bg-[#070707] relative overflow-hidden">
      {showConfetti && <Confetti />}

      {/* BG glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10"
          style={{ background: `radial-gradient(ellipse, ${ACCENT}, transparent)`, filter: "blur(80px)" }} />
      </div>

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 lg:px-8 border-b relative z-10"
        style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <Link href="/" className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
          <span>홈으로</span>
        </Link>
        <h1 className="text-sm font-black tracking-widest" style={{ color: ACCENT }}>코인 충전</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30` }}>
          <Icon icon="solar:coin-bold" className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span className="text-xs font-bold tabular-nums" style={{ color: GOLD }}>{fc(balance)}</span>
        </div>
      </header>

      {/* Success screen */}
      {step === "success" && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-6 text-center gap-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: `${SUCCESS}15`, border: `2px solid ${SUCCESS}40`, boxShadow: `0 0 40px ${SUCCESS}30` }}>
            ✅
          </div>
          <div>
            <p className="text-2xl font-black text-white mb-2">충전 완료!</p>
            <p className="text-white/50 text-sm">{fc(totalCoins)} 코인이 계정에 추가되었습니다</p>
          </div>
          <div className="rounded-2xl px-8 py-5 flex flex-col items-center gap-1"
            style={{ background: `${SUCCESS}08`, border: `1px solid ${SUCCESS}25` }}>
            <p className="text-3xl font-black" style={{ color: SUCCESS }}>+{fc(totalCoins)}</p>
            <p className="text-xs text-white/40">코인</p>
          </div>
          <div className="text-sm text-white/40">
            현재 잔액: <span className="font-bold" style={{ color: GOLD }}>{fc(balance)} 코인</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("select")}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
              더 충전하기
            </button>
            <Link href="/"
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              홈으로
            </Link>
          </div>
        </div>
      )}

      {/* Select screen */}
      {step !== "success" && (
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-24">
          <div className="text-center mb-8">
            <p className="text-white/30 text-xs tracking-widest mb-2">현재 잔액</p>
            <div className="flex items-center justify-center gap-2">
              <Icon icon="solar:coin-bold" className="w-6 h-6" style={{ color: GOLD }} />
              <span className="text-3xl font-black" style={{ color: GOLD }}>{fc(balance)}</span>
              <span className="text-white/30 text-sm">코인</span>
            </div>
          </div>

          {/* Package grid */}
          <p className="text-xs font-bold text-white/40 tracking-widest mb-4">충전 패키지 선택</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {PACKAGES.map(pkg => {
              const isSelected = selected === pkg.id;
              const totalC = pkg.coins + pkg.bonus;
              return (
                <button key={pkg.id} onClick={() => setSelected(pkg.id)}
                  className="relative rounded-2xl p-4 flex flex-col gap-2 text-left transition-all active:scale-[0.97]"
                  style={{
                    background: isSelected ? `${ACCENT}10` : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${isSelected ? ACCENT + "60" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isSelected ? `0 0 20px ${ACCENT}20` : "none",
                  }}>
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap"
                      style={{ background: `${pkg.badgeColor}25`, border: `1px solid ${pkg.badgeColor}60`, color: pkg.badgeColor }}>
                      {pkg.badge}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Icon icon="solar:coin-bold" className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                    <span className="font-black text-lg text-white tabular-nums">{fc(pkg.coins)}</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <p className="text-[11px] font-medium" style={{ color: SUCCESS }}>+{fc(pkg.bonus)} 보너스</p>
                  )}
                  <p className="text-xs text-white/35">{fc(totalC)} 코인 합계</p>
                  <div className="mt-1 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-sm font-black text-white">₩{fc(pkg.price)}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
                      <Icon icon="solar:check-bold" className="w-3 h-3 text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Payment method */}
          <p className="text-xs font-bold text-white/40 tracking-widest mb-4">결제 수단</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={() => setPayMethod(m.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={payMethod === m.id
                  ? { background: `${ACCENT}12`, border: `1px solid ${ACCENT}40`, color: ACCENT }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                <Icon icon={m.icon} className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-2xl p-5 flex flex-col gap-3 mb-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs font-bold text-white/40 tracking-widest">결제 요약</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">코인 ({fc(pkg.coins)})</span>
              <span className="text-white/70">₩{fc(pkg.price)}</span>
            </div>
            {pkg.bonus > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: SUCCESS }}>보너스 코인</span>
                <span style={{ color: SUCCESS }}>+{fc(pkg.bonus)}</span>
              </div>
            )}
            <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <span className="font-bold text-white">총 결제금액</span>
              <span className="text-xl font-black text-white">₩{fc(pkg.price)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>충전 후 잔액</span>
              <span className="font-bold" style={{ color: GOLD }}>{fc(balance + totalCoins)} 코인</span>
            </div>
          </div>

          {/* Pay button */}
          <button onClick={handlePay}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98]"
            style={{ background: `rgba(0,229,255,0.15)`, border: `2px solid ${ACCENT}60`, color: ACCENT, boxShadow: `0 0 30px ${ACCENT}25` }}>
            ₩{fc(pkg.price)} 결제하기
          </button>
          <p className="text-center text-[11px] text-white/25 mt-3">
            결제 진행 시 이용약관 및 환불정책에 동의하는 것으로 간주합니다
          </p>
        </div>
      )}

      {/* Confirm modal */}
      {step === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "rgba(4,10,18,0.98)", border: `1px solid ${ACCENT}30`, boxShadow: `0 0 60px ${ACCENT}15` }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>
                💳
              </div>
              <p className="text-lg font-black text-white">결제 확인</p>
              <p className="text-xs text-white/40 mt-1">{PAYMENT_METHODS.find(m => m.id === payMethod)?.label}</p>
            </div>
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">코인</span>
                <span className="text-white font-bold">{fc(totalCoins)} 코인</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">결제 금액</span>
                <span className="text-white font-black">₩{fc(pkg.price)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("select")}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                취소
              </button>
              <button onClick={handleConfirm} disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}50`, color: ACCENT, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Icon icon="solar:refresh-bold" className="w-4 h-4 animate-spin" /> : null}
                {loading ? "처리중..." : "결제하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
