"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

const ACCENT = "#00E5FF";
const GOLD = "#FFD700";
const SUCCESS = "#22C55E";

interface CoinPackage {
  id: string; coins: number; price: number; bonus: number;
  badge?: string; badgeColor?: string;
}

const PACKAGES: CoinPackage[] = [
  { id: "p1", coins: 1000,   price: 1000,   bonus: 0 },
  { id: "p2", coins: 5000,   price: 5000,   bonus: 300,   badge: "인기",  badgeColor: ACCENT },
  { id: "p3", coins: 10000,  price: 10000,  bonus: 1000,  badge: "+10%", badgeColor: ACCENT },
  { id: "p4", coins: 30000,  price: 30000,  bonus: 5000,  badge: "+17%", badgeColor: "#7C3AED" },
  { id: "p5", coins: 50000,  price: 50000,  bonus: 10000, badge: "BEST", badgeColor: GOLD },
  { id: "p6", coins: 100000, price: 100000, bonus: 25000, badge: "+25%", badgeColor: GOLD },
];

const PAYMENT_METHODS = [
  { id: "card",  label: "신용카드",   icon: "solar:card-bold" },
  { id: "kakao", label: "카카오페이", icon: "solar:smartphone-bold" },
  { id: "naver", label: "네이버페이", icon: "solar:smartphone-bold" },
  { id: "toss",  label: "토스",       icon: "solar:wallet-bold" },
  { id: "bank",  label: "계좌이체",   icon: "solar:bank-bold" },
];

const fc = (n: number) => n.toLocaleString();

interface Props {
  currentBalance: number;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

export default function ChargeModal({ currentBalance, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState("p2");
  const [payMethod, setPayMethod] = useState("card");
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [balance, setBalance] = useState(currentBalance);
  const [loading, setLoading] = useState(false);

  const pkg = PACKAGES.find(p => p.id === selected)!;
  const totalCoins = pkg.coins + pkg.bonus;

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      const newBal = balance + totalCoins;
      setBalance(newBal);
      setLoading(false);
      setStep("success");
      onSuccess?.(newBal);
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col"
        style={{ background: "rgba(4,8,20,0.98)", border: `1px solid rgba(0,229,255,0.2)`, boxShadow: `0 0 60px rgba(0,229,255,0.1)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <Icon icon="solar:coin-bold" className="w-5 h-5" style={{ color: GOLD }} />
            <span className="text-sm font-black tracking-widest" style={{ color: ACCENT }}>코인 충전</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30` }}>
              <Icon icon="solar:coin-bold" className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-xs font-bold tabular-nums" style={{ color: GOLD }}>{fc(balance)}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: `${SUCCESS}15`, border: `2px solid ${SUCCESS}40`, boxShadow: `0 0 40px ${SUCCESS}30` }}>
                ✅
              </div>
              <div>
                <p className="text-xl font-black text-white mb-1">충전 완료!</p>
                <p className="text-white/50 text-sm">{fc(totalCoins)} 코인이 추가되었습니다</p>
              </div>
              <p className="text-2xl font-black" style={{ color: SUCCESS }}>+{fc(totalCoins)} O₂</p>
              <p className="text-sm text-white/40">현재 잔액: <span className="font-bold" style={{ color: GOLD }}>{fc(balance)} 코인</span></p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{ background: `rgba(0,229,255,0.12)`, border: `1px solid ${ACCENT}40`, color: ACCENT }}
                >
                  더 충전하기
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                >
                  파티로 돌아가기
                </button>
              </div>
            </div>
          )}

          {/* Select */}
          {step === "select" && (
            <>
              {/* Current balance */}
              <div className="text-center mb-6">
                <p className="text-white/30 text-xs tracking-widest mb-1">현재 잔액</p>
                <div className="flex items-center justify-center gap-2">
                  <Icon icon="solar:coin-bold" className="w-5 h-5" style={{ color: GOLD }} />
                  <span className="text-2xl font-black" style={{ color: GOLD }}>{fc(balance)}</span>
                  <span className="text-white/30 text-sm">코인</span>
                </div>
              </div>

              {/* Packages */}
              <p className="text-xs font-bold text-white/40 tracking-widest mb-3">충전 패키지 선택</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
                {PACKAGES.map(p => {
                  const isSelected = selected === p.id;
                  const total = p.coins + p.bonus;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p.id)}
                      className="relative rounded-xl p-3.5 flex flex-col gap-1.5 text-left transition-all active:scale-[0.97]"
                      style={{
                        background: isSelected ? `${ACCENT}10` : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${isSelected ? ACCENT + "60" : "rgba(255,255,255,0.07)"}`,
                        boxShadow: isSelected ? `0 0 16px ${ACCENT}20` : "none",
                      }}
                    >
                      {p.badge && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap"
                          style={{ background: `${p.badgeColor}25`, border: `1px solid ${p.badgeColor}60`, color: p.badgeColor }}>
                          {p.badge}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Icon icon="solar:coin-bold" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                        <span className="font-black text-base text-white tabular-nums">{fc(p.coins)}</span>
                      </div>
                      {p.bonus > 0 && <p className="text-[10px] font-medium" style={{ color: SUCCESS }}>+{fc(p.bonus)} 보너스</p>}
                      <p className="text-[10px] text-white/30">{fc(total)} 합계</p>
                      <p className="text-sm font-black text-white mt-0.5">₩{fc(p.price)}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
                          <Icon icon="solar:check-bold" className="w-2.5 h-2.5 text-black" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Payment method */}
              <p className="text-xs font-bold text-white/40 tracking-widest mb-3">결제 수단</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={payMethod === m.id
                      ? { background: `${ACCENT}12`, border: `1px solid ${ACCENT}40`, color: ACCENT }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
                  >
                    <Icon icon={m.icon} className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="rounded-xl p-4 flex flex-col gap-2.5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">코인 ({fc(pkg.coins)})</span>
                  <span className="text-white/70">₩{fc(pkg.price)}</span>
                </div>
                {pkg.bonus > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: SUCCESS }}>보너스 코인</span>
                    <span style={{ color: SUCCESS }}>+{fc(pkg.bonus)}</span>
                  </div>
                )}
                <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <span className="font-bold text-white text-sm">총 결제금액</span>
                  <span className="text-lg font-black text-white">₩{fc(pkg.price)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>충전 후 잔액</span>
                  <span className="font-bold" style={{ color: GOLD }}>{fc(balance + totalCoins)} 코인</span>
                </div>
              </div>

              <button
                onClick={() => setStep("confirm")}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-[0.98]"
                style={{ background: `rgba(0,229,255,0.15)`, border: `2px solid ${ACCENT}60`, color: ACCENT, boxShadow: `0 0 24px ${ACCENT}20` }}
              >
                ₩{fc(pkg.price)} 결제하기
              </button>
              <p className="text-center text-[10px] text-white/20 mt-2">결제 진행 시 이용약관 및 환불정책에 동의하는 것으로 간주합니다</p>
            </>
          )}
        </div>
      </div>

      {/* Confirm bottom sheet */}
      {step === "confirm" && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(4,10,18,0.99)", border: `1px solid ${ACCENT}30`, boxShadow: `0 0 40px ${ACCENT}15` }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>💳</div>
              <p className="text-base font-black text-white">결제 확인</p>
              <p className="text-xs text-white/40 mt-0.5">{PAYMENT_METHODS.find(m => m.id === payMethod)?.label}</p>
            </div>
            <div className="rounded-xl p-3.5 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">코인</span>
                <span className="text-white font-bold">{fc(totalCoins)} 코인</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">결제 금액</span>
                <span className="text-white font-black">₩{fc(pkg.price)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("select")}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                취소
              </button>
              <button onClick={handleConfirm} disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
                {loading && <Icon icon="solar:refresh-bold" className="w-4 h-4 animate-spin" />}
                {loading ? "처리중..." : "결제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
