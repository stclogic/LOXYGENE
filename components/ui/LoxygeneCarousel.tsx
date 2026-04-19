"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const SLIDES = [
  {
    id: "hall",
    badge: "HALL OF FAME",
    title: "명예의 전당",
    desc: "이달의 파티 킹 & 퀸 · 누적 챔피언 랭킹",
    icon: "solar:trophy-bold",
    href: "/rooms/colosseum",
    accent: "#C9A84C",
    rgb: "201,168,76",
    orbPos: "80% 10%",
    bgIcon: "solar:crown-linear",
    cta: "랭킹 보기",
    ctaIcon: "solar:arrow-right-linear",
  },
  {
    id: "shop",
    badge: "BOUTIQUE",
    title: "부티크 샵",
    desc: "프리미엄 아이템 · 한정 콜라보 드랍",
    icon: "solar:bag-5-bold",
    href: "/shop",
    accent: "#FF007F",
    rgb: "255,0,127",
    orbPos: "15% 85%",
    bgIcon: "solar:shop-linear",
    cta: "샵 입장",
    ctaIcon: "solar:arrow-right-linear",
  },
  {
    id: "events",
    badge: "LIVE EVENT",
    title: "라이브 이벤트",
    desc: "스페셜 무대 · 팬미팅 · 깜짝 공연",
    icon: "solar:confetti-bold",
    href: "/rooms/variety",
    accent: "#00E5FF",
    rgb: "0,229,255",
    orbPos: "50% 0%",
    bgIcon: "solar:calendar-add-linear",
    cta: "이벤트 보기",
    ctaIcon: "solar:arrow-right-linear",
  },
] as const;

const INTERVAL = 6000;

export function LoxygeneCarousel() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const paused = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    setVisible(false);
    setTimeout(() => {
      setActive(idx);
      setVisible(true);
    }, 280);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!paused.current) {
        setVisible(false);
        setTimeout(() => {
          setActive(prev => (prev + 1) % SLIDES.length);
          setVisible(true);
        }, 280);
      }
    }, INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slide = SLIDES[active];

  return (
    <div
      className="group relative bg-white/[0.02] border border-white/5 rounded-xl p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-xl overflow-hidden cursor-pointer"
      style={{ borderColor: visible ? `rgba(${slide.rgb},0.25)` : "rgba(255,255,255,0.05)", transition: "border-color 0.6s ease" }}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      {/* Shifting light orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at ${slide.orbPos}, rgba(${slide.rgb},0.14) 0%, transparent 65%)`,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease, background 0.6s ease",
        }}
      />

      {/* Decorative bg icon */}
      <div
        className="absolute -right-6 -top-6 text-8xl pointer-events-none select-none"
        style={{ color: `rgba(${slide.rgb},0.06)`, transition: "color 0.6s ease" }}
      >
        <Icon icon={slide.bgIcon} />
      </div>

      {/* Content — fades in/out */}
      <Link
        href={slide.href}
        className="absolute inset-0 z-10"
        aria-label={slide.title}
        tabIndex={-1}
      />
      <div
        className="relative z-20 flex flex-col gap-4 h-full"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.28s ease" }}
      >
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all"
            style={{
              background: `rgba(${slide.rgb},0.12)`,
              borderColor: `rgba(${slide.rgb},0.25)`,
              color: slide.accent,
            }}
          >
            <Icon icon={slide.icon} className="text-xl" />
          </div>
          <span
            className="text-[10px] font-medium px-2 py-1 rounded tracking-widest"
            style={{
              background: `rgba(${slide.rgb},0.08)`,
              border: `1px solid rgba(${slide.rgb},0.2)`,
              color: `rgba(${slide.rgb.split(",").map(Number).join(",")},0.8)`,
            }}
          >
            {slide.badge}
          </span>
        </div>

        {/* Text */}
        <div className="mt-2">
          <h3
            className="text-lg tracking-tight font-medium transition-colors"
            style={{ color: slide.accent }}
          >
            {slide.title}
          </h3>
          <p className="text-xs font-light text-white/50 mt-1">{slide.desc}</p>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <Link
            href={slide.href}
            className="relative z-20 inline-flex items-center gap-1.5 w-full py-2.5 rounded justify-center text-xs font-medium transition-all"
            style={{
              background: `rgba(${slide.rgb},0.1)`,
              border: `1px solid rgba(${slide.rgb},0.3)`,
              color: slide.accent,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = `rgba(${slide.rgb},0.2)`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = `rgba(${slide.rgb},0.1)`;
            }}
          >
            {slide.cta}
            <Icon icon={slide.ctaIcon} className="text-sm" />
          </Link>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`${s.title} 슬라이드`}
              onClick={e => { e.preventDefault(); goTo(i); startTimer(); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? 18 : 6,
                height: 6,
                background: i === active ? slide.accent : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
