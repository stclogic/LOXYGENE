"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseBPMDetectorReturn {
  currentBPM: number;
  beatDetected: boolean;
  audioLevel: number;   // 0–1, current volume (RMS scaled)
  isAnalyzing: boolean;
  startAnalysis: (source?: MediaStream | HTMLMediaElement) => Promise<void>;
  stopAnalysis: () => void;
}

// Minimum inter-onset interval for BPM detection
const MIN_BPM = 40;
const MAX_BPM = 220;
const MIN_IOI = (60 / MAX_BPM) * 1000; // ms
const MAX_IOI = (60 / MIN_BPM) * 1000;

const FFT_SIZE = 1024;
const BEAT_THRESHOLD_RATIO = 1.35; // energy must exceed 1.35× recent average

export function useBPMDetector(): UseBPMDetectorReturn {
  const [currentBPM, setCurrentBPM] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Beat detection state
  const beatTimestampsRef = useRef<number[]>([]);
  const energyHistoryRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);
  const beatFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAnalysis = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => null);
    sourceRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current = null;
    setIsAnalyzing(false);
    setCurrentBPM(0);
    setBeatDetected(false);
    setAudioLevel(0);
  }, []);

  const startAnalysis = useCallback(async (
    source?: MediaStream | HTMLMediaElement
  ) => {
    stopAnalysis();

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.4;
    analyserRef.current = analyser;

    // Connect source
    if (source instanceof MediaStream) {
      const node = ctx.createMediaStreamSource(source);
      node.connect(analyser);
      sourceRef.current = node;
    } else if (source instanceof HTMLMediaElement) {
      const node = ctx.createMediaElementSource(source);
      node.connect(analyser);
      node.connect(ctx.destination); // pass-through so audio still plays
      sourceRef.current = node;
    } else {
      // Default: microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const node = ctx.createMediaStreamSource(stream);
        node.connect(analyser);
        sourceRef.current = node;
      } catch (err) {
        console.error("[useBPMDetector] Microphone access denied:", err);
        ctx.close().catch(() => null);
        return;
      }
    }

    setIsAnalyzing(true);

    const buffer = new Float32Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatTimeDomainData(buffer);

      // RMS energy
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
      const rms = Math.sqrt(sumSq / buffer.length);

      // Expose audio level (0–1), scaled so typical voice ≈ 0.3–0.7
      setAudioLevel(Math.min(1, rms * 8));

      // Maintain rolling energy history (last 43 frames ≈ ~1s at 60fps)
      energyHistoryRef.current.push(rms);
      if (energyHistoryRef.current.length > 43) energyHistoryRef.current.shift();

      const avgEnergy =
        energyHistoryRef.current.reduce((a, b) => a + b, 0) /
        energyHistoryRef.current.length;

      const now = performance.now();
      const timeSinceLast = now - lastBeatTimeRef.current;

      // Beat onset: current energy significantly exceeds recent average
      if (
        rms > avgEnergy * BEAT_THRESHOLD_RATIO &&
        rms > 0.01 && // ignore silence
        timeSinceLast > MIN_IOI
      ) {
        lastBeatTimeRef.current = now;
        beatTimestampsRef.current.push(now);

        // Keep only last 8 beats for BPM calculation
        if (beatTimestampsRef.current.length > 8) beatTimestampsRef.current.shift();

        // Calculate BPM from inter-beat intervals
        if (beatTimestampsRef.current.length >= 3) {
          const stamps = beatTimestampsRef.current;
          const intervals: number[] = [];
          for (let i = 1; i < stamps.length; i++) {
            const ioi = stamps[i] - stamps[i - 1];
            if (ioi >= MIN_IOI && ioi <= MAX_IOI) intervals.push(ioi);
          }
          if (intervals.length > 0) {
            const avgIOI = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const bpm = Math.round(60000 / avgIOI);
            setCurrentBPM(Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)));
          }
        }

        // Flash beatDetected for ~80ms
        setBeatDetected(true);
        if (beatFlashTimerRef.current) clearTimeout(beatFlashTimerRef.current);
        beatFlashTimerRef.current = setTimeout(() => setBeatDetected(false), 80);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [stopAnalysis]);

  // Cleanup on unmount
  useEffect(() => () => {
    stopAnalysis();
    if (beatFlashTimerRef.current) clearTimeout(beatFlashTimerRef.current);
  }, [stopAnalysis]);

  return { currentBPM, beatDetected, audioLevel, isAnalyzing, startAnalysis, stopAnalysis };
}
