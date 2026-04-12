"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

// ─── Data ──────────────────────────────────────────────────────────────────

type RoleId = "vocal" | "recreation" | "social" | "mc" | "corporate";
type StatusType = "available" | "soon" | "booking_only";

interface Entertainer {
  id: string;
  name: string;
  roleId: RoleId;
  roleLabel: string;
  roleEmoji: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  dispatchCount: string;
  tips?: string;
  status: StatusType;
  statusLabel: string;
  price: string;
  badge?: string;
  badgeVariant?: "gold" | "blue";
}

const ROLE_COLORS: Record<RoleId, string> = {
  vocal:       "#00E5FF",
  recreation:  "#FF007F",
  social:      "#C9A84C",
  mc:          "#A855F7",
  corporate:   "#3B82F6",
};

const STATUS_COLORS: Record<StatusType, string> = {
  available:    "#22C55E",
  soon:         "#F59E0B",
  booking_only: "#3B82F6",
};

const ENTERTAINERS: Entertainer[] = [
  {
    id: "e1",
    name: "DJ 소울메이트",
    roleId: "vocal",
    roleLabel: "보컬 디렉터",
    roleEmoji: "🎤",
    tags: ["#발라드", "#팝", "#90년대"],
    rating: 4.9,
    reviewCount: 234,
    dispatchCount: "1,204회",
    tips: "₩12.4M",
    status: "available",
    statusLabel: "즉시 호출 가능",
    price: "15,000 O₂ / 30분",
  },
  {
    id: "e2",
    name: "MC 황금손",
    roleId: "recreation",
    roleLabel: "레크리에이션 마스터",
    roleEmoji: "🎮",
    tags: ["#게임진행", "#웃음보장", "#회식"],
    rating: 4.8,
    reviewCount: 189,
    dispatchCount: "987회",
    status: "available",
    statusLabel: "즉시 호출 가능",
    price: "12,000 O₂ / 30분",
  },
  {
    id: "e3",
    name: "소피아 와인클럽",
    roleId: "social",
    roleLabel: "소셜 호스트",
    roleEmoji: "🍷",
    tags: ["#와인토크", "#고품격", "#VVIP"],
    rating: 5.0,
    reviewCount: 67,
    dispatchCount: "341회",
    tips: "₩8.2M",
    status: "soon",
    statusLabel: "30분 후 가능",
    price: "35,000 O₂ / 30분",
    badge: "🖤 BLACK 인증",
    badgeVariant: "gold",
  },
  {
    id: "e4",
    name: "파티킹 준호",
    roleId: "mc",
    roleLabel: "파티 MC",
    roleEmoji: "🎉",
    tags: ["#생일", "#돌잔치", "#에너지폭발"],
    rating: 4.7,
    reviewCount: 312,
    dispatchCount: "2,108회",
    status: "available",
    statusLabel: "즉시 호출 가능",
    price: "10,000 O₂ / 30분",
  },
  {
    id: "e5",
    name: "코퍼레이트 김이사",
    roleId: "corporate",
    roleLabel: "기업 전용",
    roleEmoji: "💼",
    tags: ["#팀빌딩", "#연수", "#워크숍"],
    rating: 4.9,
    reviewCount: 45,
    dispatchCount: "203회",
    status: "booking_only",
    statusLabel: "예약제 전용",
    price: "별도 문의",
    badge: "B2B 인증",
    badgeVariant: "blue",
  },
  {
    id: "e6",
    name: "버블리 유나",
    roleId: "vocal",
    roleLabel: "보컬 디렉터",
    roleEmoji: "🎤",
    tags: ["#트로트", "#신나는", "#할머니도OK"],
    rating: 4.8,
    reviewCount: 156,
    dispatchCount: "678회",
    status: "available",
    statusLabel: "즉시 호출 가능",
    price: "8,000 O₂ / 30분",
  },
  {
    id: "e7",
    name: "재즈맨 최",
    roleId: "social",
    roleLabel: "소셜 호스트",
    roleEmoji: "🍷",
    tags: ["#재즈", "#어쿠스틱", "#분위기메이커"],
    rating: 4.6,
    reviewCount: 89,
    dispatchCount: "421회",
    status: "soon",
    statusLabel: "1시간 후 가능",
    price: "20,000 O₂ / 30분",
  },
  {
    id: "e8",
    name: "게임마스터 철수",
    roleId: "recreation",
    roleLabel: "레크리에이션 마스터",
    roleEmoji: "🎮",
    tags: ["#보드게임", "#퀴즈MC", "#단합대회"],
    rating: 4.7,
    reviewCount: 201,
    dispatchCount: "934회",
    status: "available",
    statusLabel: "즉시 호출 가능",
    price: "9,000 O₂ / 30분",
  },
];

const FILTER_TABS = [
  { id: "all",       label: "전체" },
  { id: "vocal",     label: "🎤 보컬 디렉터" },
  { id: "recreation",label: "🎮 레크리에이션 마스터" },
  { id: "social",    label: "🍷 소셜 호스트" },
  { id: "mc",        label: "🎉 파티 MC" },
  { id: "corporate", label: "💼 기업 전용" },
];

const SORT_OPTIONS = [
  { id: "rating",    label: "평점순" },
  { id: "available", label: "즉시가능" },
  { id: "price",     label: "가격순" },
  { id: "popular",   label: "인기순" },
];

// ─── Entertainer Card ──────────────────────────────────────────────────────

function EntertainerCard({ e }: { e: Entertainer }) {
  const [hovered, setHovered] = useState(false);
  const roleColor = ROLE_COLORS[e.roleId];
  const statusColor = STATUS_COLORS[e.status];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(255,0,127,0.35)" : "rgba(255,255,255,0.05)"}`,
        transform: hovered ? "scale(1.01)" : "scale(1)",
        boxShadow: hovered ? "0 0 24px rgba(255,0,127,0.07)" : "none",
      }}
    >
      {/* Preview clip area */}
      <div
        className="relative flex items-center justify-center"
        style={{
          height: 110,
          background: `linear-gradient(135deg, rgba(${roleColor === "#00E5FF" ? "0,229,255" : roleColor === "#FF007F" ? "255,0,127" : roleColor === "#C9A84C" ? "201,168,76" : roleColor === "#A855F7" ? "168,85,247" : "59,130,246"},0.07) 0%, rgba(0,0,0,0.4) 100%)`,
        }}
      >
        {/* Play button */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            transform: hovered ? "scale(1.1)" : "scale(1)",
          }}
        >
          <Icon icon="solar:play-bold" className="w-4 h-4 ml-0.5" style={{ color: "rgba(255,255,255,0.5)" }} />
        </div>
        <span className="absolute bottom-2 left-2 text-[9px] font-medium tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.3)" }}>
          미리보기
        </span>
        {/* Badge */}
        {e.badge && (
          <span
            className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={
              e.badgeVariant === "gold"
                ? { background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.35)" }
                : { background: "rgba(59,130,246,0.15)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.35)" }
            }
          >
            {e.badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* Name + role */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: `rgba(${roleColor === "#00E5FF" ? "0,229,255" : roleColor === "#FF007F" ? "255,0,127" : roleColor === "#C9A84C" ? "201,168,76" : roleColor === "#A855F7" ? "168,85,247" : "59,130,246"},0.1)`, color: roleColor, border: `1px solid ${roleColor}40` }}
            >
              {e.roleEmoji} {e.roleLabel}
            </span>
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{e.name}</h3>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {e.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Rating + stats */}
        <div className="flex items-center gap-3 text-[11px]">
          <span style={{ color: "rgba(255,200,0,0.9)" }}>★ {e.rating}</span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>리뷰 {e.reviewCount}개</span>
        </div>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          파견 {e.dispatchCount}{e.tips ? ` · 팁 수령 ${e.tips}` : ""}
        </p>

        {/* Status + price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
            <span className="text-[10px]" style={{ color: statusColor }}>{e.statusLabel}</span>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: "#FF007F" }}>{e.price}</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <Link
            href={`/entertainers/${e.id}`}
            className="flex-1 py-2 rounded-xl text-[11px] font-medium text-center transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            프로필 보기
          </Link>
          <Link
            href={`/entertainers/${e.id}`}
            className="flex-1 py-2 rounded-xl text-[11px] font-medium text-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: e.status === "available" ? "rgba(255,0,127,0.12)" : "rgba(0,229,255,0.08)",
              border: e.status === "available" ? "1px solid rgba(255,0,127,0.4)" : "1px solid rgba(0,229,255,0.25)",
              color: e.status === "available" ? "#FF007F" : "#00E5FF",
            }}
          >
            {e.status === "available" ? "즉시 호출" : e.status === "soon" ? "예약하기" : "문의하기"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function EntertainersPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSort, setActiveSort] = useState("rating");

  const filtered = ENTERTAINERS.filter(
    (e) => activeFilter === "all" || e.roleId === activeFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === "rating")    return b.rating - a.rating;
    if (activeSort === "available") return a.status === "available" ? -1 : 1;
    if (activeSort === "popular")   return b.reviewCount - a.reviewCount;
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070707" }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[130px]" style={{ background: "rgba(255,0,127,0.07)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[130px]" style={{ background: "rgba(0,229,255,0.07)" }} />
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-4 py-4 flex-shrink-0"
        style={{ background: "rgba(7,7,7,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(24px)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              ← L&apos;OXYGÈNE
            </Link>
            <div>
              <h1
                className="text-base sm:text-xl font-light tracking-[0.25em] uppercase"
                style={{ color: "#FF007F", textShadow: "0 0 30px rgba(255,0,127,0.5)" }}
              >
                VIBE DIRECTORS
              </h1>
              <p className="text-[10px] hidden sm:block mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                당신의 모임을 특별하게 만들어줄 전문가를 만나세요
              </p>
            </div>
          </div>

          {/* Live status bar */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>대기중 <span className="text-green-400 font-medium">24명</span></span>
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>오늘 파견 <span style={{ color: "rgba(255,255,255,0.5)" }}>847건</span></span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>평균 평점 <span style={{ color: "rgba(255,200,0,0.8)" }}>4.9★</span></span>
          </div>
        </div>

        {/* Mobile live status */}
        <div className="sm:hidden flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>대기 <span className="text-green-400">24명</span></span>
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>파견 <span style={{ color: "rgba(255,255,255,0.4)" }}>847건</span></span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>평점 <span style={{ color: "rgba(255,200,0,0.7)" }}>4.9★</span></span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                style={
                  activeFilter === tab.id
                    ? { background: "rgba(255,0,127,0.12)", border: "1px solid rgba(255,0,127,0.4)", color: "#FF007F" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>정렬:</span>
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveSort(opt.id)}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] transition-all"
                  style={
                    activeSort === opt.id
                      ? { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }
                      : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{sorted.length}명</span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((e) => (
              <EntertainerCard key={e.id} e={e} />
            ))}
          </div>

          {/* B2B Banner */}
          <div
            className="relative rounded-2xl overflow-hidden p-5 sm:p-6 mt-2"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(0,0,0,0.6) 70%)",
              border: "1px solid rgba(201,168,76,0.25)",
              boxShadow: "0 0 40px rgba(201,168,76,0.05)",
            }}
          >
            <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none" style={{ borderTop: "1px solid rgba(201,168,76,0.35)", borderLeft: "1px solid rgba(201,168,76,0.35)", borderTopLeftRadius: "16px" }} />
            <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none" style={{ borderBottom: "1px solid rgba(201,168,76,0.35)", borderRight: "1px solid rgba(201,168,76,0.35)", borderBottomRightRadius: "16px" }} />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-base sm:text-lg font-light mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                  💼 기업 팀빌딩 올인원 패키지
                </p>
                <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  라운지 대관 + 바이브 디렉터 + F&amp;B 배달 결합 상품
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  HR 담당자 전용 · 세금계산서 발행 가능
                </p>
                <p className="text-sm font-semibold mt-2" style={{ color: "#C9A84C" }}>
                  월 50인 기준 ₩ 2,400,000~
                </p>
              </div>
              <button
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C" }}
              >
                기업 문의하기
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
