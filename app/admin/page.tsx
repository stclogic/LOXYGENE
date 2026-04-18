"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const ACCENT = "#00E5FF";
const ACCENT2 = "#7C3AED";
const DANGER = "#EF4444";
const WARN = "#F59E0B";
const SUCCESS = "#22C55E";

// ─── Mock Data ────────────────────────────────────────────────────────────────
interface User {
  id: string; name: string; email: string; role: "user" | "host" | "admin";
  membership: "일반" | "VIP" | "VVIP"; balance: number; joined: string;
  status: "active" | "suspended" | "banned"; rooms: number; reports: number;
}
interface Room {
  id: string; title: string; type: string; host: string; participants: number;
  maxParticipants: number; started: string; status: "live" | "ended" | "scheduled";
  revenue: number;
}
interface Transaction {
  id: string; user: string; type: "charge" | "spend" | "earn" | "settle";
  amount: number; desc: string; at: string;
}
interface Report {
  id: string; reporter: string; target: string; reason: string;
  category: "spam" | "abuse" | "inappropriate" | "other"; at: string;
  status: "pending" | "reviewed" | "dismissed";
}

const MOCK_USERS: User[] = [
  { id: "u1", name: "김민준", email: "minjun@example.com", role: "host", membership: "VVIP", balance: 48200, joined: "2025-01-12", status: "active", rooms: 234, reports: 0 },
  { id: "u2", name: "이서연", email: "seoyeon@example.com", role: "user", membership: "VIP", balance: 12800, joined: "2025-03-07", status: "active", rooms: 0, reports: 1 },
  { id: "u3", name: "박지우", email: "jiwoo@example.com", role: "host", membership: "일반", balance: 3200, joined: "2025-06-20", status: "active", rooms: 89, reports: 2 },
  { id: "u4", name: "최현우", email: "hyunwoo@example.com", role: "user", membership: "일반", balance: 600, joined: "2026-01-03", status: "suspended", rooms: 0, reports: 5 },
  { id: "u5", name: "정예린", email: "yerin@example.com", role: "user", membership: "VIP", balance: 22100, joined: "2025-09-15", status: "active", rooms: 0, reports: 0 },
  { id: "u6", name: "한소희", email: "sohee@example.com", role: "host", membership: "VVIP", balance: 91300, joined: "2024-11-28", status: "active", rooms: 512, reports: 0 },
  { id: "u7", name: "오승민", email: "seungmin@example.com", role: "user", membership: "일반", balance: 0, joined: "2026-02-14", status: "banned", rooms: 0, reports: 12 },
  { id: "u8", name: "임나연", email: "nayeon@example.com", role: "user", membership: "VIP", balance: 7700, joined: "2025-07-30", status: "active", rooms: 0, reports: 0 },
];

const MOCK_ROOMS: Room[] = [
  { id: "r1", title: "하우스 파티 나이트 🏠", type: "DJ", host: "DJ Cyan", participants: 94, maxParticipants: 200, started: "22:14", status: "live", revenue: 4200 },
  { id: "r2", title: "요즘 연애가 어려운 이유", type: "토크쇼", host: "철학자김씨", participants: 28, maxParticipants: 50, started: "21:30", status: "live", revenue: 1100 },
  { id: "r3", title: "K-POP 리믹스 파티 🇰🇷", type: "DJ", host: "DJ Seoul", participants: 183, maxParticipants: 500, started: "20:00", status: "live", revenue: 8750 },
  { id: "r4", title: "직장 vs 창업 토크", type: "토크쇼", host: "스타트업러버", participants: 62, maxParticipants: 100, started: "21:00", status: "live", revenue: 2350 },
  { id: "r5", title: "스피드퀴즈 배틀!", type: "버라이어티", host: "게임마스터K", participants: 35, maxParticipants: 50, started: "22:00", status: "live", revenue: 980 },
  { id: "r6", title: "노래방 듀엣 배틀", type: "가라오케", host: "노래왕", participants: 0, maxParticipants: 30, started: "23:00", status: "scheduled", revenue: 0 },
  { id: "r7", title: "90s 레이브 복각", type: "DJ", host: "DJ Retro", participants: 0, maxParticipants: 100, started: "21:45", status: "ended", revenue: 3100 },
  { id: "r8", title: "MZ세대 소통법 분석", type: "토크쇼", host: "트렌드워처", participants: 0, maxParticipants: 60, started: "20:30", status: "ended", revenue: 1560 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "tx1", user: "한소희", type: "charge", amount: 50000, desc: "코인 50,000 충전", at: "23:41" },
  { id: "tx2", user: "이서연", type: "spend", amount: -3000, desc: "슈퍼챗 — DJ Cyan 방", at: "23:39" },
  { id: "tx3", user: "김민준", type: "earn", amount: 12400, desc: "방 수익 정산 (30%)", at: "23:37" },
  { id: "tx4", user: "정예린", type: "charge", amount: 20000, desc: "코인 20,000 충전", at: "23:35" },
  { id: "tx5", user: "박지우", type: "earn", amount: 6800, desc: "방 수익 정산 (30%)", at: "23:32" },
  { id: "tx6", user: "최현우", type: "spend", amount: -1500, desc: "선물 아이템 구매", at: "23:28" },
  { id: "tx7", user: "임나연", type: "charge", amount: 10000, desc: "코인 10,000 충전", at: "23:20" },
];

const MOCK_REPORTS: Report[] = [
  { id: "rp1", reporter: "이서연", target: "최현우", reason: "반복적인 욕설 및 괴롭힘", category: "abuse", at: "23:15", status: "pending" },
  { id: "rp2", reporter: "박지우", target: "오승민", reason: "스팸성 링크 반복 게시", category: "spam", at: "22:50", status: "pending" },
  { id: "rp3", reporter: "정예린", target: "오승민", reason: "부적절한 발언", category: "inappropriate", at: "22:33", status: "reviewed" },
  { id: "rp4", reporter: "임나연", target: "오승민", reason: "비하 표현 사용", category: "abuse", at: "21:48", status: "dismissed" },
];

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", label: "대시보드", icon: "solar:widget-5-bold" },
  { key: "users", label: "유저관리", icon: "solar:users-group-two-rounded-bold" },
  { key: "rooms", label: "룸관리", icon: "solar:home-smile-bold" },
  { key: "settlements", label: "정산관리", icon: "solar:wallet-money-bold" },
  { key: "reports", label: "신고관리", icon: "solar:shield-warning-bold" },
  { key: "settings", label: "시스템설정", icon: "solar:settings-bold" },
];

// ─── Small helpers ─────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon, color, trend }: { label: string; value: string; sub?: string; icon: string; color: string; trend?: "up" | "down" | "flat" }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-medium tracking-wide">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon icon={icon} className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        {sub && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" && <Icon icon="solar:arrow-up-bold" className="w-3 h-3 text-green-400" />}
            {trend === "down" && <Icon icon="solar:arrow-down-bold" className="w-3 h-3 text-red-400" />}
            <span className="text-[11px]" style={{ color: trend === "up" ? SUCCESS : trend === "down" ? DANGER : "rgba(255,255,255,0.3)" }}>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, border: `1px solid ${color}50`, color }}>
      {text}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    live: [SUCCESS, "LIVE"], ended: ["rgba(255,255,255,0.3)", "종료"], scheduled: [WARN, "예정"],
    active: [SUCCESS, "정상"], suspended: [WARN, "정지"], banned: [DANGER, "차단"],
    pending: [WARN, "대기"], reviewed: [ACCENT, "검토완료"], dismissed: ["rgba(255,255,255,0.3)", "기각"],
  };
  const [color, label] = map[status] ?? ["rgba(255,255,255,0.3)", status];
  return <Badge text={label} color={color} />;
}

// ─── Tab: Dashboard ────────────────────────────────────────────────────────────
function DashboardTab({ onForceEnd }: { onForceEnd: (id: string) => void }) {
  const liveRooms = MOCK_ROOMS.filter(r => r.status === "live");
  const totalLiveUsers = liveRooms.reduce((s, r) => s + r.participants, 0);
  const todayRevenue = MOCK_TRANSACTIONS.filter(t => t.type === "charge").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="총 유저" value="8,421" sub="+127 오늘" icon="solar:users-group-rounded-bold" color={ACCENT} trend="up" />
        <KPICard label="현재 접속" value={String(totalLiveUsers)} sub={`${liveRooms.length}개 방 활성`} icon="solar:pulse-2-bold" color={SUCCESS} trend="up" />
        <KPICard label="오늘 수익" value={`₩${(todayRevenue * 10).toLocaleString()}`} sub="+18% vs 어제" icon="solar:wallet-money-bold" color={WARN} trend="up" />
        <KPICard label="신고 대기" value={String(MOCK_REPORTS.filter(r => r.status === "pending").length)} sub="즉시 처리 필요" icon="solar:shield-warning-bold" color={DANGER} trend="flat" />
      </div>

      {/* Active rooms table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-bold text-white">활성 룸</p>
          <span className="text-xs text-white/30">{liveRooms.length}개 라이브</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["제목", "유형", "호스트", "인원", "수익"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
                <th className="px-5 py-3 text-white/30 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {liveRooms.map(room => (
                <tr key={room.id} className="border-t transition-colors hover:bg-white/[0.02]" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <td className="px-5 py-3 text-white/80 font-medium max-w-[160px] truncate">{room.title}</td>
                  <td className="px-5 py-3"><Badge text={room.type} color={ACCENT} /></td>
                  <td className="px-5 py-3 text-white/50">{room.host}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 max-w-[60px]">
                        <div className="h-full rounded-full" style={{ width: `${(room.participants / room.maxParticipants) * 100}%`, background: ACCENT }} />
                      </div>
                      <span className="text-white/50 whitespace-nowrap">{room.participants}/{room.maxParticipants}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono" style={{ color: WARN }}>₩{(room.revenue * 10).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => onForceEnd(room.id)}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 active:scale-95"
                      style={{ background: `${DANGER}15`, border: `1px solid ${DANGER}40`, color: DANGER }}>
                      강제종료
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-bold text-white">최근 거래내역</p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {MOCK_TRANSACTIONS.map(tx => {
            const typeColor = tx.type === "charge" ? SUCCESS : tx.type === "earn" ? ACCENT : tx.type === "settle" ? WARN : DANGER;
            const typeLabel = tx.type === "charge" ? "충전" : tx.type === "earn" ? "수익" : tx.type === "settle" ? "정산" : "지출";
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <Badge text={typeLabel} color={typeColor} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 truncate">{tx.user} — {tx.desc}</p>
                </div>
                <span className="text-xs font-bold tabular-nums whitespace-nowrap" style={{ color: tx.amount > 0 ? SUCCESS : "rgba(255,255,255,0.4)" }}>
                  {tx.amount > 0 ? "+" : ""}₩{(tx.amount * 10).toLocaleString()}
                </span>
                <span className="text-[11px] text-white/25 whitespace-nowrap">{tx.at}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-bold text-white/40 tracking-wider mb-3">빠른 액션</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "공지 발송", icon: "solar:megaphone-bold", color: ACCENT },
            { label: "전체 정지", icon: "solar:pause-circle-bold", color: WARN },
            { label: "DB 백업", icon: "solar:database-bold", color: ACCENT2 },
            { label: "캐시 초기화", icon: "solar:refresh-bold", color: "rgba(255,255,255,0.4)" },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 active:scale-95"
              style={{ background: `${a.color}10`, border: `1px solid ${a.color}30`, color: a.color }}>
              <Icon icon={a.icon} className="w-4 h-4" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: 유저관리 ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [filterRole, setFilterRole] = useState("전체");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState(MOCK_USERS);

  const filtered = users.filter(u => {
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    const matchStatus = filterStatus === "전체" || u.status === filterStatus;
    const matchRole = filterRole === "전체" || u.role === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  const handleAction = (userId: string, action: "suspend" | "ban" | "restore") => {
    setUsers(us => us.map(u => {
      if (u.id !== userId) return u;
      return { ...u, status: action === "restore" ? "active" : action === "suspend" ? "suspended" : "banned" };
    }));
    if (selectedUser?.id === userId) {
      setSelectedUser(u => u ? { ...u, status: action === "restore" ? "active" : action === "suspend" ? "suspended" : "banned" } : null);
    }
  };

  const memColor: Record<string, string> = { VVIP: "#FFD700", VIP: ACCENT, "일반": "rgba(255,255,255,0.4)" };
  const roleColor: Record<string, string> = { admin: DANGER, host: ACCENT2, user: "rgba(255,255,255,0.4)" };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 또는 이메일 검색"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", caretColor: ACCENT }} />
          </div>
          <div className="flex gap-1.5">
            {["전체", "active", "suspended", "banned"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={filterStatus === s ? { background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: ACCENT } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                {s === "전체" ? "전체" : s === "active" ? "정상" : s === "suspended" ? "정지" : "차단"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["전체", "user", "host", "admin"].map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={filterRole === r ? { background: `${ACCENT2}15`, border: `1px solid ${ACCENT2}40`, color: ACCENT2 } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                {r === "전체" ? "전체" : r === "user" ? "유저" : r === "host" ? "호스트" : "관리자"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden flex-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["이름", "이메일", "역할", "멤버십", "잔액", "방 수", "신고", "상태", "가입일"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/30 font-medium whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-4 py-3 text-white/30 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="border-t cursor-pointer transition-colors hover:bg-white/[0.03]"
                    style={{ borderColor: "rgba(255,255,255,0.04)", background: selectedUser?.id === u.id ? "rgba(0,229,255,0.04)" : undefined }}>
                    <td className="px-4 py-3 font-medium text-white/85">{u.name}</td>
                    <td className="px-4 py-3 text-white/40 max-w-[140px] truncate">{u.email}</td>
                    <td className="px-4 py-3"><Badge text={u.role === "admin" ? "관리자" : u.role === "host" ? "호스트" : "유저"} color={roleColor[u.role]} /></td>
                    <td className="px-4 py-3"><Badge text={u.membership} color={memColor[u.membership]} /></td>
                    <td className="px-4 py-3 font-mono text-white/60">₩{(u.balance * 10).toLocaleString()}</td>
                    <td className="px-4 py-3 text-white/50">{u.rooms}</td>
                    <td className="px-4 py-3" style={{ color: u.reports > 0 ? DANGER : "rgba(255,255,255,0.3)" }}>{u.reports}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-white/30">{u.joined}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {u.status === "active" && (
                          <button onClick={e => { e.stopPropagation(); handleAction(u.id, "suspend"); }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                            style={{ background: `${WARN}15`, border: `1px solid ${WARN}40`, color: WARN }}>정지</button>
                        )}
                        {u.status !== "banned" && (
                          <button onClick={e => { e.stopPropagation(); handleAction(u.id, "ban"); }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                            style={{ background: `${DANGER}15`, border: `1px solid ${DANGER}40`, color: DANGER }}>차단</button>
                        )}
                        {u.status !== "active" && (
                          <button onClick={e => { e.stopPropagation(); handleAction(u.id, "restore"); }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                            style={{ background: `${SUCCESS}15`, border: `1px solid ${SUCCESS}40`, color: SUCCESS }}>복구</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User detail panel */}
      {selectedUser && (
        <div className="w-72 flex-shrink-0 rounded-2xl p-5 flex flex-col gap-4 self-start sticky top-0"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-white">{selectedUser.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{selectedUser.email}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-white/30 hover:text-white/60">
              <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={selectedUser.status} />
            <Badge text={selectedUser.membership} color={memColor[selectedUser.membership]} />
            <Badge text={selectedUser.role === "host" ? "호스트" : selectedUser.role === "admin" ? "관리자" : "유저"} color={roleColor[selectedUser.role]} />
          </div>
          <div className="flex flex-col gap-2 text-xs">
            {[
              ["잔액", `₩${(selectedUser.balance * 10).toLocaleString()}`],
              ["개설 룸 수", `${selectedUser.rooms}개`],
              ["신고 횟수", `${selectedUser.reports}회`],
              ["가입일", selectedUser.joined],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-white/30">{k}</span>
                <span className="text-white/70 font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t flex flex-col gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] text-white/30 tracking-wider font-medium">계정 관리</p>
            {selectedUser.status === "active" && (
              <button onClick={() => handleAction(selectedUser.id, "suspend")}
                className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: `${WARN}15`, border: `1px solid ${WARN}40`, color: WARN }}>계정 정지</button>
            )}
            {selectedUser.status !== "banned" && (
              <button onClick={() => handleAction(selectedUser.id, "ban")}
                className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: `${DANGER}15`, border: `1px solid ${DANGER}40`, color: DANGER }}>강제 탈퇴</button>
            )}
            {selectedUser.status !== "active" && (
              <button onClick={() => handleAction(selectedUser.id, "restore")}
                className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: `${SUCCESS}15`, border: `1px solid ${SUCCESS}40`, color: SUCCESS }}>계정 복구</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: 룸관리 ──────────────────────────────────────────────────────────────
function RoomsTab({ terminatedRooms, onForceEnd }: { terminatedRooms: Set<string>; onForceEnd: (id: string) => void }) {
  const [filterType, setFilterType] = useState("전체");
  const [filterStatus, setFilterStatus] = useState("전체");

  const filtered = MOCK_ROOMS.filter(r => {
    const matchType = filterType === "전체" || r.type === filterType;
    const status = terminatedRooms.has(r.id) ? "ended" : r.status;
    const matchStatus = filterStatus === "전체" || status === filterStatus;
    return matchType && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {["전체", "DJ", "토크쇼", "버라이어티", "가라오케"].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={filterType === t ? { background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: ACCENT } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {["전체", "live", "scheduled", "ended"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={filterStatus === s ? { background: `${ACCENT2}15`, border: `1px solid ${ACCENT2}40`, color: ACCENT2 } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              {s === "전체" ? "전체" : s === "live" ? "라이브" : s === "scheduled" ? "예정" : "종료"}
            </button>
          ))}
        </div>
      </div>

      {/* Active rooms grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(room => {
          const isTerminated = terminatedRooms.has(room.id);
          const status = isTerminated ? "ended" : room.status;
          return (
            <div key={room.id} className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${status === "live" ? `${ACCENT}20` : "rgba(255,255,255,0.06)"}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={status} />
                    <Badge text={room.type} color={ACCENT} />
                  </div>
                  <p className="text-sm font-bold text-white/85 leading-snug">{room.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{room.host} · 시작 {room.started}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <div className="flex items-center gap-1">
                  <Icon icon="solar:users-group-two-rounded-bold" className="w-3.5 h-3.5" />
                  <span>{room.participants}/{room.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon="solar:wallet-money-bold" className="w-3.5 h-3.5" style={{ color: WARN }} />
                  <span style={{ color: WARN }}>₩{(room.revenue * 10).toLocaleString()}</span>
                </div>
              </div>
              {/* Participant bar */}
              <div className="h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${(room.participants / room.maxParticipants) * 100}%`, background: status === "live" ? ACCENT : "rgba(255,255,255,0.15)" }} />
              </div>
              {status === "live" && (
                <button onClick={() => onForceEnd(room.id)}
                  className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: `${DANGER}12`, border: `1px solid ${DANGER}35`, color: DANGER }}>
                  강제 종료
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Room history */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-bold text-white">오늘의 룸 히스토리</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["제목", "유형", "호스트", "시작", "참여자", "수익", "상태"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ROOMS.map(room => {
                const status = terminatedRooms.has(room.id) ? "ended" : room.status;
                return (
                  <tr key={room.id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-5 py-3 text-white/75 max-w-[150px] truncate">{room.title}</td>
                    <td className="px-5 py-3"><Badge text={room.type} color={ACCENT} /></td>
                    <td className="px-5 py-3 text-white/50">{room.host}</td>
                    <td className="px-5 py-3 text-white/40">{room.started}</td>
                    <td className="px-5 py-3 text-white/50">{room.participants}명</td>
                    <td className="px-5 py-3 font-mono" style={{ color: WARN }}>₩{(room.revenue * 10).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: 정산관리 ──────────────────────────────────────────────────────────────
function SettlementsTab() {
  const [settled, setSettled] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const hosts = MOCK_USERS.filter(u => u.role === "host");
  const totalPending = hosts.filter(h => !settled.has(h.id)).reduce((s, h) => s + Math.floor(h.balance * 0.3), 0);

  const doSettle = (id: string) => {
    setSettled(s => new Set([...s, id]));
    setConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="정산 대기" value={`₩${(totalPending * 10).toLocaleString()}`} sub={`${hosts.filter(h => !settled.has(h.id)).length}명`} icon="solar:clock-circle-bold" color={WARN} />
        <KPICard label="이번 달 완료" value={`₩${(2_450_000).toLocaleString()}`} sub="18건 처리" icon="solar:check-circle-bold" color={SUCCESS} />
        <KPICard label="플랫폼 수익 (50%)" value={`₩${(1_225_000).toLocaleString()}`} sub="이번 달" icon="solar:graph-up-bold" color={ACCENT} />
      </div>

      {/* Distribution note */}
      <div className="rounded-2xl p-4 flex gap-3 items-start" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20` }}>
        <Icon icon="solar:info-circle-bold" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
        <div className="text-xs text-white/50">
          <span className="font-bold text-white/70">수익 분배 구조: </span>
          플랫폼 50% · 감독/PD 20% · 호스트 30%.
          각 정산건은 월말 기준 익월 5일 이내 처리됩니다.
        </div>
      </div>

      {/* Pending settlements table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-bold text-white">호스트 정산 내역</p>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ background: `${SUCCESS}12`, border: `1px solid ${SUCCESS}30`, color: SUCCESS }}>
            <Icon icon="solar:download-bold" className="w-3.5 h-3.5" />전체 내보내기
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["호스트", "멤버십", "총 수익", "호스트 몫 (30%)", "정산 상태"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
                <th className="px-5 py-3 text-white/30 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map(host => {
                const gross = host.balance;
                const hostCut = Math.floor(gross * 0.3);
                const isSettled = settled.has(host.id);
                return (
                  <tr key={host.id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-5 py-3 font-medium text-white/85">{host.name}</td>
                    <td className="px-5 py-3">
                      <Badge text={host.membership} color={host.membership === "VVIP" ? "#FFD700" : host.membership === "VIP" ? ACCENT : "rgba(255,255,255,0.4)"} />
                    </td>
                    <td className="px-5 py-3 font-mono text-white/60">₩{(gross * 10).toLocaleString()}</td>
                    <td className="px-5 py-3 font-mono font-bold" style={{ color: WARN }}>₩{(hostCut * 10).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={isSettled ? "reviewed" : "pending"} />
                    </td>
                    <td className="px-5 py-3">
                      {!isSettled ? (
                        <button onClick={() => setConfirmId(host.id)}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 active:scale-95"
                          style={{ background: `${SUCCESS}15`, border: `1px solid ${SUCCESS}40`, color: SUCCESS }}>
                          정산처리
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/30">완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5" style={{ background: "rgba(4,10,18,0.98)", border: `1px solid ${SUCCESS}30` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${SUCCESS}15` }}>
                <Icon icon="solar:wallet-money-bold" className="w-5 h-5" style={{ color: SUCCESS }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">정산 처리 확인</p>
                <p className="text-xs text-white/40 mt-0.5">{hosts.find(h => h.id === confirmId)?.name}</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              위 호스트에 대한 이번 달 정산을 처리합니다.
              정산 후 취소가 불가합니다. 계속하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                취소
              </button>
              <button onClick={() => doSettle(confirmId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ background: `${SUCCESS}15`, border: `1px solid ${SUCCESS}50`, color: SUCCESS }}>
                정산 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: 신고관리 ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [filterStatus, setFilterStatus] = useState("전체");

  const filtered = filterStatus === "전체" ? reports : reports.filter(r => r.status === filterStatus);

  const updateStatus = (id: string, status: "reviewed" | "dismissed") => {
    setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };

  const catColor: Record<string, string> = { spam: WARN, abuse: DANGER, inappropriate: "#F97316", other: "rgba(255,255,255,0.4)" };
  const catLabel: Record<string, string> = { spam: "스팸", abuse: "괴롭힘", inappropriate: "부적절", other: "기타" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5">
        {["전체", "pending", "reviewed", "dismissed"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={filterStatus === s ? { background: `${DANGER}15`, border: `1px solid ${DANGER}40`, color: DANGER } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            {s === "전체" ? "전체" : s === "pending" ? "대기" : s === "reviewed" ? "검토완료" : "기각"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(r => (
          <div key={r.id} className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${r.status === "pending" ? `${DANGER}20` : "rgba(255,255,255,0.06)"}` }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge text={catLabel[r.category]} color={catColor[r.category]} />
                  <StatusBadge status={r.status} />
                  <span className="text-[11px] text-white/25">{r.at}</span>
                </div>
                <p className="text-sm font-medium text-white/80">{r.reason}</p>
                <p className="text-xs text-white/40">
                  <span className="text-white/60">{r.reporter}</span> → <span style={{ color: DANGER }}>{r.target}</span>
                </p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(r.id, "reviewed")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}35`, color: ACCENT }}>
                    검토 완료
                  </button>
                  <button onClick={() => updateStatus(r.id, "dismissed")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                    기각
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm">신고 내역이 없습니다</div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: 시스템설정 ─────────────────────────────────────────────────────────────
function SystemSettingsTab() {
  const [maintenance, setMaintenance] = useState(false);
  const [newUserReg, setNewUserReg] = useState(true);
  const [roomCreation, setRoomCreation] = useState(true);
  const [maxRoomSize, setMaxRoomSize] = useState(500);
  const [maxRooms, setMaxRooms] = useState(50);
  const [commissionRate, setCommissionRate] = useState(50);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{ background: value ? ACCENT : "rgba(255,255,255,0.1)" }}>
      <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: value ? "calc(100% - 20px)" : "4px" }} />
    </button>
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Toggles */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-bold text-white">서비스 설정</p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {[
            { label: "유지보수 모드", desc: "활성화 시 일반 유저의 접속을 차단합니다", value: maintenance, onChange: setMaintenance, color: DANGER },
            { label: "신규 회원가입", desc: "신규 유저의 회원가입을 허용합니다", value: newUserReg, onChange: setNewUserReg, color: ACCENT },
            { label: "룸 생성 허용", desc: "호스트의 새 룸 개설을 허용합니다", value: roomCreation, onChange: setRoomCreation, color: ACCENT },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p className="text-sm font-medium text-white/80">{row.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{row.desc}</p>
              </div>
              <Toggle value={row.value} onChange={row.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* Numeric settings */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-bold text-white">룸 제한 설정</p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-5">
          {[
            { label: "최대 룸 인원", value: maxRoomSize, onChange: setMaxRoomSize, min: 10, max: 1000, step: 10, unit: "명" },
            { label: "동시 최대 룸 수", value: maxRooms, onChange: setMaxRooms, min: 5, max: 200, step: 5, unit: "개" },
            { label: "플랫폼 수수료율", value: commissionRate, onChange: setCommissionRate, min: 10, max: 70, step: 5, unit: "%" },
          ].map(s => (
            <div key={s.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">{s.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: ACCENT }}>{s.value}{s.unit}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                onChange={e => s.onChange(Number(e.target.value))}
                className="w-full" style={{ accentColor: ACCENT }} />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button className="self-start flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80 active:scale-95"
        style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
        <Icon icon="solar:floppy-disk-bold" className="w-4 h-4" />
        설정 저장
      </button>

      {/* Danger zone */}
      <div className="rounded-2xl overflow-hidden" style={{ background: `${DANGER}06`, border: `1px solid ${DANGER}25` }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: `${DANGER}20` }}>
          <p className="text-sm font-bold" style={{ color: DANGER }}>위험 영역</p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          {[
            { label: "전체 룸 강제 종료", icon: "solar:stop-bold" },
            { label: "캐시 및 세션 초기화", icon: "solar:refresh-bold" },
            { label: "서버 재시작 (무중단)", icon: "solar:restart-bold" },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 self-start"
              style={{ background: `${DANGER}12`, border: `1px solid ${DANGER}30`, color: DANGER }}>
              <Icon icon={a.icon} className="w-4 h-4" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [terminatedRooms, setTerminatedRooms] = useState<Set<string>>(new Set());

  // Client-side admin guard: checks localStorage for admin role
  useEffect(() => {
    try {
      const role = localStorage.getItem("loxygene-role");
      // In dev/mock mode, allow if no role is set OR role is "admin"
      if (role !== null && role !== "admin") {
        router.replace("/");
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode) — allow through
    }
  }, [router]);

  const handleForceEnd = (id: string) => {
    setTerminatedRooms(s => new Set([...s, id]));
  };

  const pendingReports = MOCK_REPORTS.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#060608] flex" style={{ fontFamily: "inherit" }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 flex flex-col border-r transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "rgba(6,6,8,0.98)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        {/* Logo */}
        <div className="px-5 h-14 flex items-center gap-2.5 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}40` }}>
            <Icon icon="solar:shield-keyhole-bold" className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <p className="text-xs font-black tracking-widest" style={{ color: ACCENT }}>ADMIN</p>
            <p className="text-[9px] text-white/30">L&apos;Oxygène</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={activeTab === item.key
                ? { background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }
                : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
              <Icon icon={item.icon} className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.key === "reports" && pendingReports > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${DANGER}20`, color: DANGER }}>
                  {pendingReports}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Back to site */}
        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link href="/" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "rgba(255,255,255,0.35)" }}>
            <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
            사이트로 돌아가기
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b flex-shrink-0"
          style={{ background: "rgba(6,6,8,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white/70" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Icon icon="solar:hamburger-menu-linear" className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white">{NAV.find(n => n.key === activeTab)?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: `${SUCCESS}12`, border: `1px solid ${SUCCESS}30` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: SUCCESS, animation: "pulse-neon 2s infinite" }} />
              <span className="text-xs font-medium" style={{ color: SUCCESS }}>시스템 정상</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
              👑
            </div>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" key={activeTab} style={{ animation: "fadeIn 0.2s ease-out" }}>
          {activeTab === "dashboard" && <DashboardTab onForceEnd={handleForceEnd} />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "rooms" && <RoomsTab terminatedRooms={terminatedRooms} onForceEnd={handleForceEnd} />}
          {activeTab === "settlements" && <SettlementsTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "settings" && <SystemSettingsTab />}
        </main>
      </div>

      <style>{`
        @keyframes pulse-neon { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
