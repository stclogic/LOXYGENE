"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ACCENT = "#06b6d4";

const MOCK_QUEUE = [
  { id: "t1", title: "After Hours", artist: "The Weeknd", bpm: 122, requester: "청취자A" },
  { id: "t2", title: "Blinding Lights", artist: "The Weeknd", bpm: 171, requester: "청취자B" },
  { id: "t3", title: "신호등", artist: "이무진", bpm: 117, requester: "청취자C" },
  { id: "t4", title: "JYPE Mix 2024", artist: "JYP Nation", bpm: 130, requester: "청취자D" },
  { id: "t5", title: "Levitating", artist: "Dua Lipa", bpm: 103, requester: "청취자E" },
];

const LISTENERS = ["👤", "😊", "🎵", "🔥", "💃", "🕺", "🎧", "⭐", "🌙", "✨", "🎤", "👑"];

export default function DJRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [bpm, setBpm] = useState(128);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [currentTrack] = useState(MOCK_QUEUE[0]);
  const [queue, setQueue] = useState(MOCK_QUEUE.slice(1));
  const [showRequest, setShowRequest] = useState(false);
  const [requestSong, setRequestSong] = useState("");
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const reactionIdRef = useRef(0);

  // Vinyl rotation animation
  useEffect(() => {
    if (!isPlaying) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const rpm = bpm / 33.33;
    const degPerMs = (rpm * 360) / 60000;
    const tick = (ts: number) => {
      const dt = ts - (lastFrameRef.current || ts);
      lastFrameRef.current = ts;
      setRotation(r => (r + degPerMs * dt) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, bpm]);

  // BPM variation mock
  useEffect(() => {
    const t = setInterval(() => setBpm(b => Math.max(90, Math.min(180, b + (Math.random() > 0.5 ? 1 : -1)))), 3000);
    return () => clearInterval(t);
  }, []);

  const fireReaction = (emoji: string) => {
    const id = ++reactionIdRef.current;
    setReactions(r => [...r, { id, emoji, x: 10 + Math.random() * 80 }]);
    setTimeout(() => setReactions(r => r.filter(p => p.id !== id)), 2000);
  };

  const VinylDeck = ({ side }: { side: "left" | "right" }) => (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* Platter */}
      <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
      {/* Vinyl record */}
      <div className="rounded-full" style={{
        width: 140, height: 140,
        background: `conic-gradient(from 0deg, #111 0%, #1a1a1a 12.5%, #111 25%, #1a1a1a 37.5%, #111 50%, #1a1a1a 62.5%, #111 75%, #1a1a1a 87.5%, #111 100%)`,
        transform: `rotate(${side === "right" ? rotation + 90 : rotation}deg)`,
        boxShadow: isPlaying ? `0 0 20px rgba(6,182,212,0.2)` : "none",
      }}>
        {/* Grooves */}
        {[40, 55, 70, 85].map(r => (
          <div key={r} className="absolute rounded-full" style={{ inset: `${(140 - r * 2) / 2}px`, border: "0.5px solid rgba(255,255,255,0.06)" }} />
        ))}
        {/* Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-base" style={{ background: ACCENT }}>🎧</div>
        </div>
      </div>
      {/* Tonearm */}
      <div className="absolute top-3 right-3 w-1.5 h-16 rounded-full origin-top"
        style={{ background: "rgba(255,255,255,0.2)", transform: `rotate(${side === "left" ? -15 : 15}deg)`, transformOrigin: "top center" }} />
    </div>
  );

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#070707] flex flex-col relative">
      {/* Visualizer BG */}
      <div className="fixed inset-0 flex items-end justify-center gap-px pointer-events-none overflow-hidden opacity-10">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="w-2 rounded-t-sm flex-shrink-0"
            style={{ background: ACCENT, height: `${20 + ((i + 1) % 7) * 8}%`, animation: `vizBar ${0.4 + (i % 5) * 0.15}s ease-in-out infinite alternate`, animationDelay: `${(i * 0.05) % 1}s` }} />
        ))}
      </div>

      {/* Floating reactions */}
      {reactions.map(r => (
        <div key={r.id} className="fixed bottom-28 text-3xl pointer-events-none z-50"
          style={{ left: `${r.x}%`, animation: "reactionFloat 2s ease-out forwards" }}>{r.emoji}</div>
      ))}

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0 z-40"
        style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <Link href="/rooms/dj" className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" /><span className="hidden sm:block">DJ 부스</span>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-black tracking-widest" style={{ color: ACCENT, textShadow: `0 0 12px ${ACCENT}80` }}>DJ BOOTH</h1>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: `rgba(6,182,212,0.1)`, border: `1px solid ${ACCENT}30` }}>
            <span className="text-lg font-black tabular-nums" style={{ color: ACCENT }}>{bpm}</span>
            <span className="text-[9px] text-white/30">BPM</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: ACCENT, animation: "pulse-neon 1.5s infinite" }} />
          <span className="text-xs" style={{ color: ACCENT }}>LIVE</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden">
          {/* DJ Decks */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            <div className="flex items-center gap-6 sm:gap-12">
              <VinylDeck side="left" />

              {/* Center controls */}
              <div className="flex flex-col items-center gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: `rgba(6,182,212,0.15)`, border: `2px solid ${ACCENT}60`, boxShadow: isPlaying ? `0 0 25px rgba(6,182,212,0.4)` : "none" }}>
                  <Icon icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"} className="w-8 h-8" style={{ color: ACCENT }} />
                </button>
                <div className="text-center">
                  <p className="text-xs font-bold text-white/85 truncate max-w-[120px]">{currentTrack.title}</p>
                  <p className="text-[9px] text-white/30">{currentTrack.artist}</p>
                </div>
              </div>

              <VinylDeck side="right" />
            </div>

            {/* Waveform */}
            <div className="w-full max-w-lg flex items-center justify-center gap-px h-12">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-full"
                  style={{
                    background: i < 32 ? ACCENT : "rgba(255,255,255,0.1)",
                    height: `${25 + Math.abs(Math.sin(i * 0.4)) * 75}%`,
                    animation: isPlaying ? `waveBar ${0.3 + (i % 4) * 0.1}s ease-in-out infinite alternate` : "none",
                  }} />
              ))}
            </div>
          </div>

          {/* Listener avatars */}
          <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-white/30">청취자</span>
            {LISTENERS.map((a, i) => (
              <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>{a}</div>
            ))}
          </div>

          {/* Bottom action bar */}
          <div className="px-4 py-3 flex items-center gap-2 border-t flex-shrink-0"
            style={{ background: "rgba(7,7,7,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
            <button onClick={() => setShowRequest(true)}
              className="flex items-center gap-2 px-5 h-12 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: `rgba(6,182,212,0.15)`, border: `1px solid ${ACCENT}50`, color: ACCENT }}>
              <Icon icon="solar:music-note-2-bold" className="w-4 h-4" /> 신청곡
            </button>
            <div className="flex gap-2 flex-1 justify-center">
              {["🔥", "💃", "🎵"].map(e => (
                <button key={e} onClick={() => fireReaction(e)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all active:scale-75"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>{e}</button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-4 h-12 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: `rgba(201,168,76,0.1)`, border: `1px solid rgba(201,168,76,0.3)`, color: "#C9A84C" }}>
              <span>💎</span> 팁
            </button>
          </div>
        </div>

        {/* Track queue sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-l flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold tracking-widest" style={{ color: ACCENT }}>🎵 TRACK QUEUE</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {queue.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-xl group"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xs text-white/20 w-4 text-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{t.title}</p>
                  <p className="text-[9px] text-white/30 truncate">{t.artist} · {t.requester}</p>
                </div>
                <span className="text-[9px] font-mono flex-shrink-0" style={{ color: ACCENT }}>{t.bpm}</span>
                <Icon icon="solar:alt-arrow-up-linear" className="w-3.5 h-3.5 text-white/20 opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0 transition-opacity"
                  onClick={() => { if (i === 0) return; setQueue(q => { const n = [...q]; [n[i], n[i - 1]] = [n[i - 1], n[i]]; return n; }); }} />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Song request modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(4,10,18,0.98)", border: `1px solid ${ACCENT}30` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">🎵 신청곡</h2>
              <button onClick={() => setShowRequest(false)} className="text-white/30 hover:text-white/60"><Icon icon="solar:close-circle-bold" className="w-5 h-5" /></button>
            </div>
            <input value={requestSong} onChange={e => setRequestSong(e.target.value)} placeholder="곡명 또는 아티스트를 입력하세요"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", caretColor: ACCENT }} />
            <button onClick={() => { setShowRequest(false); setRequestSong(""); }}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: `rgba(6,182,212,0.15)`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
              신청하기
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-neon{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes vizBar{from{transform:scaleY(0.5)}to{transform:scaleY(1.2)}}
        @keyframes waveBar{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}
        @keyframes reactionFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-120px) scale(1.5)}}
      `}</style>
    </div>
  );
}
