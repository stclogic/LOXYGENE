"use client";

import { useEffect, useRef, useState } from "react";

interface ReactiveBackgroundProps {
  beatDetected?: boolean;
  currentBPM?: number;
  isSomeoneSinging?: boolean;
  lastGiftType?: "bouquet" | "champagne" | null;
}

interface Ring {
  id: number;
  color: "cyan" | "pink";
  ts: number;
}

export default function ReactiveBackground({
  beatDetected = false,
  currentBPM = 0,
  isSomeoneSinging = false,
  lastGiftType = null,
}: ReactiveBackgroundProps) {
  const [rings, setRings] = useState<Ring[]>([]);
  const ringIdRef = useRef(0);
  const prevGiftRef = useRef<typeof lastGiftType>(null);

  // Beat rings
  useEffect(() => {
    if (!beatDetected) return;
    const id = ++ringIdRef.current;
    const color: Ring["color"] = id % 2 === 0 ? "cyan" : "pink";
    setRings(prev => [...prev, { id, color, ts: Date.now() }]);
    const cleanup = setTimeout(() => {
      setRings(prev => prev.filter(r => r.id !== id));
    }, 650);
    return () => clearTimeout(cleanup);
  }, [beatDetected]);

  // Gift confetti burst
  useEffect(() => {
    if (!lastGiftType || lastGiftType === prevGiftRef.current) return;
    prevGiftRef.current = lastGiftType;

    import("canvas-confetti").then(({ default: confetti }) => {
      if (lastGiftType === "bouquet") {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.5, y: 0.7 },
          colors: ["#FF007F", "#FF69B4", "#FF1493", "#FFB6C1", "#ffffff"],
          scalar: 1.1,
          ticks: 120,
        });
      } else if (lastGiftType === "champagne") {
        confetti({
          particleCount: 100,
          spread: 120,
          origin: { x: 0.5, y: 0.75 },
          colors: ["#C9A84C", "#FFD700", "#FFF8DC", "#00E5FF", "#ffffff"],
          shapes: ["circle"],
          scalar: 0.9,
          ticks: 150,
        });
      }
    }).catch(() => null);
  }, [lastGiftType]);

  // BPM intensity: brighter glow blobs at higher BPM
  const bpmFactor = Math.min(1, currentBPM / 140);
  const blobOpacity = isSomeoneSinging ? 0.12 + bpmFactor * 0.08 : 0.07;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>

      {/* Cyan blob — top left */}
      <div
        className="absolute rounded-full"
        style={{
          width: 480, height: 480,
          top: -80, left: -80,
          background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)",
          opacity: blobOpacity,
          filter: "blur(80px)",
          animation: "float-blob 14s ease-in-out infinite",
          transition: "opacity 1s ease",
        }}
      />

      {/* Pink blob — bottom right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 480, height: 480,
          bottom: -80, right: -80,
          background: "radial-gradient(circle, #FF007F 0%, transparent 70%)",
          opacity: blobOpacity * 0.85,
          filter: "blur(80px)",
          animation: "float-blob 18s ease-in-out infinite reverse",
          transition: "opacity 1s ease",
        }}
      />

      {/* Beat pulse rings */}
      {rings.map(ring => (
        <div
          key={ring.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 200, height: 200,
            marginLeft: -100, marginTop: -100,
            border: `2px solid ${ring.color === "cyan" ? "rgba(0,229,255,0.5)" : "rgba(255,0,127,0.5)"}`,
            animation: "beat-ring 0.65s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}

      <style>{`
        @keyframes beat-ring {
          0%   { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 0;   transform: scale(2.2); }
        }
      `}</style>
    </div>
  );
}
