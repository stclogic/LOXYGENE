"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#00E5FF";
const GOLD = "#FFD700";
const SUCCESS = "#22C55E";
const DANGER = "#EF4444";
const WARN = "#F59E0B";
const PINK = "#FF007F";

type ViewMode = "transactions" | "fnb";

interface FnbOrder {
  id: string;
  item_name: string;
  quantity: number;
  total_coins: number;
  status: "pending" | "confirmed" | "delivering" | "delivered" | "cancelled";
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "대기중", color: WARN },
  confirmed: { label: "확인됨", color: ACCENT },
  delivering: { label: "배달중", color: "#8B5CF6" },
  delivered: { label: "완료", color: SUCCESS },
  cancelled: { label: "취소됨", color: DANGER },
};

type TxType = "charge" | "spend" | "earn" | "refund";
type Period = "전체" | "이번달" | "지난달" | "3개월";

interface Tx {
  id: string; type: TxType; amount: number; desc: string;
  date: string; time: string; balance: number; roomTitle?: string;
}

const MOCK_HISTORY: Tx[] = [
  { id: "h1", type: "charge", amount: 50000, desc: "코인 50,000 충전 (카카오페이)", date: "2026-04-17", time: "23:41", balance: 62400 },
  { id: "h2", type: "spend", amount: -3000, desc: "슈퍼챗 전송", date: "2026-04-17", time: "23:39", balance: 12400, roomTitle: "하우스 파티 나이트" },
  { id: "h3", type: "earn", amount: 12400, desc: "방 수익 정산 (30%)", date: "2026-04-17", time: "23:37", balance: 15400 },
  { id: "h4", type: "spend", amount: -1500, desc: "아이템 선물 — 불꽃🔥", date: "2026-04-16", time: "22:14", balance: 3000, roomTitle: "K-POP 리믹스 파티" },
  { id: "h5", type: "charge", amount: 20000, desc: "코인 20,000 충전 (신용카드)", date: "2026-04-16", time: "19:05", balance: 4500 },
  { id: "h6", type: "spend", amount: -2000, desc: "입장료", date: "2026-04-15", time: "21:30", balance: 2500, roomTitle: "요즘 연애가 어려운 이유" },
  { id: "h7", type: "refund", amount: 2000, desc: "입장료 환불", date: "2026-04-15", time: "21:35", balance: 4500 },
  { id: "h8", type: "earn", amount: 6800, desc: "방 수익 정산 (30%)", date: "2026-04-14", time: "20:00", balance: 2500 },
  { id: "h9", type: "spend", amount: -500, desc: "이모티콘 반응 — 💎", date: "2026-04-13", time: "23:11", balance: 500, roomTitle: "DJ Booth" },
  { id: "h10", type: "charge", amount: 10000, desc: "코인 10,000 충전 (토스)", date: "2026-04-10", time: "17:22", balance: 1000 },
  { id: "h11", type: "spend", amount: -3500, desc: "VIP 좌석 구매", date: "2026-04-08", time: "20:45", balance: 4000, roomTitle: "90s 레이브 복각" },
  { id: "h12", type: "earn", amount: 4200, desc: "방 수익 정산 (30%)", date: "2026-03-31", time: "23:59", balance: 7500 },
  { id: "h13", type: "charge", amount: 30000, desc: "코인 30,000+5000 충전 (네이버페이)", date: "2026-03-28", time: "14:10", balance: 3300 },
  { id: "h14", type: "spend", amount: -8000, desc: "호스트 특별 선물", date: "2026-03-25", time: "22:00", balance: 1500, roomTitle: "스피드퀴즈 배틀" },
];

const TYPE_CONFIG: Record<TxType, { color: string; icon: string; label: string }> = {
  charge: { color: SUCCESS, icon: "solar:add-circle-bold", label: "충전" },
  spend: { color: DANGER, icon: "solar:minus-circle-bold", label: "지출" },
  earn: { color: ACCENT, icon: "solar:chart-2-bold", label: "수익" },
  refund: { color: WARN, icon: "solar:refresh-circle-bold", label: "환불" },
};

function TxItem({ tx }: { tx: Tx }) {
  const cfg = TYPE_CONFIG[tx.type];
  const isPositive = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}25` }}>
        <Icon icon={cfg.icon} className="w-4.5 h-4.5" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 font-medium leading-snug">{tx.desc}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.roomTitle && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${ACCENT}10`, color: ACCENT + "90", border: `1px solid ${ACCENT}20` }}>
              {tx.roomTitle}
            </span>
          )}
          <span className="text-[11px] text-white/30">{tx.date} {tx.time}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black tabular-nums" style={{ color: isPositive ? cfg.color : DANGER }}>
          {isPositive ? "+" : ""}₩{(tx.amount * 10).toLocaleString()}
        </p>
        <p className="text-[10px] text-white/25 mt-0.5">잔액 ₩{(tx.balance * 10).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function PaymentHistoryPage() {
  const [filterType, setFilterType] = useState<"전체" | TxType>("전체");
  const [period, setPeriod] = useState<Period>("이번달");
  const [currentBalance] = useState(62400);
  const [viewMode, setViewMode] = useState<ViewMode>("transactions");
  const [fnbOrders, setFnbOrders] = useState<FnbOrder[]>([]);
  const [fnbLoading, setFnbLoading] = useState(false);

  useEffect(() => {
    if (viewMode !== "fnb") return;
    setFnbLoading(true);
    fetch("/api/fnb/orders")
      .then(r => r.json())
      .then(d => setFnbOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setFnbLoading(false));
  }, [viewMode]);

  const filtered = MOCK_HISTORY.filter(tx => {
    const matchType = filterType === "전체" || tx.type === filterType;
    const matchPeriod = (() => {
      if (period === "전체") return true;
      const d = new Date(tx.date);
      const now = new Date("2026-04-17");
      if (period === "이번달") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === "지난달") { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); }
      if (period === "3개월") { const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 3); return d >= cutoff; }
      return true;
    })();
    return matchType && matchPeriod;
  });

  // Monthly summary
  const thisMonth = MOCK_HISTORY.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === 3 && d.getFullYear() === 2026;
  });
  const charged = thisMonth.filter(t => t.type === "charge").reduce((s, t) => s + t.amount, 0);
  const spent = thisMonth.filter(t => t.type === "spend").reduce((s, t) => s + Math.abs(t.amount), 0);
  const earned = thisMonth.filter(t => t.type === "earn").reduce((s, t) => s + t.amount, 0);

  // Group by date for display
  const grouped = filtered.reduce<Record<string, Tx[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#070707] relative">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 lg:px-8 border-b sticky top-0 z-40"
        style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <Link href="/" className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
          <span>홈으로</span>
        </Link>
        <h1 className="text-sm font-black tracking-widest" style={{ color: ACCENT }}>결제 내역</h1>
        <Link href="/payments/charge"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
          <Icon icon="solar:add-circle-bold" className="w-3.5 h-3.5" />
          충전
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">

        {/* View mode toggle */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([["transactions", "💳 결제 내역"], ["fnb", "🥂 F&B 주문"]] as [ViewMode, string][]).map(([mode, label]) => (
            <button key={mode} type="button" onClick={() => setViewMode(mode)}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={viewMode === mode
                ? { background: mode === "fnb" ? `${PINK}18` : `${ACCENT}15`, border: `1px solid ${mode === "fnb" ? PINK : ACCENT}40`, color: mode === "fnb" ? PINK : ACCENT }
                : { color: "rgba(255,255,255,0.35)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* F&B Orders view */}
        {viewMode === "fnb" && (
          <div className="flex flex-col gap-3">
            {fnbLoading && (
              <div className="text-center py-12 text-white/25 text-sm">주문 내역 불러오는 중...</div>
            )}
            {!fnbLoading && fnbOrders.length === 0 && (
              <div className="text-center py-12 text-white/20 text-sm">F&B 주문 내역이 없습니다</div>
            )}
            {fnbOrders.map(order => {
              const st = STATUS_LABEL[order.status] ?? { label: order.status, color: "rgba(255,255,255,0.4)" };
              return (
                <div key={order.id} className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${PINK}10`, border: `1px solid ${PINK}20` }}>🥂</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/85 truncate">{order.item_name}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {order.quantity}개 · {new Date(order.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-black tabular-nums" style={{ color: GOLD }}>
                      -{order.total_coins.toLocaleString()} O₂
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${st.color}15`, border: `1px solid ${st.color}30`, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "transactions" && (<>
        {/* Balance card */}
        <div className="rounded-2xl p-6 mb-6 flex flex-col gap-1"
          style={{ background: `linear-gradient(135deg, rgba(0,229,255,0.08), rgba(0,229,255,0.02))`, border: `1px solid ${ACCENT}25` }}>
          <p className="text-xs text-white/40 tracking-widest">현재 코인 잔액</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black" style={{ color: GOLD }}>{currentBalance.toLocaleString()}</span>
            <span className="text-white/30 mb-1">코인</span>
          </div>
          <p className="text-xs text-white/30">= ₩{(currentBalance * 10).toLocaleString()}</p>
        </div>

        {/* Monthly summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "이번달 충전", value: charged, color: SUCCESS, prefix: "+" },
            { label: "이번달 지출", value: spent, color: DANGER, prefix: "-" },
            { label: "이번달 수익", value: earned, color: ACCENT, prefix: "+" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3.5 flex flex-col gap-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-white/30">{s.label}</p>
              <p className="text-base font-black tabular-nums" style={{ color: s.color }}>
                {s.prefix}{s.value.toLocaleString()}
              </p>
              <p className="text-[10px] text-white/20">₩{(s.value * 10).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {(["전체", "이번달", "지난달", "3개월"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={period === p ? { background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: ACCENT } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {(["전체", "charge", "spend", "earn", "refund"] as ("전체" | TxType)[]).map(t => {
              const cfg = t === "전체" ? null : TYPE_CONFIG[t];
              return (
                <button key={t} onClick={() => setFilterType(t)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={filterType === t
                    ? { background: `${cfg?.color ?? ACCENT}15`, border: `1px solid ${cfg?.color ?? ACCENT}40`, color: cfg?.color ?? ACCENT }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                  {t === "전체" ? "전체" : cfg!.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-12 text-white/20 text-sm">내역이 없습니다</div>
          )}
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="px-4 py-2 sticky top-14 z-10" style={{ background: "rgba(6,6,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="text-[11px] font-bold text-white/30">{date}</p>
              </div>
              {txs.map(tx => <TxItem key={tx.id} tx={tx} />)}
            </div>
          ))}
        </div>
        </>)}
      </div>

      <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
