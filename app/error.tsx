"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070707] gap-6 px-4">
      {/* Logo */}
      <p
        className="text-[#00E5FF] font-black text-xl tracking-[0.4em]"
        style={{ textShadow: "0 0 16px rgba(0,229,255,0.4)" }}
      >
        L&apos;OXYGÈNE
      </p>

      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
      >
        🔴
      </div>

      <div className="text-center max-w-sm">
        <h1 className="text-white font-bold text-xl">오류가 발생했습니다</h1>
        <p className="text-white/40 text-sm mt-2">
          예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{
            background: "rgba(0,229,255,0.1)",
            border: "1px solid rgba(0,229,255,0.35)",
            color: "#00E5FF",
          }}
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
