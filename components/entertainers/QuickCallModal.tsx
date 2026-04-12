"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

export interface QuickEntertainerId {
  id: string;
  name: string;
  role: string;
  roleColor: string;
  rating: number;
  price: string;
  statusLabel: string;
}

const QUICK_LIST: QuickEntertainerId[] = [
  { id: "e1", name: "DJ 소울메이트",   role: "🎤 보컬 디렉터",          roleColor: "#00E5FF", rating: 4.9, price: "15,000 O₂ / 30분", statusLabel: "즉시 호출 가능" },
  { id: "e4", name: "파티킹 준호",      role: "🎉 파티 MC",              roleColor: "#A855F7", rating: 4.7, price: "10,000 O₂ / 30분", statusLabel: "즉시 호출 가능" },
  { id: "e6", name: "버블리 유나",      role: "🎤 보컬 디렉터",          roleColor: "#00E5FF", rating: 4.8, price: "8,000 O₂ / 30분",  statusLabel: "즉시 호출 가능" },
];

const QUICK_FILTERS = ["전체", "보컬", "레크", "소셜"];

type CallState = "idle" | "calling" | "success";

export function QuickCallModal({
  open,
  onClose,
  roomId,
}: {
  open: boolean;
  onClose: () => void;
  roomId?: string;
}) {
  const [filter, setFilter] = useState("전체");
  const [callState, setCallState] = useState<CallState>("idle");
  const [calledName, setCalledName] = useState("");
  const [progress, setProgress] = useState(100);

  const handleCall = (name: string) => {
    setCalledName(name);
    setCallState("calling");
    setTimeout(() => {
      setCallState("success");
      let p = 100;
      const tick = setInterval(() => {
        p -= 1.5;
        setProgress(Math.max(0, p));
        if (p <= 0) clearInterval(tick);
      }, 90);
    }, 1400);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setCallState("idle");
      setProgress(100);
      setCalledName("");
    }, 300);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(10,10,14,0.98)",
          border: "1px solid rgba(255,0,127,0.2)",
          boxShadow: "0 0 60px rgba(255,0,127,0.12)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
              바이브 디렉터 호출
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              현재 룸: {roomId ?? "Lobby"} · 참여자 6명
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <Icon icon="solar:close-bold" className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
          {callState === "idle" && (
            <>
              {/* Filters */}
              <div className="flex gap-1.5">
                {QUICK_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-1 rounded-lg text-[11px] transition-all"
                    style={
                      filter === f
                        ? { background: "rgba(255,0,127,0.12)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Entertainer cards */}
              <div className="flex flex-col gap-2">
                {QUICK_LIST.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                      style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.2)", color: "#FF007F" }}
                    >
                      {e.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-white/90 truncate">{e.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(0,229,255,0.08)", color: e.roleColor }}>
                          {e.role.split(" ").slice(1).join(" ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: "rgba(255,200,0,0.8)" }}>★{e.rating}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,0,127,0.7)" }}>{e.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCall(e.name)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all active:scale-95"
                      style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F" }}
                    >
                      호출
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)" }}>
                <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#00E5FF" }} />
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>평균 입장 소요: 2분 이내</span>
              </div>

              <Link
                href="/entertainers"
                onClick={handleClose}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
              >
                전체 목록 보기
                <Icon icon="solar:arrow-right-linear" className="w-3 h-3" />
              </Link>
            </>
          )}

          {callState === "calling" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.3)" }}
              >
                <Icon icon="solar:user-speak-bold" className="w-7 h-7 animate-pulse" style={{ color: "#FF007F" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/90 mb-1">디렉터에게 요청 중...</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{calledName}님에게 연결 중</p>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: "60%", background: "rgba(255,0,127,0.6)", animation: "pulse 1s ease-in-out infinite" }}
                />
              </div>
            </div>
          )}

          {callState === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,229,255,0.1)", border: "2px solid rgba(0,229,255,0.4)", boxShadow: "0 0 20px rgba(0,229,255,0.2)" }}
              >
                <Icon icon="solar:check-circle-bold" className="w-7 h-7" style={{ color: "#00E5FF" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1" style={{ color: "#00E5FF" }}>
                  {calledName}님이 수락했습니다!
                </p>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>잠시 후 입장합니다</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>예상 입장: 1분 30초</p>
              </div>
              {/* Countdown bar */}
              <div className="w-full">
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{ width: `${progress}%`, background: "linear-gradient(to right, #00E5FF, rgba(0,229,255,0.4))" }}
                  />
                </div>
                <p className="text-[9px] text-center mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>입장 대기 중...</p>
              </div>
              {/* Cost notice */}
              <div
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,0,127,0.05)", border: "1px solid rgba(255,0,127,0.15)" }}
              >
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>O₂ 차감 예정</span>
                <span className="text-xs font-semibold" style={{ color: "#FF007F" }}>15,000 O₂</span>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl text-sm transition-all active:scale-95"
                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
