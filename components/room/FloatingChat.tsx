"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useRoomChat } from "@/hooks/useRoomChat";

interface Props {
  roomId: string;
  nickname: string;
  accentColor?: string;
  onClose: () => void;
}

// Accent hex → "r,g,b" for rgba() usage
function hexToRgb(hex: string): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "0,229,255";
  return m.map(h => parseInt(h, 16)).join(",");
}

const MIN_W = 220;
const MIN_H = 260;

export function FloatingChat({ roomId, nickname, accentColor = "#00E5FF", onClose }: Props) {
  const { messages, sendMessage } = useRoomChat(roomId, nickname);
  const [input, setInput] = useState("");
  const [opacity, setOpacity] = useState(0.82);

  // Position: default bottom-left, just above bottom bar
  const [pos, setPos] = useState({ x: 12, y: -1 }); // y=-1 signals "not yet placed"
  const [size, setSize] = useState({ w: 272, h: 380 });

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const resizing = useRef(false);
  const resizeOrigin = useRef({ mx: 0, my: 0, w: 0, h: 0 });

  // Compute default y on first client render (avoids SSR mismatch)
  useEffect(() => {
    setPos(p => p.y === -1 ? { x: p.x, y: window.innerHeight - 380 - 72 } : p);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const startDrag = (e: React.MouseEvent) => {
    // Don't drag when clicking interactive children (slider, close button)
    if ((e.target as HTMLElement).closest("input,button")) return;
    dragging.current = true;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const nx = Math.max(0, Math.min(window.innerWidth  - size.w, dragOrigin.current.px + ev.clientX - dragOrigin.current.mx));
      const ny = Math.max(0, Math.min(window.innerHeight - size.h, dragOrigin.current.py + ev.clientY - dragOrigin.current.my));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Resize (SE corner) ───────────────────────────────────────────────────
  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizing.current = true;
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h };

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const nw = Math.max(MIN_W, resizeOrigin.current.w + ev.clientX - resizeOrigin.current.mx);
      const nh = Math.max(MIN_H, resizeOrigin.current.h + ev.clientY - resizeOrigin.current.my);
      setSize({ w: nw, h: nh });
    };
    const onUp = () => {
      resizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  const rgb = hexToRgb(accentColor);

  // Don't render until position is computed (avoids top-0 flash)
  if (pos.y === -1) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-30 flex flex-col rounded-2xl overflow-hidden"
      style={{
        left: pos.x,
        top:  pos.y,
        width:  size.w,
        height: size.h,
        background: `rgba(2,4,14,${opacity})`,
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(32px)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.55)",
        userSelect: "none",
      }}
    >
      {/* ── Header / Drag handle ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0 cursor-move"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        onMouseDown={startDrag}
      >
        <div className="flex items-center gap-1.5 pointer-events-none select-none">
          <Icon icon="solar:hamburger-menu-bold" className="w-3 h-3 text-white/20" />
          <span className="text-[10px] font-bold tracking-widest" style={{ color: `rgba(${rgb},0.7)` }}>
            💬 CHAT
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Opacity slider */}
          <label className="flex items-center gap-1.5 cursor-pointer" title="투명도">
            <Icon icon="solar:layers-minimalistic-bold" className="w-3 h-3 text-white/25 flex-shrink-0" />
            <input
              type="range"
              min={0.25}
              max={1}
              step={0.05}
              value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              onMouseDown={e => e.stopPropagation()}
              aria-label="채팅창 투명도"
              className="w-14 h-1 rounded-full cursor-pointer appearance-none"
              style={{ accentColor }}
            />
          </label>

          <button
            type="button"
            aria-label="채팅 닫기"
            onMouseDown={e => e.stopPropagation()}
            onClick={onClose}
            className="text-white/25 hover:text-white/60 transition-colors"
          >
            <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div
        className="flex-1 px-3 py-2 flex flex-col gap-2 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.map(m => (
          <div
            key={m.id}
            className="flex flex-col"
            style={{ alignItems: m.isOwn ? "flex-end" : "flex-start" }}
          >
            {!m.isOwn && (
              <span className="text-[9px] text-white/30 mb-0.5 px-1">
                {m.name} · {m.time}
              </span>
            )}
            <div
              className="px-2.5 py-1.5 rounded-2xl text-[11px] leading-snug"
              style={{
                maxWidth: "82%",
                background: m.isOwn
                  ? `rgba(${rgb},0.18)`
                  : "rgba(255,255,255,0.07)",
                border: m.isOwn
                  ? `1px solid rgba(${rgb},0.35)`
                  : "1px solid rgba(255,255,255,0.07)",
                color: m.isOwn ? accentColor : "rgba(255,255,255,0.78)",
                wordBreak: "break-word",
                userSelect: "text",
              }}
            >
              {m.text}
            </div>
            {m.isOwn && (
              <span className="text-[9px] text-white/25 mt-0.5 px-1">{m.time}</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div
        className="px-2.5 py-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-end gap-1.5">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-grow height
              const ta = e.currentTarget;
              ta.style.height = "auto";
              ta.style.height = Math.min(ta.scrollHeight, 72) + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="메시지 입력..."
            className="flex-1 px-2.5 py-1.5 rounded-xl text-[11px] text-white outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: `1px solid rgba(${rgb},0.2)`,
              minHeight: 30,
              maxHeight: 72,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.85)",
              userSelect: "text",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = `rgba(${rgb},0.5)`)}
            onBlur={e => (e.currentTarget.style.borderColor = `rgba(${rgb},0.2)`)}
          />
          <button
            type="button"
            aria-label="메시지 전송"
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
            style={{
              background: `rgba(${rgb},0.15)`,
              border: `1px solid rgba(${rgb},0.35)`,
            }}
          >
            <Icon icon="solar:plain-bold" className="w-3.5 h-3.5" style={{ color: accentColor }} />
          </button>
        </div>
        <p className="text-[9px] text-white/20 mt-1 px-0.5">Enter 전송 · Shift+Enter 줄바꿈</p>
      </div>

      {/* ── Resize handle (SE corner) ─────────────────────────────────────── */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-1 cursor-se-resize"
        onMouseDown={startResize}
        title="크기 조절"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-white/20">
          <line x1="2" y1="10" x2="10" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="6" y1="10" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}
