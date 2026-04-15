"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalStream } from "@/components/room/ZoomVideoRoom";

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

  // Audio analysis from local stream
  const { localStream } = useLocalStream();
  const [audioIntensity, setAudioIntensity] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastStreamRef = useRef<MediaStream | null>(null);

  // ── Real audio analysis from local microphone ─────────────────────────────
  useEffect(() => {
    if (!localStream || localStream === lastStreamRef.current) return;
    lastStreamRef.current = localStream;

    // Teardown any existing context
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => null);

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(localStream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      // Normalize to 0–2 range, clamped at 1.5 for visual purposes
      const intensity = Math.min(1.5, average / 128);
      setAudioIntensity(intensity);

      // Trigger beat rings when intensity crosses threshold
      if (intensity > 0.8) {
        const id = ++ringIdRef.current;
        const color: Ring["color"] = id % 2 === 0 ? "cyan" : "pink";
        setRings(prev => [...prev, { id, color, ts: Date.now() }]);
        setTimeout(() => {
          setRings(prev => prev.filter(r => r.id !== id));
        }, 650);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Throttle to ~20fps for perf
    let frame = 0;
    const throttledTick = () => {
      if (frame++ % 3 === 0) tick();
      else rafRef.current = requestAnimationFrame(throttledTick);
    };
    rafRef.current = requestAnimationFrame(throttledTick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => null);
    };
  }, [localStream]);

  // ── Beat rings from parent props (when no local stream) ───────────────────
  useEffect(() => {
    if (!beatDetected || localStream) return; // skip if stream handles it
    const id = ++ringIdRef.current;
    const color: Ring["color"] = id % 2 === 0 ? "cyan" : "pink";
    setRings(prev => [...prev, { id, color, ts: Date.now() }]);
    const cleanup = setTimeout(() => {
      setRings(prev => prev.filter(r => r.id !== id));
    }, 650);
    return () => clearTimeout(cleanup);
  }, [beatDetected, localStream]);

  // ── Gift confetti burst ────────────────────────────────────────────────────
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

  // ── Visual intensity: prefer real audio over BPM props ────────────────────
  const bpmFactor = Math.min(1, currentBPM / 140);
  const baseBlobOpacity = isSomeoneSinging ? 0.12 + bpmFactor * 0.08 : 0.07;

  // Real audio drives intensity when available
  const intensity = localStream ? audioIntensity : (isSomeoneSinging ? 0.5 : 0);
  const blobOpacity = localStream
    ? Math.max(0.05, Math.min(0.25, 0.07 + intensity * 0.1))
    : baseBlobOpacity;
  const glowBlur = localStream ? 80 + intensity * 20 : 80;
  const blobScale = localStream ? 1 + intensity * 0.08 : 1;

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
          filter: `blur(${glowBlur}px)`,
          transform: `scale(${blobScale})`,
          animation: "float-blob 14s ease-in-out infinite",
          transition: "opacity 0.3s ease, transform 0.1s ease",
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
          filter: `blur(${glowBlur}px)`,
          transform: `scale(${blobScale})`,
          animation: "float-blob 18s ease-in-out infinite reverse",
          transition: "opacity 0.3s ease, transform 0.1s ease",
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
