"use client";

import { useEffect, useState } from "react";

export type ConnectionState =
  | "connecting"
  | "connected"
  | "degraded"
  | "disconnected"
  | "mock";

interface ConnectionStatusProps {
  state: ConnectionState;
  /** Called when user requests a reconnect from the disconnected state */
  onRetry?: () => void;
}

const CONFIG: Record<
  ConnectionState,
  { dot: string; label: string; color: string; border: string; autoHide: boolean }
> = {
  connecting:    { dot: "🟡", label: "연결 중...",                color: "rgba(234,179,8,0.8)",   border: "rgba(234,179,8,0.3)",   autoHide: false },
  connected:     { dot: "🟢", label: "연결됨",                   color: "rgba(34,197,94,0.8)",   border: "rgba(34,197,94,0.3)",   autoHide: true  },
  degraded:      { dot: "🟠", label: "연결 불안정",               color: "rgba(249,115,22,0.8)",  border: "rgba(249,115,22,0.3)",  autoHide: false },
  disconnected:  { dot: "🔴", label: "연결 끊김 — 재연결 중...", color: "rgba(239,68,68,0.8)",   border: "rgba(239,68,68,0.3)",   autoHide: false },
  mock:          { dot: "🔵", label: "데모 모드",                 color: "rgba(99,102,241,0.8)",  border: "rgba(99,102,241,0.3)",  autoHide: false },
};

export default function ConnectionStatus({ state, onRetry }: ConnectionStatusProps) {
  const [visible, setVisible] = useState(true);
  const cfg = CONFIG[state];

  // Auto-hide "connected" after 3 s
  useEffect(() => {
    setVisible(true);
    if (!cfg.autoHide) return;
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [state, cfg.autoHide]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md pointer-events-auto transition-all"
      style={{
        background: "rgba(7,7,7,0.88)",
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 12px ${cfg.border}`,
      }}
    >
      <span>{cfg.dot}</span>
      <span style={{ color: cfg.color }}>{cfg.label}</span>

      {state === "disconnected" && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 underline text-white/50 hover:text-white/80 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
