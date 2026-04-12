"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────

type Currency = "KRW" | "O2";

interface Product {
  id: string;
  name: string;
  desc: string;
  price: string;
  currency: Currency;
  badge?: string;
  badgeVariant?: "cyan" | "pink" | "gold" | "green";
  tag?: string;
  category: string;
  externalUrl?: string;
  exclusive?: boolean;
}

// ─── Data ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",       label: "전체",           icon: "🛍️" },
  { id: "broadcast", label: "방송장비",        icon: "🎙️" },
  { id: "lighting",  label: "스마트조명",      icon: "💡" },
  { id: "liquor",    label: "프리미엄 주류",   icon: "🍾" },
  { id: "food",      label: "파티푸드",        icon: "🍱" },
  { id: "black",     label: "Black 전용",      icon: "🖤" },
  { id: "avatar",    label: "아바타·마스크",   icon: "🎭" },
  { id: "furniture", label: "홈라운지 가구",   icon: "🪑" },
];

const PRODUCTS: Product[] = [
  // 방송장비
  {
    id: "p1",
    name: "4K Pro 웹캠",
    desc: "화상 앵글 최적화, 뷰티 필터 내장",
    price: "₩ 89,000",
    currency: "KRW",
    badge: "BEST",
    badgeVariant: "cyan",
    tag: "#방구석가왕 추천",
    category: "broadcast",
    externalUrl: "https://link.loxygene.com/4k-cam",
  },
  {
    id: "p2",
    name: "Echo Mic V2",
    desc: "하드웨어 리버브, 노이즈 캔슬링",
    price: "₩ 65,000",
    currency: "KRW",
    badge: "인기",
    badgeVariant: "pink",
    category: "broadcast",
    externalUrl: "https://link.loxygene.com/echo-mic",
  },
  // 스마트조명
  {
    id: "p3",
    name: "L'Sync 스마트 조명 세트",
    desc: "룸 이펙트와 블루투스 동기화",
    price: "₩ 129,000",
    currency: "KRW",
    badge: "NEW",
    badgeVariant: "pink",
    tag: "#파티필수",
    category: "lighting",
    externalUrl: "https://link.loxygene.com/lsync-light",
  },
  {
    id: "p4",
    name: "미러볼 LED 세트",
    desc: "클럽 분위기 연출 홈파티용",
    price: "₩ 45,000",
    currency: "KRW",
    category: "lighting",
    externalUrl: "https://link.loxygene.com/mirrorball",
  },
  // 프리미엄 주류
  {
    id: "p5",
    name: "Dom Pérignon 하프보틀",
    desc: "VVIP 룸 기본 세팅 주류",
    price: "₩ 280,000",
    currency: "KRW",
    badge: "🖤 BLACK",
    badgeVariant: "gold",
    tag: "#VVIP추천",
    category: "liquor",
    externalUrl: "https://link.loxygene.com/dom-perignon",
  },
  {
    id: "p6",
    name: "시그니처 칵테일 키트",
    desc: "4인 파티용 프리미엄 믹스세트",
    price: "₩ 78,000",
    currency: "KRW",
    badge: "파티",
    badgeVariant: "pink",
    category: "liquor",
    externalUrl: "https://link.loxygene.com/cocktail-kit",
  },
  // 파티푸드
  {
    id: "p7",
    name: "프리미엄 파티 플래터",
    desc: "4~6인용 핑거푸드 케이터링",
    price: "₩ 95,000",
    currency: "KRW",
    tag: "#온동네라운지",
    category: "food",
    externalUrl: "https://link.loxygene.com/party-platter",
  },
  {
    id: "p8",
    name: "생일케이크 커스텀 주문",
    desc: "당일 배송, 포토케이크 가능",
    price: "₩ 55,000~",
    currency: "KRW",
    badge: "당일배송",
    badgeVariant: "green",
    category: "food",
    externalUrl: "https://link.loxygene.com/custom-cake",
  },
  // Black 전용
  {
    id: "p9",
    name: "VVIP 웰컴 패키지",
    desc: "샴페인 + 조명 + 마이크 올인원",
    price: "₩ 450,000",
    currency: "KRW",
    badge: "🖤 EXCLUSIVE",
    badgeVariant: "gold",
    category: "black",
    exclusive: true,
    externalUrl: "https://link.loxygene.com/vvip-package",
  },
  {
    id: "p10",
    name: "프라이빗 배경 파티션",
    desc: "고급 살롱 깊이감 연출 백월",
    price: "₩ 320,000",
    currency: "KRW",
    badge: "🖤 BLACK",
    badgeVariant: "gold",
    category: "black",
    externalUrl: "https://link.loxygene.com/partition",
  },
  // 아바타·마스크
  {
    id: "p11",
    name: "토끼 3D 마스크",
    desc: "실시간 표정 추적, 싱어톡 전용",
    price: "2,000 O₂",
    currency: "O2",
    badge: "디지털",
    badgeVariant: "cyan",
    category: "avatar",
  },
  {
    id: "p12",
    name: "여우 하이패션 마스크",
    desc: "VVIP 전용 한정판",
    price: "5,000 O₂",
    currency: "O2",
    badge: "LIMITED",
    badgeVariant: "pink",
    category: "avatar",
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  broadcast:  "solar:video-camera-bold",
  lighting:   "solar:sun-bold",
  liquor:     "solar:wineglass-bold",
  food:       "solar:bowl-spoon-bold",
  black:      "solar:diamond-bold",
  avatar:     "solar:masks-bold",
  furniture:  "solar:sofa-bold",
};

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  cyan:  { bg: "rgba(0,229,255,0.12)",   color: "#00E5FF",   border: "rgba(0,229,255,0.3)" },
  pink:  { bg: "rgba(255,0,127,0.12)",   color: "#FF007F",   border: "rgba(255,0,127,0.3)" },
  gold:  { bg: "rgba(201,168,76,0.15)",  color: "#C9A84C",   border: "rgba(201,168,76,0.4)" },
  green: { bg: "rgba(0,230,130,0.12)",   color: "#00E682",   border: "rgba(0,230,130,0.3)" },
};

// ─── O₂ Purchase Modal ─────────────────────────────────────────────────────

function O2Modal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [done, setDone] = useState(false);
  const O2_BALANCE = 24500;
  const priceNum = parseInt(product.price.replace(/[^0-9]/g, ""), 10);
  const canAfford = O2_BALANCE >= priceNum;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden"
        style={{ background: "rgba(12,12,16,0.98)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 60px rgba(0,229,255,0.12)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>아이템 구매</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Icon icon="solar:close-bold" className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)" }}>
                <Icon icon="solar:check-circle-bold" className="w-6 h-6" style={{ color: "#00E5FF" }} />
              </div>
              <p className="text-sm font-medium text-white/90">구매 완료!</p>
              <p className="text-xs text-white/40">{product.name}이 인벤토리에 추가됐어요</p>
              <button onClick={onClose} className="mt-1 w-full py-3 rounded-xl text-sm transition-all active:scale-95" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                확인
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(0,229,255,0.07)" }}>
                  🎭
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{product.name}</p>
                  <p className="text-xs text-white/40">{product.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,0,127,0.05)", border: "1px solid rgba(255,0,127,0.15)" }}>
                <span className="text-xs text-white/50">보유 O₂</span>
                <span className="text-sm font-semibold" style={{ color: "#FF007F" }}>{O2_BALANCE.toLocaleString()} O₂</span>
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs text-white/50">결제 금액</span>
                <span className="text-sm font-bold" style={{ color: "#FF007F" }}>{product.price}</span>
              </div>

              {!canAfford && (
                <p className="text-xs text-center" style={{ color: "rgba(255,80,80,0.8)" }}>O₂ 잔액이 부족합니다</p>
              )}

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm transition-all active:scale-95" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                  취소
                </button>
                <button
                  onClick={() => setDone(true)}
                  disabled={!canAfford}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.35)", color: "#00E5FF" }}
                >
                  구매 확인
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────

function ProductCard({ product, onO2Purchase }: { product: Product; onO2Purchase: (p: Product) => void }) {
  const [hovered, setHovered] = useState(false);
  const badge = product.badge && product.badgeVariant ? BADGE_STYLES[product.badgeVariant] : null;
  const catIcon = CATEGORY_ICONS[product.category] ?? "solar:shop-bold";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: product.exclusive ? "rgba(201,168,76,0.03)" : "rgba(255,255,255,0.02)",
        border: product.exclusive
          ? `1px solid ${hovered ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.25)"}`
          : `1px solid ${hovered ? "rgba(0,229,255,0.25)" : "rgba(255,255,255,0.05)"}`,
        transform: hovered ? "scale(1.02)" : "scale(1)",
        boxShadow: product.exclusive && hovered ? "0 0 30px rgba(201,168,76,0.1)" : hovered ? "0 0 20px rgba(0,229,255,0.06)" : "none",
      }}
    >
      {/* Image placeholder */}
      <div
        className="relative flex items-center justify-center"
        style={{
          height: 120,
          background: product.exclusive
            ? "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(120,80,10,0.05) 100%)"
            : "linear-gradient(135deg, rgba(0,229,255,0.05) 0%, rgba(255,0,127,0.03) 100%)",
        }}
      >
        <Icon icon={catIcon} className="w-12 h-12" style={{ color: product.exclusive ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)" }} />
        {badge && (
          <span
            className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3.5 flex-1">
        <div className="flex-1">
          <p className="text-sm font-medium leading-snug mb-1" style={{ color: "rgba(255,255,255,0.88)" }}>
            {product.name}
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            {product.desc}
          </p>
          {product.tag && (
            <span
              className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {product.tag}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span
            className="text-sm font-semibold"
            style={{ color: product.currency === "O2" ? "#FF007F" : "#00E5FF" }}
          >
            {product.price}
          </span>
          {product.currency === "O2" ? (
            <button
              onClick={() => onO2Purchase(product)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all active:scale-95 hover:opacity-80"
              style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.3)", color: "#FF007F" }}
            >
              <Icon icon="solar:wallet-linear" className="w-3 h-3" />
              구매
            </button>
          ) : (
            <a
              href={product.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all active:scale-95 hover:opacity-80"
              style={{
                background: product.exclusive ? "rgba(201,168,76,0.1)" : "rgba(0,229,255,0.08)",
                border: product.exclusive ? "1px solid rgba(201,168,76,0.35)" : "1px solid rgba(0,229,255,0.25)",
                color: product.exclusive ? "#C9A84C" : "#00E5FF",
              }}
            >
              구매하기
              <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
            </a>
          )}
        </div>

        {product.currency === "O2" && (
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>O₂ 크레딧으로 구매</p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [o2ModalProduct, setO2ModalProduct] = useState<Product | null>(null);
  const blackSectionRef = useRef<HTMLDivElement>(null);

  const filtered = activeCategory === "all"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory);

  const scrollToBlack = () => {
    setActiveCategory("black");
    setTimeout(() => blackSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#070707" }}
    >
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ background: "rgba(0,229,255,0.07)" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ background: "rgba(255,0,127,0.07)" }} />
      </div>

      {/* O₂ Modal */}
      {o2ModalProduct && <O2Modal product={o2ModalProduct} onClose={() => setO2ModalProduct(null)} />}

      {/* ── Page header ───────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex-shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(7,7,7,0.88)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(24px)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          ← L&apos;OXYGÈNE
        </Link>

        <div className="flex flex-col min-w-0">
          <h1
            className="text-base sm:text-lg font-light tracking-[0.2em] uppercase leading-none"
            style={{ color: "#00E5FF", textShadow: "0 0 30px rgba(0,229,255,0.35)" }}
          >
            L&apos;OXYGÈNE SHOP
          </h1>
          <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.25)" }}>
            더 완벽한 밤을 위한 모든 것
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{ background: "rgba(255,0,127,0.06)", border: "1px solid rgba(255,0,127,0.15)" }}
          >
            <Icon icon="solar:wallet-linear" className="w-3 h-3" style={{ color: "#FF007F" }} />
            <span style={{ color: "rgba(255,255,255,0.7)" }}>24,500 <span style={{ color: "rgba(255,255,255,0.3)" }}>O₂</span></span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

            {/* ── Featured banner ───────────────────────────────────── */}
            <div
              className="relative rounded-2xl overflow-hidden p-5 sm:p-7"
              style={{
                background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(0,0,0,0.6) 60%)",
                border: "1px solid rgba(201,168,76,0.3)",
                boxShadow: "0 0 40px rgba(201,168,76,0.06)",
              }}
            >
              {/* Corner decorative lines */}
              <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none" style={{ borderTop: "1px solid rgba(201,168,76,0.4)", borderLeft: "1px solid rgba(201,168,76,0.4)", borderTopLeftRadius: "16px" }} />
              <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none" style={{ borderBottom: "1px solid rgba(201,168,76,0.4)", borderRight: "1px solid rgba(201,168,76,0.4)", borderBottomRightRadius: "16px" }} />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.35)" }}>
                      🖤 EXCLUSIVE
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-light mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>
                    Black 멤버십 전용 패키지
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                    VVIP 룸 입장 전, 완벽한 세팅을 준비하세요
                  </p>
                </div>
                <button
                  onClick={scrollToBlack}
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "rgba(201,168,76,0.12)",
                    border: "1px solid rgba(201,168,76,0.4)",
                    color: "#C9A84C",
                  }}
                >
                  패키지 보기
                  <Icon icon="solar:arrow-down-linear" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Category filter tabs ───────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                  style={
                    activeCategory === cat.id
                      ? { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.35)", color: "#00E5FF" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* ── Product count ──────────────────────────────────────── */}
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {filtered.length}개 상품
            </p>

            {/* ── Product grid ───────────────────────────────────────── */}
            <div ref={blackSectionRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onO2Purchase={setO2ModalProduct}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Icon icon="solar:shop-bold" className="w-10 h-10" style={{ color: "rgba(255,255,255,0.08)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>준비 중인 카테고리입니다</p>
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
