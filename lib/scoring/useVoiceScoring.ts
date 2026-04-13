"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScoreGrade = "S" | "A" | "B" | "C" | "D";

export interface UseVoiceScoringReturn {
  // Live metrics
  currentScore: number;       // 0–100, rolling window score
  pitchAccuracy: number;      // 0–100
  rhythmAccuracy: number;     // 0–100

  // Session totals
  totalScore: number;         // cumulative average
  grade: ScoreGrade;

  // Control
  isScoring: boolean;
  startScoring: (referenceFrequency?: number) => Promise<void>;
  stopScoring: () => void;
  resetScore: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FFT_SIZE = 2048;
const SAMPLE_WINDOW_MS = 100; // score update interval
const PITCH_TOLERANCE_CENTS = 50; // ±50 cents = half semitone tolerance
const NOTE_FREQUENCIES = buildNoteFrequencies(); // A0–C8

function buildNoteFrequencies(): number[] {
  const freqs: number[] = [];
  for (let midi = 21; midi <= 108; midi++) {
    freqs.push(440 * Math.pow(2, (midi - 69) / 12));
  }
  return freqs;
}

// Autocorrelation-based pitch detection
function detectPitch(
  buffer: Float32Array,
  sampleRate: number
): number | null {
  const n = buffer.length;
  let maxCorr = 0;
  let bestPeriod = -1;

  // Compute RMS; skip silence
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return null;

  // Autocorrelation over lag range corresponding to 80–1000 Hz
  const minPeriod = Math.floor(sampleRate / 1000);
  const maxPeriod = Math.floor(sampleRate / 80);

  for (let lag = minPeriod; lag <= maxPeriod; lag++) {
    let corr = 0;
    for (let i = 0; i < n - lag; i++) corr += buffer[i] * buffer[i + lag];
    if (corr > maxCorr) {
      maxCorr = corr;
      bestPeriod = lag;
    }
  }

  if (bestPeriod === -1 || maxCorr < 0.01) return null;
  return sampleRate / bestPeriod; // Hz
}

// Distance in cents between two frequencies
function centsDiff(f1: number, f2: number): number {
  return Math.abs(1200 * Math.log2(f1 / f2));
}

// Find nearest reference note to detected pitch
function nearestNote(freq: number): number {
  return NOTE_FREQUENCIES.reduce((best, f) =>
    centsDiff(freq, f) < centsDiff(freq, best) ? f : best
  );
}

// cents error → pitch accuracy 0–100
function centsToAccuracy(cents: number): number {
  if (cents <= 10) return 100;
  if (cents >= PITCH_TOLERANCE_CENTS) return 0;
  return Math.round(100 * (1 - cents / PITCH_TOLERANCE_CENTS));
}

function scoreToGrade(score: number): ScoreGrade {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceScoring(): UseVoiceScoringReturn {
  const [currentScore, setCurrentScore] = useState(0);
  const [pitchAccuracy, setPitchAccuracy] = useState(0);
  const [rhythmAccuracy, setRhythmAccuracy] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [grade, setGrade] = useState<ScoreGrade>("D");
  const [isScoring, setIsScoring] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreHistoryRef = useRef<number[]>([]);
  const referenceFreqRef = useRef<number>(440); // default A4

  // Beat/rhythm simulation: track onset regularity
  const lastOnsetRef = useRef<number>(0);
  const onsetIntervalsRef = useRef<number[]>([]);

  const stopScoring = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => null);
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
    intervalRef.current = null;
    setIsScoring(false);
  }, []);

  const resetScore = useCallback(() => {
    scoreHistoryRef.current = [];
    onsetIntervalsRef.current = [];
    setCurrentScore(0);
    setPitchAccuracy(0);
    setRhythmAccuracy(0);
    setTotalScore(0);
    setGrade("D");
  }, []);

  const startScoring = useCallback(async (referenceFrequency = 440) => {
    stopScoring();
    referenceFreqRef.current = referenceFrequency;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      console.error("[useVoiceScoring] Microphone access denied:", err);
      return;
    }

    streamRef.current = stream;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.2;
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);

    setIsScoring(true);

    intervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatTimeDomainData(buffer);

      // ── Pitch accuracy ─────────────────────────────────────────────────
      const detectedFreq = detectPitch(buffer, ctx.sampleRate);
      let pitch = 0;
      if (detectedFreq !== null) {
        const nearest = nearestNote(detectedFreq);
        const cents = centsDiff(detectedFreq, nearest);
        pitch = centsToAccuracy(cents);

        // Rhythm: detect onset (voice start)
        const now = performance.now();
        const rms = buffer.reduce((s, v) => s + v * v, 0) / buffer.length;
        if (rms > 0.015 && now - lastOnsetRef.current > 200) {
          if (lastOnsetRef.current > 0) {
            onsetIntervalsRef.current.push(now - lastOnsetRef.current);
            if (onsetIntervalsRef.current.length > 16) onsetIntervalsRef.current.shift();
          }
          lastOnsetRef.current = now;
        }
      }

      // ── Rhythm accuracy ────────────────────────────────────────────────
      let rhythm = 50; // baseline when no rhythm data
      const intervals = onsetIntervalsRef.current;
      if (intervals.length >= 4) {
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance =
          intervals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        // Lower std deviation relative to avg = more regular rhythm
        const regularity = Math.max(0, 1 - stdDev / (avg * 0.5));
        rhythm = Math.round(regularity * 100);
      }

      // ── Combined score ─────────────────────────────────────────────────
      const combined = Math.round(pitch * 0.65 + rhythm * 0.35);
      scoreHistoryRef.current.push(combined);
      if (scoreHistoryRef.current.length > 50) scoreHistoryRef.current.shift();

      const rollingAvg =
        scoreHistoryRef.current.reduce((a, b) => a + b, 0) /
        scoreHistoryRef.current.length;

      setPitchAccuracy(pitch);
      setRhythmAccuracy(rhythm);
      setCurrentScore(combined);
      setTotalScore(Math.round(rollingAvg));
      setGrade(scoreToGrade(Math.round(rollingAvg)));
    }, SAMPLE_WINDOW_MS);
  }, [stopScoring]);

  useEffect(() => () => stopScoring(), [stopScoring]);

  return {
    currentScore,
    pitchAccuracy,
    rhythmAccuracy,
    totalScore,
    grade,
    isScoring,
    startScoring,
    stopScoring,
    resetScore,
  };
}
