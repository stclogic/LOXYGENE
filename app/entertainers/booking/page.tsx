"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function BookingConfirmPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#070707" }}
    >
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full blur-[160px]" style={{ background: "rgba(0,229,255,0.06)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {/* Check animation */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,229,255,0.1)",
            border: "2px solid rgba(0,229,255,0.5)",
            boxShadow: "0 0 40px rgba(0,229,255,0.2)",
          }}
        >
          <Icon icon="solar:check-circle-bold" className="w-10 h-10" style={{ color: "#00E5FF" }} />
        </div>

        <div>
          <h1 className="text-xl font-light mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>예약이 확정되었습니다</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>바이브 디렉터가 곧 입장합니다</p>
        </div>

        {/* Details card */}
        <div
          className="w-full rounded-2xl p-5 flex flex-col gap-3 text-left"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.15)" }}
        >
          {[
            { label: "디렉터",   value: "DJ 소울메이트" },
            { label: "서비스",   value: "보컬 디렉터 · 30분" },
            { label: "예상 입장", value: "약 2분 이내" },
            { label: "결제",     value: "15,000 O₂" },
            { label: "예약 번호", value: "#VD-20260412-0041" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{row.label}</span>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Countdown progress */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>디렉터 입장 준비 중</span>
            <span className="text-[10px]" style={{ color: "rgba(0,229,255,0.6)" }}>
              {progress < 100 ? "연결 중..." : "준비 완료"}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%`, background: "linear-gradient(to right, #00E5FF, rgba(0,229,255,0.5))" }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl text-sm text-center transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            홈으로
          </Link>
          <Link
            href="/entertainers"
            className="flex-1 py-3 rounded-xl text-sm text-center font-medium transition-all hover:scale-105 active:scale-95"
            style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}
          >
            더 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
