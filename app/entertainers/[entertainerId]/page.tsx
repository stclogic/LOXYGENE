"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// ─── Data ──────────────────────────────────────────────────────────────────

const ENTERTAINER_DATA: Record<string, {
  name: string;
  roleLabel: string;
  roleEmoji: string;
  roleColor: string;
  rating: number;
  reviewCount: number;
  dispatchCount: string;
  status: "available" | "soon" | "booking_only";
  statusLabel: string;
  price30: number;
  price60: number;
  price90: number;
  tags: string[];
  bio: string;
  skills: { label: string; pct: number }[];
  reviews: { author: string; rating: number; text: string; date: string }[];
  availability: boolean[];
}> = {
  e1: {
    name: "DJ 소울메이트",
    roleLabel: "보컬 디렉터",
    roleEmoji: "🎤",
    roleColor: "#00E5FF",
    rating: 4.9,
    reviewCount: 234,
    dispatchCount: "1,204회",
    status: "available",
    statusLabel: "즉시 호출 가능",
    price30: 15000,
    price60: 25000,
    price90: 33000,
    tags: ["#발라드", "#팝", "#90년대", "#분위기메이커"],
    bio: "10년 경력의 보컬 디렉터입니다. 발라드부터 90년대 팝까지 다양한 장르를 소화하며, 모임의 분위기를 한순간에 끌어올리는 것이 특기입니다. 방구석가왕 무대 전문 진행 경험이 풍부합니다.",
    skills: [
      { label: "노래 실력",       pct: 90 },
      { label: "분위기 메이킹",   pct: 100 },
      { label: "곡 선택 감각",    pct: 85 },
      { label: "관객 소통",       pct: 95 },
    ],
    reviews: [
      { author: "민수님", rating: 5, text: "생일 파티에서 분위기를 완전히 살려줬어요! 다음에도 꼭 부를게요.", date: "2026.04.08" },
      { author: "지은님", rating: 5, text: "친구들이 너무 좋아했어요. 신청곡도 다 알고 바로 불러줘서 감동.", date: "2026.04.02" },
      { author: "현우님", rating: 4, text: "기대 이상이었습니다. 회식 분위기를 살려줬어요.", date: "2026.03.25" },
    ],
    availability: [true, true, false, true, true, false, true],
  },
  e2: {
    name: "MC 황금손",
    roleLabel: "레크리에이션 마스터",
    roleEmoji: "🎮",
    roleColor: "#FF007F",
    rating: 4.8,
    reviewCount: 189,
    dispatchCount: "987회",
    status: "available",
    statusLabel: "즉시 호출 가능",
    price30: 12000,
    price60: 20000,
    price90: 27000,
    tags: ["#게임진행", "#웃음보장", "#회식", "#단합대회"],
    bio: "레크리에이션 전문 MC로 팀 게임, 퀴즈 쇼, 즉흥 이벤트를 전문으로 합니다. 어떤 분위기도 5분 안에 웃음 가득한 자리로 바꾸는 것이 저의 자랑입니다.",
    skills: [
      { label: "게임 진행",       pct: 100 },
      { label: "웃음 유발",       pct: 95 },
      { label: "임기응변",        pct: 90 },
      { label: "팀 에너지 관리",  pct: 80 },
    ],
    reviews: [
      { author: "기업고객", rating: 5, text: "신입사원 환영회에서 정말 잘 해주셨어요. 모든 분들이 즐거워했습니다.", date: "2026.04.05" },
      { author: "모임장", rating: 5, text: "동창 모임 연속 3회 예약했어요. 항상 기대 이상이에요.", date: "2026.03.28" },
      { author: "호스트", rating: 4, text: "게임 진행이 매끄럽고 재밌었습니다.", date: "2026.03.15" },
    ],
    availability: [true, false, true, true, false, true, true],
  },
  e3: {
    name: "소피아 와인클럽",
    roleLabel: "소셜 호스트",
    roleEmoji: "🍷",
    roleColor: "#C9A84C",
    rating: 5.0,
    reviewCount: 67,
    dispatchCount: "341회",
    status: "soon",
    statusLabel: "30분 후 가능",
    price30: 35000,
    price60: 60000,
    price90: 82000,
    tags: ["#와인토크", "#고품격", "#VVIP", "#디너파티"],
    bio: "프랑스 소믈리에 자격증 보유. Black 룸 전용 소셜 호스트로 활동하며, 고품격 분위기 연출과 대화 주도, 와인 페어링 가이드를 제공합니다. VVIP 모임 전문.",
    skills: [
      { label: "소셜 스킬",       pct: 100 },
      { label: "와인 지식",       pct: 95 },
      { label: "분위기 연출",     pct: 100 },
      { label: "다국어 진행",     pct: 70 },
    ],
    reviews: [
      { author: "CEO님", rating: 5, text: "비즈니스 디너에서 완벽한 진행을 해주셨습니다. 감사합니다.", date: "2026.04.10" },
      { author: "VIP고객", rating: 5, text: "우아하고 세련된 진행으로 모든 게스트가 만족했어요.", date: "2026.04.01" },
      { author: "회원님", rating: 5, text: "Black 룸에서 꼭 다시 부를 예정입니다.", date: "2026.03.20" },
    ],
    availability: [false, true, true, false, true, true, false],
  },
};

const DEFAULT_DATA = ENTERTAINER_DATA.e1;

const DURATIONS = [
  { label: "30분", key: "30" as const },
  { label: "60분", key: "60" as const },
  { label: "90분", key: "90" as const },
];

const USER_ROOMS = ["방구석가왕 #1", "싱어톡 세션", "프라이빗 라운지"];

const DAYS = ["오늘", "내일", "수", "목", "금", "토", "일"];

// ─── Booking Modal ─────────────────────────────────────────────────────────

function BookingModal({
  data,
  onClose,
  onConfirm,
}: {
  data: typeof DEFAULT_DATA;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [day, setDay] = useState(0);
  const [duration, setDuration] = useState<"30" | "60" | "90">("30");
  const [room, setRoom] = useState(USER_ROOMS[0]);
  const [requests, setRequests] = useState("");

  const priceMap = { "30": data.price30, "60": data.price60, "90": data.price90 };
  const total = priceMap[duration];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "rgba(10,10,14,0.98)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 60px rgba(0,229,255,0.1)", maxHeight: "90vh" }}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-sm font-medium text-white/90">예약하기</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Icon icon="solar:close-bold" className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
          {/* Date */}
          <div>
            <p className="text-[10px] mb-2 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>날짜 선택</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  disabled={!data.availability[i]}
                  className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-30"
                  style={
                    day === i
                      ? { background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
                  }
                >
                  <span className="text-[10px]">{d}</span>
                  {data.availability[i] && <span className="w-1 h-1 rounded-full bg-green-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-[10px] mb-2 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>진행 시간</p>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDuration(d.key)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                  style={
                    duration === d.key
                      ? { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.35)", color: "#00E5FF" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {d.label}
                  <span className="block text-[9px] mt-0.5" style={{ color: duration === d.key ? "rgba(0,229,255,0.6)" : "rgba(255,255,255,0.2)" }}>
                    {priceMap[d.key].toLocaleString()} O₂
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Room */}
          <div>
            <p className="text-[10px] mb-2 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>룸 선택</p>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl text-xs outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
            >
              {USER_ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Special requests */}
          <div>
            <p className="text-[10px] mb-2 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>특별 요청 (선택)</p>
            <textarea
              rows={2}
              placeholder="곡 신청, 특별 진행 방식 등을 적어주세요"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl text-xs outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", caretColor: "#00E5FF" }}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.15)" }}>
            <span className="text-xs text-white/50">총 금액</span>
            <span className="text-base font-bold" style={{ color: "#00E5FF" }}>{total.toLocaleString()} O₂</span>
          </div>

          {/* Confirm */}
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl text-sm font-medium transition-all active:scale-95 hover:scale-105"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }}
          >
            예약 확정
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function EntertainerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const entertainerId = typeof params.entertainerId === "string" ? params.entertainerId : "e1";
  const data = ENTERTAINER_DATA[entertainerId] ?? DEFAULT_DATA;

  const [bookingOpen, setBookingOpen] = useState(false);
  const roleColorRgb = data.roleColor === "#00E5FF" ? "0,229,255" : data.roleColor === "#FF007F" ? "255,0,127" : data.roleColor === "#C9A84C" ? "201,168,76" : "168,85,247";

  const handleConfirm = () => {
    setBookingOpen(false);
    router.push("/entertainers/booking");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070707" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full blur-[140px]" style={{ background: `rgba(${roleColorRgb},0.06)` }} />
      </div>

      {bookingOpen && (
        <BookingModal data={data} onClose={() => setBookingOpen(false)} onConfirm={handleConfirm} />
      )}

      {/* Cover banner */}
      <div
        className="relative flex-shrink-0"
        style={{
          height: 160,
          background: `linear-gradient(135deg, rgba(${roleColorRgb},0.15) 0%, rgba(0,0,0,0.8) 100%)`,
          borderBottom: `1px solid rgba(${roleColorRgb},0.15)`,
        }}
      >
        <Link
          href="/entertainers"
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
        >
          ← 바이브 디렉터
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-2xl mx-auto px-4 pb-12">

          {/* Avatar + info */}
          <div className="relative -mt-10 mb-6 flex items-end gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold flex-shrink-0 relative"
              style={{
                background: `rgba(${roleColorRgb},0.12)`,
                border: `3px solid ${data.roleColor}`,
                boxShadow: `0 0 24px rgba(${roleColorRgb},0.3)`,
              }}
            >
              {data.name.charAt(0)}
              {/* Online ring */}
              <span
                className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
                style={{ background: data.status === "available" ? "#22C55E" : data.status === "soon" ? "#F59E0B" : "#3B82F6", borderColor: "#070707" }}
              />
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>{data.name}</h1>
                <Icon icon="solar:verified-check-bold" className="w-4 h-4" style={{ color: data.roleColor }} />
              </div>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: `rgba(${roleColorRgb},0.1)`, color: data.roleColor, border: `1px solid rgba(${roleColorRgb},0.3)` }}
              >
                {data.roleEmoji} {data.roleLabel}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "평점", value: `★ ${data.rating}`, color: "rgba(255,200,0,0.9)" },
              { label: "리뷰", value: `${data.reviewCount}개`, color: "rgba(255,255,255,0.7)" },
              { label: "파견", value: data.dispatchCount, color: "rgba(255,255,255,0.7)" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-base font-semibold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {data.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {tag}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 mb-8">
            {data.status === "available" ? (
              <button
                onClick={() => setBookingOpen(true)}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(255,0,127,0.12)", border: "1px solid rgba(255,0,127,0.5)", color: "#FF007F", boxShadow: "0 0 20px rgba(255,0,127,0.15)" }}
              >
                즉시 호출
              </button>
            ) : null}
            <button
              onClick={() => setBookingOpen(true)}
              className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}
            >
              예약하기
            </button>
          </div>

          {/* Price table */}
          <section className="mb-8">
            <h2 className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>요금표</h2>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {[
                { label: "30분", price: `${data.price30.toLocaleString()} O₂` },
                { label: "60분", price: `${data.price60.toLocaleString()} O₂` },
                { label: "90분", price: `${data.price90.toLocaleString()} O₂` },
                { label: "기업패키지", price: "별도 문의" },
              ].map((row, i) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3" style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{row.label}</span>
                  <span className="text-sm font-semibold" style={{ color: i < 3 ? data.roleColor : "rgba(255,255,255,0.4)" }}>{row.price}</span>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section className="mb-8">
            <h2 className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>소개</h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{data.bio}</p>
          </section>

          {/* Skills */}
          <section className="mb-8">
            <h2 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>스킬 프로필</h2>
            <div className="flex flex-col gap-3">
              {data.skills.map((skill) => (
                <div key={skill.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{skill.label}</span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{skill.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${skill.pct}%`, background: `linear-gradient(to right, ${data.roleColor}, rgba(${roleColorRgb},0.4))` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Preview clips */}
          <section className="mb-8">
            <h2 className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>미리보기 클립</h2>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="relative rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group"
                  style={{ height: 90, background: `rgba(${roleColorRgb},0.06)`, border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <Icon icon="solar:play-bold" className="w-3.5 h-3.5 ml-0.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    클립 {n}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section className="mb-8">
            <h2 className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>리뷰</h2>
            <div className="flex flex-col gap-3">
              {data.reviews.map((review, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.06)" }}>
                        {review.author.charAt(0)}
                      </div>
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{review.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <span key={j} className="text-[10px]" style={{ color: "rgba(255,200,0,0.8)" }}>★</span>
                      ))}
                      <span className="text-[9px] ml-1" style={{ color: "rgba(255,255,255,0.2)" }}>{review.date}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{review.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Availability calendar */}
          <section>
            <h2 className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>가용 일정 (다음 7일)</h2>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-center"
                  style={{
                    background: data.availability[i] ? `rgba(${roleColorRgb},0.08)` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${data.availability[i] ? `rgba(${roleColorRgb},0.25)` : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{day}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: data.availability[i] ? "#22C55E" : "rgba(255,255,255,0.1)" }}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
