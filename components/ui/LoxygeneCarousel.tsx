"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#00E5FF";
const RGB = "0,229,255";

export function LoxygeneCarousel() {
  return (
    <div className="group relative bg-white/[0.02] border rounded-xl p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{ borderColor: `rgba(${RGB},0.25)` }}>

      {/* Light orb */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(${RGB},0.12) 0%, transparent 65%)` }} />

      {/* Decorative bg icon */}
      <div className="absolute -right-6 -top-6 text-8xl pointer-events-none select-none"
        style={{ color: `rgba(${RGB},0.06)` }}>
        <Icon icon="solar:calendar-add-linear" />
      </div>

      {/* Invisible full-area link */}
      <Link href="/rooms/variety" className="absolute inset-0 z-10" aria-label="라이브 이벤트" tabIndex={-1} />

      <div className="relative z-20 flex flex-col gap-4 h-full">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all"
            style={{ background: `rgba(${RGB},0.12)`, borderColor: `rgba(${RGB},0.25)`, color: ACCENT }}>
            <Icon icon="solar:confetti-bold" className="text-xl" />
          </div>
          <span className="text-[10px] font-medium px-2 py-1 rounded tracking-widest"
            style={{ background: `rgba(${RGB},0.08)`, border: `1px solid rgba(${RGB},0.2)`, color: `rgba(${RGB},0.8)` }}>
            LIVE EVENT
          </span>
        </div>

        {/* Text */}
        <div className="mt-2">
          <h3 className="text-lg tracking-tight font-medium" style={{ color: ACCENT }}>라이브 이벤트</h3>
          <p className="text-xs font-light text-white/50 mt-1">스페셜 무대 · 팬미팅 · 깜짝 공연</p>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <Link href="/rooms/variety"
            className="relative z-20 inline-flex items-center gap-1.5 w-full py-2.5 rounded justify-center text-xs font-medium transition-all"
            style={{ background: `rgba(${RGB},0.1)`, border: `1px solid rgba(${RGB},0.3)`, color: ACCENT }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${RGB},0.2)`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${RGB},0.1)`; }}>
            이벤트 보기
            <Icon icon="solar:arrow-right-linear" className="text-sm" />
          </Link>
        </div>
      </div>
    </div>
  );
}
