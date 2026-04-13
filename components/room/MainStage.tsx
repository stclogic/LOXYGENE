"use client";

import { useEffect, useRef, useState } from "react";

interface MainStageProps {
  /** Overlaid name badge at bottom-left when singing */
  currentSinger?: string | null;
  /** Song title shown for 3s when it changes */
  songTitle?: string | null;
  /** Pulses the border cyan on each beat */
  beatDetected?: boolean;
  /** Whether screen share is active (hides default placeholder) */
  isScreenShare?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function MainStage({
  currentSinger,
  songTitle,
  beatDetected = false,
  isScreenShare = false,
  className = "",
  children,
}: MainStageProps) {
  const [showSongTitle, setShowSongTitle] = useState(false);
  const [borderGlow, setBorderGlow] = useState(false);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSongRef = useRef<string | null | undefined>(null);

  // Show title overlay for 3s when song changes
  useEffect(() => {
    if (songTitle && songTitle !== prevSongRef.current) {
      prevSongRef.current = songTitle;
      setShowSongTitle(true);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => setShowSongTitle(false), 3000);
    }
  }, [songTitle]);

  // BPM border flash
  useEffect(() => {
    if (!beatDetected) return;
    setBorderGlow(true);
    const t = setTimeout(() => setBorderGlow(false), 150);
    return () => clearTimeout(t);
  }, [beatDetected]);

  useEffect(() => () => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
  }, []);

  const borderStyle: React.CSSProperties = borderGlow
    ? { border: "1px solid rgba(0,229,255,0.8)", boxShadow: "0 0 20px rgba(0,229,255,0.35), inset 0 0 20px rgba(0,229,255,0.05)" }
    : { border: "1px solid rgba(255,255,255,0.04)", boxShadow: "none" };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black transition-all duration-150 ${className}`}
      style={borderStyle}
    >
      {/* Content */}
      {children}

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)" }} />

      {/* Song title fade overlay */}
      {showSongTitle && songTitle && (
        <div className="absolute top-4 inset-x-0 flex justify-center z-20 pointer-events-none"
          style={{ animation: "stage-fadeInOut 3s ease forwards" }}>
          <div className="px-4 py-2 rounded-full flex items-center gap-2"
            style={{ background: "rgba(7,7,7,0.75)", border: "1px solid rgba(0,229,255,0.2)", backdropFilter: "blur(12px)" }}>
            <span className="text-[#00E5FF] text-[10px] tracking-widest font-bold">♪</span>
            <span className="text-white text-sm font-semibold">{songTitle}</span>
          </div>
        </div>
      )}

      {/* Current singer badge */}
      {currentSinger && (
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(0,229,255,0.2)", backdropFilter: "blur(8px)" }}>
          <span className="text-[9px] font-bold animate-pulse"
            style={{ background: "rgba(0,229,255,0.2)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.4)", padding: "1px 5px", borderRadius: 4 }}>
            🎤 LIVE
          </span>
          <span className="text-white/90 text-xs font-semibold">{currentSinger}</span>
        </div>
      )}

      {/* Screen share indicator */}
      {isScreenShare && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.25)" }}>
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="text-[10px] text-[#00E5FF] font-medium">화면 공유 중</span>
        </div>
      )}

      <style>{`
        @keyframes stage-fadeInOut {
          0%   { opacity: 0; transform: translateY(-6px); }
          12%  { opacity: 1; transform: translateY(0); }
          75%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
