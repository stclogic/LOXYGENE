"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#00E5FF";
const GOLD = "#FFD700";
const SUCCESS = "#22C55E";
const WARN = "#F59E0B";
const DANGER = "#EF4444";
const ACCENT2 = "#7C3AED";

interface HostSettlement {
  id: string;
  name: string;
  email: string;
  membership: "일반" | "VIP" | "VVIP";
  grossRevenue: number;
  hostCut: number;      // 30%
  directorCut: number;  // 20%
  platformCut: number;  // 50%
  rooms: number;
  period: string;
  status: "pending" | "processing" | "completed" | "failed";
  bank: string;
  account: string;
}

const MOCK_SETTLEMENTS: HostSettlement[] = [
  { id: "s1", name: "한소희", email: "sohee@example.com", membership: "VVIP", grossRevenue: 913000, hostCut: 273900, directorCut: 182600, platformCut: 456500, rooms: 512, period: "2026-03", status: "pending", bank: "카카오뱅크", account: "****-3812" },
  { id: "s2", name: "김민준", email: "minjun@example.com", membership: "VVIP", grossRevenue: 482000, hostCut: 144600, directorCut: 96400, platformCut: 241000, rooms: 234, period: "2026-03", status: "pending", bank: "신한은행", account: "****-7741" },
  { id: "s3", name: "박지우", email: "jiwoo@example.com", membership: "일반", grossRevenue: 32000, hostCut: 9600, directorCut: 6400, platformCut: 16000, rooms: 89, period: "2026-03", status: "pending", bank: "국민은행", account: "****-5508" },
  { id: "s4", name: "이서연 (DJ Seoul)", email: "seoyeon@example.com", membership: "VIP", grossRevenue: 128000, hostCut: 38400, directorCut: 25600, platformCut: 64000, rooms: 45, period: "2026-03", status: "completed", bank: "우리은행", account: "****-2290" },
  { id: "s5", name: "DJ Matrix", email: "matrix@example.com", membership: "VIP", grossRevenue: 96000, hostCut: 28800, directorCut: 19200, platformCut: 48000, rooms: 38, period: "2026-03", status: "completed", bank: "하나은행", account: "****-9934" },
  { id: "s6", name: "철학자김씨", email: "phil@example.com", membership: "일반", grossRevenue: 54000, hostCut: 16200, directorCut: 10800, platformCut: 27000, rooms: 22, period: "2026-03", status: "failed", bank: "기업은행", account: "****-1127" },
];

const STATUS_CONFIG = {
  pending: { color: WARN, label: "대기" },
  processing: { color: ACCENT, label: "처리중" },
  completed: { color: SUCCESS, label: "완료" },
  failed: { color: DANGER, label: "실패" },
};

function KPI({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-medium">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon icon={icon} className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-xl font-black text-white">{value}</p>
        {sub && <p className="text-xs text-white/35 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminSettlementsPage() {
  const router = useRouter();
  const [settlements, setSettlements] = useState(MOCK_SETTLEMENTS);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [batchConfirm, setBatchConfirm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [period, setPeriod] = useState("2026-03");

  // Admin guard
  useEffect(() => {
    try {
      const role = localStorage.getItem("loxygene-role");
      if (role !== null && role !== "admin") router.replace("/");
    } catch { /* ignore */ }
  }, [router]);

  const filtered = settlements.filter(s => {
    const matchStatus = filterStatus === "전체" || s.status === filterStatus;
    const matchPeriod = s.period === period;
    return matchStatus && matchPeriod;
  });

  const doSettle = (id: string) => {
    setSettlements(ss => ss.map(s => s.id === id ? { ...s, status: "completed" } : s));
    setConfirmId(null);
  };

  const doBatch = () => {
    setSettlements(ss => ss.map(s => s.status === "pending" ? { ...s, status: "completed" } : s));
    setBatchConfirm(false);
  };

  const totalPending = settlements.filter(s => s.status === "pending").reduce((sum, s) => sum + s.hostCut, 0);
  const totalCompleted = settlements.filter(s => s.status === "completed").reduce((sum, s) => sum + s.hostCut, 0);
  const totalPlatform = settlements.reduce((sum, s) => sum + s.platformCut, 0);
  const pendingCount = settlements.filter(s => s.status === "pending").length;

  const memColor: Record<string, string> = { VVIP: GOLD, VIP: ACCENT, "일반": "rgba(255,255,255,0.4)" };

  return (
    <div className="min-h-screen bg-[#060608]">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 lg:px-8 border-b sticky top-0 z-40"
        style={{ background: "rgba(6,6,8,0.97)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <Link href="/admin" className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
          <span>어드민으로</span>
        </Link>
        <h1 className="text-sm font-black tracking-widest" style={{ color: ACCENT }}>정산 관리</h1>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button onClick={() => setBatchConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ background: `${SUCCESS}12`, border: `1px solid ${SUCCESS}30`, color: SUCCESS }}>
              <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
              일괄 정산
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="정산 대기" value={`₩${(totalPending * 10).toLocaleString()}`} sub={`${pendingCount}명`} color={WARN} icon="solar:clock-circle-bold" />
          <KPI label="정산 완료" value={`₩${(totalCompleted * 10).toLocaleString()}`} sub={`${settlements.filter(s => s.status === "completed").length}건`} color={SUCCESS} icon="solar:check-circle-bold" />
          <KPI label="플랫폼 수익 (50%)" value={`₩${(totalPlatform * 10).toLocaleString()}`} sub="이번 달 누계" color={ACCENT} icon="solar:graph-up-bold" />
          <KPI label="총 방 운영" value={`${settlements.reduce((s, h) => s + h.rooms, 0)}개`} sub="이번 달 합계" color={ACCENT2} icon="solar:home-smile-bold" />
        </div>

        {/* Distribution legend */}
        <div className="rounded-2xl p-4 flex flex-wrap gap-4 items-center"
          style={{ background: `${ACCENT2}08`, border: `1px solid ${ACCENT2}20` }}>
          <Icon icon="solar:info-circle-bold" className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT2 }} />
          <div className="flex flex-wrap gap-6 text-xs text-white/50">
            {[
              { label: "플랫폼", pct: 50, color: ACCENT },
              { label: "감독/PD", pct: 20, color: ACCENT2 },
              { label: "호스트", pct: 30, color: SUCCESS },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span>{d.label} <span className="font-bold" style={{ color: d.color }}>{d.pct}%</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1.5">
            {["2026-03", "2026-02", "2026-01"].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={period === p ? { background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: ACCENT } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 ml-auto">
            {["전체", "pending", "completed", "failed"].map(s => {
              const cfg = s === "전체" ? null : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={filterStatus === s ? { background: `${cfg?.color ?? ACCENT}15`, border: `1px solid ${cfg?.color ?? ACCENT}40`, color: cfg?.color ?? ACCENT } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                  {s === "전체" ? "전체" : cfg!.label}
                </button>
              );
            })}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            <Icon icon="solar:download-bold" className="w-3.5 h-3.5" />
            CSV 내보내기
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["호스트", "멤버십", "기간", "총 수익", "호스트 몫 (30%)", "감독 몫 (20%)", "플랫폼 (50%)", "방 수", "계좌", "상태"].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-white/30 font-medium whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-4 py-3.5 text-white/30 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const stCfg = STATUS_CONFIG[s.status];
                  return (
                    <tr key={s.id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-white/85">{s.name}</p>
                          <p className="text-[10px] text-white/30">{s.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${memColor[s.membership]}20`, border: `1px solid ${memColor[s.membership]}50`, color: memColor[s.membership] }}>
                          {s.membership}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-white/40">{s.period}</td>
                      <td className="px-4 py-3.5 font-mono text-white/60">₩{(s.grossRevenue * 10).toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono font-bold" style={{ color: SUCCESS }}>₩{(s.hostCut * 10).toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono" style={{ color: ACCENT2 }}>₩{(s.directorCut * 10).toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono" style={{ color: ACCENT }}>₩{(s.platformCut * 10).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-white/50">{s.rooms}개</td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-white/60">{s.bank}</p>
                          <p className="text-white/30">{s.account}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${stCfg.color}18`, border: `1px solid ${stCfg.color}45`, color: stCfg.color }}>
                          {stCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {s.status === "pending" && (
                          <button onClick={() => setConfirmId(s.id)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 active:scale-95 whitespace-nowrap"
                            style={{ background: `${SUCCESS}12`, border: `1px solid ${SUCCESS}35`, color: SUCCESS }}>
                            정산처리
                          </button>
                        )}
                        {s.status === "failed" && (
                          <button onClick={() => setConfirmId(s.id)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 whitespace-nowrap"
                            style={{ background: `${DANGER}12`, border: `1px solid ${DANGER}35`, color: DANGER }}>
                            재시도
                          </button>
                        )}
                        {(s.status === "completed" || s.status === "processing") && (
                          <span className="text-[11px] text-white/25">완료</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-white/25 text-sm">정산 내역이 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-settlement confirm modal */}
        {confirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
            <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5" style={{ background: "rgba(4,10,18,0.98)", border: `1px solid ${SUCCESS}30` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${SUCCESS}15` }}>
                  <Icon icon="solar:wallet-money-bold" className="w-5 h-5" style={{ color: SUCCESS }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">정산 처리 확인</p>
                  <p className="text-xs text-white/40 mt-0.5">{settlements.find(s => s.id === confirmId)?.name}</p>
                </div>
              </div>
              <div className="rounded-xl p-4 flex flex-col gap-2 text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {(() => {
                  const s = settlements.find(h => h.id === confirmId)!;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/40">정산 금액</span>
                        <span className="font-bold" style={{ color: SUCCESS }}>₩{(s.hostCut * 10).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">입금 계좌</span>
                        <span className="text-white/70">{s.bank} {s.account}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-white/40 leading-relaxed">정산 처리 후 취소가 불가합니다. 진행하시겠습니까?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>취소</button>
                <button onClick={() => doSettle(confirmId)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
                  style={{ background: `${SUCCESS}15`, border: `1px solid ${SUCCESS}50`, color: SUCCESS }}>확인</button>
              </div>
            </div>
          </div>
        )}

        {/* Batch confirm modal */}
        {batchConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
            <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5" style={{ background: "rgba(4,10,18,0.98)", border: `1px solid ${WARN}30` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${WARN}15` }}>
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5" style={{ color: WARN }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">일괄 정산 처리</p>
                  <p className="text-xs text-white/40 mt-0.5">대기 중 {pendingCount}건 전체</p>
                </div>
              </div>
              <div className="rounded-xl p-4 flex flex-col gap-2 text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between">
                  <span className="text-white/40">총 처리 금액</span>
                  <span className="font-bold" style={{ color: WARN }}>₩{(totalPending * 10).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">대상 호스트</span>
                  <span className="text-white/70">{pendingCount}명</span>
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">대기 중인 모든 정산을 일괄 처리합니다. 이 작업은 취소할 수 없습니다.</p>
              <div className="flex gap-3">
                <button onClick={() => setBatchConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>취소</button>
                <button onClick={doBatch}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
                  style={{ background: `${WARN}15`, border: `1px solid ${WARN}50`, color: WARN }}>일괄 처리</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
