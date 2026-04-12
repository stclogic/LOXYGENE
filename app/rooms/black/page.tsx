"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const VALID_CODE = "7X9K";

export default function BlackLobbyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [shake, setShake] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (code.toUpperCase() === VALID_CODE || code.length >= 4) {
      setSubmitted(true);
      setTimeout(() => router.push("/rooms/black/penthouse-1"), 600);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setCode("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#020202" }}>

      {/* Gold dust particles */}
      <GoldDust />

      {/* Faint grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Home button — gold tinted */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ color: "#C9A84C", background: "rgba(201,168,76,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(201,168,76,0.15)" }}
      >
        ← L&apos;OXYGÈNE
      </Link>

      {/* E2EE badge — top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
        style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)", backdropFilter: "blur(12px)" }}>
        <Icon icon="solar:lock-keyhole-bold" className="w-3 h-3" style={{ color: "#00E5FF" }} />
        <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(0,229,255,0.6)" }}>
          End-to-End Encrypted
        </span>
      </div>

      {/* Center panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">

        {/* Header */}
        <div className="flex flex-col items-center mb-12">
          {/* Gold rule */}
          <div className="flex items-center gap-5 mb-8 w-full max-w-xs">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.3))" }} />
            <span className="text-[#C9A84C] text-xs opacity-50">✦</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,168,76,0.3))" }} />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-light tracking-[0.35em] uppercase mb-3"
            style={{ color: "#C9A84C", textShadow: "0 0 40px rgba(201,168,76,0.25)" }}
          >
            L&apos;OXYGÈNE BLACK
          </h1>
          <p className="text-xs tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.2)" }}>
            초대받은 자만이 입장할 수 있습니다
          </p>

          {/* Gold rule bottom */}
          <div className="flex items-center gap-5 mt-8 w-full max-w-xs">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.15))" }} />
            <span className="text-[#C9A84C] text-[10px] opacity-30">❧</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,168,76,0.15))" }} />
          </div>
        </div>

        {/* Access code panel */}
        <div
          className={`w-full max-w-sm flex flex-col items-center gap-6 p-8 rounded-2xl transition-all duration-200 ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
          style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(201,168,76,0.12)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Fingerprint icon */}
          <div className="relative flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(201,168,76,0.05)",
                border: `1px solid ${focused ? "rgba(0,229,255,0.4)" : "rgba(201,168,76,0.15)"}`,
                transition: "border-color 0.3s",
              }}
            >
              <Icon
                icon="solar:fingerprint-bold"
                className="w-8 h-8 transition-colors duration-300"
                style={{ color: focused ? "#00E5FF" : "#C9A84C", opacity: focused ? 1 : 0.5 }}
              />
            </div>
            {/* Scan line on focus */}
            {focused && (
              <div
                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
              >
                <div
                  className="absolute inset-x-0 h-0.5 opacity-70"
                  style={{
                    background: "linear-gradient(to right, transparent, #00E5FF, transparent)",
                    animation: "scan-vertical 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            )}
          </div>

          {/* Code input */}
          <div className="w-full relative">
            <input
              ref={inputRef}
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="ENTER ACCESS CODE"
              className="w-full text-center outline-none font-mono tracking-[0.4em] text-sm py-3.5 px-4 rounded-xl transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${focused ? "rgba(0,229,255,0.35)" : "rgba(201,168,76,0.12)"}`,
                color: focused ? "#00E5FF" : "rgba(255,255,255,0.5)",
                letterSpacing: "0.4em",
                caretColor: "#00E5FF",
              }}
              maxLength={16}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="w-full py-3.5 rounded-xl font-light tracking-[0.3em] text-sm uppercase transition-all duration-200 active:scale-95 disabled:opacity-50"
            style={{
              background: submitted ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.35)",
              color: "#C9A84C",
            }}
          >
            {submitted ? (
              <span className="flex items-center justify-center gap-2">
                <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                인증 중...
              </span>
            ) : "입장"}
          </button>

          {/* Invite link */}
          <button className="text-xs tracking-wider transition-colors"
            style={{ color: "rgba(255,255,255,0.12)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.12)")}
          >
            초대 코드가 없으신가요?
          </button>
        </div>
      </div>

      {/* 방 만들기 FAB */}
      <Link
        href="/rooms/black/penthouse-1"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-light tracking-widest text-xs uppercase transition-all hover:scale-105 active:scale-95"
        style={{
          background: "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.35)",
          color: "#C9A84C",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 20px rgba(201,168,76,0.1)",
        }}
      >
        <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
        방 만들기
      </Link>

      <style>{`
        @keyframes scan-vertical {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes gold-drift {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-120vh) translateX(var(--dx, 20px)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function GoldDust() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 15,
    dx: (Math.random() - 0.5) * 60,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-4px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "#C9A84C",
            opacity: 0,
            ["--dx" as string]: `${p.dx}px`,
            animation: `gold-drift ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
