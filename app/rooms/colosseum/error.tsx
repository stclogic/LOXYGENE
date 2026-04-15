"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ColosseumError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[ColosseumError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070707] gap-6 px-4">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
      >
        🔴
      </div>

      <div className="text-center max-w-sm">
        <h1 className="text-white font-bold text-xl">연결에 문제가 발생했습니다</h1>
        <p className="text-white/40 text-sm mt-2">
          룸에 연결하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-white/20 text-xs mt-1 font-mono">코드: {error.digest}</p>
        )}
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
