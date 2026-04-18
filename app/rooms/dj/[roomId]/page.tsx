"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { PartyRoomShell } from "@/components/room/PartyRoomShell";

const ACCENT = "#06b6d4";

const MOCK_QUEUE = [
  { id: "t1", title: "After Hours",      artist: "The Weeknd", bpm: 122, requester: "청취자A" },
  { id: "t2", title: "Blinding Lights",  artist: "The Weeknd", bpm: 171, requester: "청취자B" },
  { id: "t3", title: "신호등",            artist: "이무진",      bpm: 117, requester: "청취자C" },
  { id: "t4", title: "JYPE Mix 2024",    artist: "JYP Nation", bpm: 130, requester: "청취자D" },
];

function DJPanelContent() {
  const [bpm, setBpm] = useState(128);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [queue, setQueue] = useState(MOCK_QUEUE.slice(1));
  const [showRequest, setShowRequest] = useState(false);
  const [requestSong, setRequestSong] = useState("");
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const degPerMs = ((bpm / 33.33) * 360) / 60000;
    const tick = (ts: number) => {
      const dt = ts - (lastFrameRef.current || ts);
      lastFrameRef.current = ts;
      setRotation(r => (r + degPerMs * dt) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, bpm]);

  useEffect(() => {
    const t = setInterval(() => setBpm(b => Math.max(90, Math.min(180, b + (Math.random() > 0.5 ? 1 : -1)))), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Vinyl + BPM */}
      <div className="flex items-center justify-center gap-4">
        <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
          <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
          <div className="rounded-full" style={{
            width: 86, height: 86,
            background: `conic-gradient(from 0deg, #111 0%, #1a1a1a 12.5%, #111 25%, #1a1a1a 37.5%, #111 50%, #1a1a1a 62.5%, #111 75%, #1a1a1a 87.5%, #111 100%)`,
            transform: `rotate(${rotation}deg)`,
            boxShadow: isPlaying ? `0 0 14px rgba(6,182,212,0.25)` : "none",
          }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: ACCENT }}>🎧</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setIsPlaying(v => !v)} aria-label={isPlaying ? "일시정지" : "재생"}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: `rgba(6,182,212,0.15)`, border: `2px solid ${ACCENT}60`, boxShadow: isPlaying ? `0 0 18px rgba(6,182,212,0.35)` : "none" }}>
            <Icon icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"} className="w-6 h-6" style={{ color: ACCENT }} />
          </button>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: `rgba(6,182,212,0.1)`, border: `1px solid ${ACCENT}30` }}>
            <span className="text-base font-black tabular-nums" style={{ color: ACCENT }}>{bpm}</span>
            <span className="text-[9px] text-white/30">BPM</span>
          </div>
        </div>
      </div>

      {/* Now playing */}
      <div className="rounded-xl p-3" style={{ background: "rgba(6,182,212,0.05)", border: `1px solid ${ACCENT}20` }}>
        <p className="text-[10px] text-white/30 tracking-widest mb-1">NOW PLAYING</p>
        <p className="text-xs font-bold text-white/90 truncate">{MOCK_QUEUE[0].title}</p>
        <p className="text-[10px] text-white/40">{MOCK_QUEUE[0].artist}</p>
      </div>

      {/* Waveform */}
      <div className="flex items-center justify-center gap-px h-8">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-full"
            style={{
              background: i < 22 ? ACCENT : "rgba(255,255,255,0.08)",
              height: `${25 + Math.abs(Math.sin(i * 0.4)) * 75}%`,
              animation: isPlaying ? `waveBar ${0.3 + (i % 4) * 0.1}s ease-in-out infinite alternate` : "none",
            }} />
        ))}
      </div>

      {/* Track queue */}
      <div>
        <p className="text-[10px] text-white/30 tracking-widest font-medium mb-2">🎵 TRACK QUEUE</p>
        <div className="flex flex-col gap-1.5">
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
      </div>

      {/* Song request */}
      {showRequest && (
        <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-bold text-white/70">🎵 신청곡</p>
          <input value={requestSong} onChange={e => setRequestSong(e.target.value)} placeholder="곡명 또는 아티스트"
            className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
          <button onClick={() => { setShowRequest(false); setRequestSong(""); }}
            className="w-full py-2 rounded-lg font-bold text-xs transition-all active:scale-95"
            style={{ background: `rgba(6,182,212,0.15)`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
            신청하기
          </button>
        </div>
      )}

      <button onClick={() => setShowRequest(v => !v)}
        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
        style={{ background: `rgba(6,182,212,0.12)`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
        <Icon icon="solar:music-note-2-bold" className="w-4 h-4 inline mr-1.5" /> 신청곡 보내기
      </button>

      <style>{`
        @keyframes waveBar{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}
      `}</style>
    </div>
  );
}

export default function DJRoomPage({ params: _params }: { params: Promise<{ roomId: string }> }) {
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const reactionIdRef = useRef(0);

  const fireReaction = (emoji: string) => {
    const id = ++reactionIdRef.current;
    setReactions(r => [...r, { id, emoji, x: 10 + Math.random() * 80 }]);
    setTimeout(() => setReactions(r => r.filter(p => p.id !== id)), 2000);
  };

  const reactionBtns = (
    <div className="flex gap-1.5 flex-shrink-0">
      {["🔥", "💃", "🎵"].map(e => (
        <button key={e} onClick={() => fireReaction(e)}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all active:scale-75"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {e}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {reactions.map(r => (
        <div key={r.id} className="fixed bottom-24 text-3xl pointer-events-none z-[60]"
          style={{ left: `${r.x}%`, animation: "reactionFloat 2s ease-out forwards" }}>{r.emoji}</div>
      ))}
      <PartyRoomShell
        roomName="DJ BOOTH"
        roomSubtitle="라이브 DJ 파티"
        backHref="/rooms/dj"
        accentColor={ACCENT}
        participantCount={89}
        panelTitle="🎵 DJ 부스"
        panelContent={<DJPanelContent />}
        extraBarControls={reactionBtns}
      />
      <style>{`@keyframes reactionFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-120px) scale(1.5)}}`}</style>
    </>
  );
}
