"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

type Tab = "audio" | "video" | "eq" | "lighting" | "display" | "diagnostics" | "updates" | "theme";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
      {children}
    </p>
  );
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className="relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200"
      style={{
        background: checked ? (disabled ? "rgba(0,229,255,0.35)" : "#00E5FF") : "rgba(255,255,255,0.1)",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: checked && !disabled ? "0 0 8px rgba(0,229,255,0.3)" : "none",
      }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

function Slider({ value, onChange, min = 0, max = 100, step = 1 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative h-5 flex items-center w-full">
      <div className="w-full h-1 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right, rgba(0,229,255,0.5), #00E5FF)" }} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cp-slider absolute inset-0 w-full opacity-0 cursor-pointer h-5" />
      <div className="absolute w-3.5 h-3.5 rounded-full pointer-events-none border-2"
        style={{ left: `calc(${pct}% - 7px)`, background: "#070707", borderColor: "#00E5FF", boxShadow: "0 0 6px rgba(0,229,255,0.5)" }} />
    </div>
  );
}

function ControlRow({ label, note, control }: { label: string; note?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="min-w-0">
        <span className="text-sm text-white/75">{label}</span>
        {note && <p className="text-[10px] text-white/30 mt-0.5">{note}</p>}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}

function SegmentButtons({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className="px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0"
          style={value === o
            ? { background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }
            : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 1: Audio
// ─────────────────────────────────────────────────────────────

function AudioTab() {
  const [inputDevice, setInputDevice] = useState("Blue Yeti USB Microphone");
  const [outputDevice, setOutputDevice] = useState("MacBook Pro 스피커");
  const [inputVol, setInputVol] = useState(75);
  const [gain, setGain] = useState(50);
  const [noiseCancel, setNoiseCancel] = useState(true);
  const [noiseLv, setNoiseLv] = useState(60);
  const [echoCancel, setEchoCancel] = useState(true);
  const [voiceEnhance, setVoiceEnhance] = useState(false);
  const [voiceMode, setVoiceMode] = useState("자연스러운");
  const [outputVol, setOutputVol] = useState(80);
  const [balance, setBalance] = useState(50);
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [vcOn, setVcOn] = useState(false);
  const [vcPreset, setVcPreset] = useState("원본");
  const [pitch, setPitch] = useState(0);
  const [reverb, setReverb] = useState(20);
  const [micLevel, setMicLevel] = useState(0);
  const [testing, setTesting] = useState(false);

  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const inputDevices = ["Blue Yeti USB Microphone", "MacBook Pro 내장 마이크", "AirPods Pro", "Echo Mic V2 (L'Oxygène 전용)"];
  const outputDevices = ["MacBook Pro 스피커", "외장 스피커 (USB)", "AirPods Pro", "HDMI 출력"];
  const vcPresets = [{ id: "원본", icon: "🎤" }, { id: "로봇", icon: "🤖" }, { id: "중저음", icon: "👨" }, { id: "고음", icon: "👩" }, { id: "마스킹", icon: "🎭" }, { id: "에코홀", icon: "🌊" }];

  const getDeviceBadge = (n: string) =>
    n.includes("USB") ? { label: "USB", color: "#00E5FF" } :
    n.includes("AirPods") ? { label: "Bluetooth", color: "#a78bfa" } :
    { label: "내장", color: "rgba(255,255,255,0.4)" };
  const badge = getDeviceBadge(inputDevice);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setMicLevel(Math.min(100, (avg / 128) * 100));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        let v = 0;
        const mock = () => {
          v = Math.max(0, Math.min(100, v + (Math.random() - 0.48) * 12));
          setMicLevel(v);
          rafRef.current = requestAnimationFrame(mock);
        };
        rafRef.current = requestAnimationFrame(mock);
      }
    })();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => null);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>입력 장치</SectionTitle>
        <div className="flex flex-col gap-4">
          <select value={inputDevice} onChange={e => setInputDevice(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none cursor-pointer"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {inputDevices.map(d => <option key={d} value={d} style={{ background: "#111" }}>{d}</option>)}
          </select>

          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <span className="text-sm font-medium text-white/85 truncate">{inputDevice}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                style={{ background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}40` }}>
                {badge.label}
              </span>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] text-white/40">입력 신호</span>
                <span className="text-[10px] text-[#00E5FF]/70">{Math.round(micLevel)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-[width] duration-75"
                  style={{ width: `${micLevel}%`, background: micLevel > 85 ? "#FF007F" : micLevel > 60 ? "#00E5FF" : "#22c55e", boxShadow: `0 0 6px ${micLevel > 85 ? "#FF007F" : "#22c55e"}` }} />
              </div>
            </div>
            <button onClick={() => { setTesting(true); setTimeout(() => setTesting(false), 3000); }}
              className="self-start px-4 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
              style={{ background: testing ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(0,229,255,0.25)", color: testing ? "#00E5FF" : "rgba(255,255,255,0.5)" }}>
              {testing ? "🔴 녹음 중... (3초)" : "테스트"}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between"><span className="text-sm text-white/75">입력 볼륨</span><span className="text-xs text-[#00E5FF]">{inputVol}%</span></div>
            <Slider value={inputVol} onChange={setInputVol} />
            <div className="flex justify-between"><span className="text-sm text-white/75">게인 (Gain)</span><span className="text-xs text-[#00E5FF]">{gain}%</span></div>
            <Slider value={gain} onChange={setGain} />
          </div>

          <ControlRow label="노이즈 캔슬링" control={<Toggle checked={noiseCancel} onChange={setNoiseCancel} />} />
          {noiseCancel && (
            <div className="pb-2 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>약함</span><span>보통</span><span>강함</span></div>
              <Slider value={noiseLv} onChange={setNoiseLv} />
            </div>
          )}
          <ControlRow label="에코 제거" control={<Toggle checked={echoCancel} onChange={setEchoCancel} />} />
          <ControlRow label="음성 향상" control={<Toggle checked={voiceEnhance} onChange={setVoiceEnhance} />} />
          {voiceEnhance && (
            <div className="pb-2">
              <SegmentButtons options={["자연스러운", "방송용", "ASMR", "파티"]} value={voiceMode} onChange={setVoiceMode} />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>출력 장치</SectionTitle>
        <div className="flex flex-col gap-4">
          <select value={outputDevice} onChange={e => setOutputDevice(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {outputDevices.map(d => <option key={d} value={d} style={{ background: "#111" }}>{d}</option>)}
          </select>
          <div>
            <div className="flex justify-between mb-2"><span className="text-sm text-white/75">출력 볼륨</span><span className="text-xs text-[#00E5FF]">{outputVol}%</span></div>
            <Slider value={outputVol} onChange={setOutputVol} />
          </div>
          <div>
            <div className="flex justify-between mb-1 text-[10px] text-white/35"><span>◀ L</span><span>밸런스</span><span>R ▶</span></div>
            <Slider value={balance} onChange={setBalance} />
          </div>
          <ControlRow label="공간음향 (Spatial Audio)" control={<Toggle checked={spatialAudio} onChange={setSpatialAudio} />} />
          <button className="self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            ▶ 테스트 사운드
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle>음성 변조 (Voice Changer)</SectionTitle>
          <Toggle checked={vcOn} onChange={setVcOn} />
        </div>
        {vcOn && (
          <div className="flex flex-col gap-4 mt-3">
            <div className="grid grid-cols-3 gap-2">
              {vcPresets.map(p => (
                <button key={p.id} onClick={() => setVcPreset(p.id)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs transition-all active:scale-95"
                  style={vcPreset === p.id
                    ? { background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}>
                  <span className="text-lg">{p.icon}</span>
                  <span>{p.id}</span>
                </button>
              ))}
            </div>
            <div>
              <div className="flex justify-between mb-2"><span className="text-sm text-white/75">피치 조절</span><span className="text-xs text-[#00E5FF]">{pitch > 0 ? `+${pitch}` : pitch} st</span></div>
              <Slider value={pitch + 12} onChange={v => setPitch(v - 12)} min={0} max={24} />
            </div>
            <div>
              <div className="flex justify-between mb-2"><span className="text-sm text-white/75">리버브</span><span className="text-xs text-[#00E5FF]">{reverb}%</span></div>
              <Slider value={reverb} onChange={setReverb} />
            </div>
            <button className="self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all active:scale-95"
              style={{ background: "rgba(255,0,127,0.08)", border: "1px solid rgba(255,0,127,0.25)", color: "#FF007F" }}>
              ▶ 미리 듣기
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 2: Video
// ─────────────────────────────────────────────────────────────

function VideoTab() {
  const [camera, setCamera] = useState("FaceTime HD Camera");
  const [mirrored, setMirrored] = useState(true);
  const [aspect, setAspect] = useState("16:9");
  const [resolution, setResolution] = useState("1080p");
  const [fps, setFps] = useState("30fps");
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [saturation, setSaturation] = useState(50);
  const [sharpness, setSharpness] = useState(50);
  const [beautyOn, setBeautyOn] = useState(false);
  const [skinSmooth, setSkinSmooth] = useState(50);
  const [whitening, setWhitening] = useState(30);
  const [eyeCorrect, setEyeCorrect] = useState(false);
  const [autoHDR, setAutoHDR] = useState(true);
  const [vbgOn, setVbgOn] = useState(false);
  const [vbg, setVbg] = useState("없음");
  const [bgBlur, setBgBlur] = useState(40);
  const [hasStream, setHasStream] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cameras = ["FaceTime HD Camera", "4K Pro 웹캠 (L'Oxygène)", "iPhone 카메라 (연속성)"];
  const backgrounds = [
    { id: "없음", icon: "❌" }, { id: "도시 야경", icon: "🌃" }, { id: "럭셔리 바", icon: "🥂" },
    { id: "스튜디오", icon: "🎵" }, { id: "벚꽃", icon: "🌸" }, { id: "Black 라운지", icon: "🖤", vvip: true },
  ];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setHasStream(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { /* no cam */ }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const filterStyle = `brightness(${0.5 + brightness / 100}) contrast(${0.5 + contrast / 100}) saturate(${saturation / 50}) blur(${sharpness < 50 ? (50 - sharpness) / 50 : 0}px)`;
  const aspectClass = aspect === "1:1" ? "aspect-square" : aspect === "4:3" ? "" : "";
  const aspectRatioVal = aspect === "1:1" ? "1" : aspect === "4:3" ? "4/3" : "16/9";

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>카메라 선택</SectionTitle>
        <div className="flex flex-col gap-4">
          <select value={camera} onChange={e => setCamera(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {cameras.map(c => <option key={c} value={c} style={{ background: "#111" }}>{c}</option>)}
          </select>

          <div className={`relative rounded-xl overflow-hidden bg-black ${aspectClass}`} style={{ aspectRatio: aspectRatioVal }}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"
              style={{ transform: mirrored ? "scaleX(-1)" : "none", filter: filterStyle }} />
            {!hasStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: "rgba(0,0,0,0.7)" }}>
                <span className="text-4xl">📷</span>
                <span className="text-xs text-white/30">카메라 없음 또는 권한 필요</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <button onClick={() => setMirrored(!mirrored)}
                className="px-2.5 py-1.5 rounded-lg text-[10px] transition-all backdrop-blur-sm"
                style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
                🪞 {mirrored ? "ON" : "OFF"}
              </button>
              <div className="flex gap-1">
                {["16:9", "4:3", "1:1"].map(a => (
                  <button key={a} onClick={() => setAspect(a)}
                    className="px-2 py-1 rounded text-[10px] font-medium"
                    style={aspect === a ? { background: "rgba(0,229,255,0.35)", color: "#00E5FF" } : { background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.45)" }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-white/35 mb-2">해상도</p>
              <SegmentButtons options={["720p", "1080p", "4K"]} value={resolution} onChange={setResolution} />
            </div>
            <div>
              <p className="text-[10px] text-white/35 mb-2">프레임레이트</p>
              <SegmentButtons options={["24fps", "30fps", "60fps"]} value={fps} onChange={setFps} />
            </div>
          </div>

          {[
            { label: "밝기", v: brightness, set: setBrightness },
            { label: "대비", v: contrast, set: setContrast },
            { label: "채도", v: saturation, set: setSaturation },
            { label: "선명도", v: sharpness, set: setSharpness },
          ].map(({ label, v, set }) => (
            <div key={label}>
              <div className="flex justify-between mb-1"><span className="text-sm text-white/75">{label}</span><span className="text-xs text-[#00E5FF]">{v}</span></div>
              <Slider value={v} onChange={set} />
            </div>
          ))}
          <button onClick={() => { setBrightness(50); setContrast(50); setSaturation(50); setSharpness(50); }}
            className="self-start px-4 py-2 rounded-lg text-xs transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            기본값으로 초기화
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle>뷰티 필터</SectionTitle>
          <Toggle checked={beautyOn} onChange={setBeautyOn} />
        </div>
        {beautyOn && (
          <div className="flex flex-col gap-4 mt-3">
            {[{ label: "피부 보정", v: skinSmooth, set: setSkinSmooth }, { label: "화이트닝", v: whitening, set: setWhitening }].map(({ label, v, set }) => (
              <div key={label}>
                <div className="flex justify-between mb-1"><span className="text-sm text-white/75">{label}</span><span className="text-xs text-[#00E5FF]">{v}%</span></div>
                <Slider value={v} onChange={set} />
              </div>
            ))}
            <ControlRow label="눈 보정" control={<Toggle checked={eyeCorrect} onChange={setEyeCorrect} />} />
            <ControlRow label="자동 HDR" control={<Toggle checked={autoHDR} onChange={setAutoHDR} />} />
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle>가상 배경</SectionTitle>
          <Toggle checked={vbgOn} onChange={setVbgOn} />
        </div>
        {vbgOn && (
          <div className="flex flex-col gap-4 mt-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {backgrounds.map(b => (
                <button key={b.id} onClick={() => !b.vvip && setVbg(b.id)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs transition-all active:scale-95"
                  style={b.vvip
                    ? { background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", cursor: "not-allowed" }
                    : vbg === b.id
                    ? { background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}>
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-center leading-tight">{b.id}</span>
                  {b.vvip && <span className="text-[8px] font-bold">VVIP</span>}
                </button>
              ))}
              <button className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.3)" }}>
                <span className="text-xl">+</span>
                <span>커스텀</span>
              </button>
            </div>
            <div>
              <div className="flex justify-between mb-1"><span className="text-sm text-white/75">배경 블러</span><span className="text-xs text-[#00E5FF]">{bgBlur}%</span></div>
              <Slider value={bgBlur} onChange={setBgBlur} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 3: Equalizer
// ─────────────────────────────────────────────────────────────

const EQ_BANDS = ["32Hz", "64Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "16kHz"];
const EQ_PRESETS: Record<string, number[]> = {
  "플랫":          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "보컬 강조":     [0, 0, 0, 2, 3, 5, 5, 4, 2, 0],
  "라이브":        [5, 4, 2, 0, -1, 0, 2, 3, 5, 6],
  "클래식":        [0, 0, 0, 0, 0, 2, 2, 3, 4, 5],
  "베이스 부스트": [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  "팟캐스트":      [-2, -2, 0, 3, 4, 3, 2, 0, -1, -2],
  "노래방":        [2, 2, 1, 3, 4, 3, 2, 1, 0, -1],
  "VVIP 시그니처": [4, 3, 1, 0, 2, 4, 5, 4, 3, 2],
};
const EQ_PRESET_ICONS: Record<string, string> = {
  "플랫": "🎵", "보컬 강조": "🎤", "라이브": "🎸", "클래식": "🎹",
  "베이스 부스트": "🔊", "팟캐스트": "🎧", "노래방": "🏠", "VVIP 시그니처": "✨",
};

function EQTab() {
  const [bands, setBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [compOn, setCompOn] = useState(false);
  const [compExpanded, setCompExpanded] = useState(false);
  const [threshold, setThreshold] = useState(-24);
  const [ratio, setRatio] = useState(4);
  const [attack, setAttack] = useState(20);
  const [release, setRelease] = useState(250);
  const [makeupGain, setMakeupGain] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mockPhaseRef = useRef(0);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const drawLoop = (useMock: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;
      const data = new Uint8Array(analyserRef.current?.frequencyBinCount ?? 128);
      const draw = () => {
        const W = canvas.width, H = canvas.height;
        ctx2d.clearRect(0, 0, W, H);
        if (!useMock && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(data);
        } else {
          mockPhaseRef.current += 0.04;
          for (let i = 0; i < data.length; i++) {
            data[i] = Math.max(0, Math.min(255,
              70 + Math.sin(i * 0.3 + mockPhaseRef.current) * 45 +
              Math.sin(i * 0.08 + mockPhaseRef.current * 0.6) * 30 + Math.random() * 18));
          }
        }
        const barCount = Math.min(data.length, 80);
        const barW = W / barCount - 1;
        for (let i = 0; i < barCount; i++) {
          const val = data[Math.floor(i * data.length / barCount)] / 255;
          const h = val * H * 0.88;
          const x = i * (barW + 1);
          const grad = ctx2d.createLinearGradient(0, H, 0, H - h);
          grad.addColorStop(0, "rgba(0,229,255,0.9)");
          grad.addColorStop(0.5, "rgba(0,229,255,0.4)");
          grad.addColorStop(1, "rgba(0,229,255,0.05)");
          ctx2d.fillStyle = grad;
          ctx2d.beginPath();
          ctx2d.roundRect(x, H - h, barW, h, 1);
          ctx2d.fill();
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    };

    (async () => {
      let useMock = false;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;
        ctx.createMediaStreamSource(stream).connect(analyser);
      } catch { useMock = true; }
      drawLoop(useMock);
    })();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => null);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const setBand = useCallback((i: number, v: number) => {
    setBands(prev => { const next = [...prev]; next[i] = v; return next; });
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>10밴드 이퀄라이저</SectionTitle>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 -mx-1 px-1 mb-5">
          {Object.keys(EQ_PRESETS).map(name => (
            <button key={name} onClick={() => setBands([...EQ_PRESETS[name]])}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:border-[#00E5FF]/40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              <span>{EQ_PRESET_ICONS[name]}</span><span>{name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-10 gap-1 sm:gap-2">
          {EQ_BANDS.map((band, i) => (
            <div key={band} className="flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-mono h-5 flex items-center"
                style={{ color: bands[i] >= 0 ? "#00E5FF" : "#FF007F" }}>
                {bands[i] > 0 ? `+${bands[i]}` : bands[i]}
              </span>
              <div className="relative flex items-center justify-center" style={{ height: 140 }}>
                <div className="absolute w-1 rounded-full" style={{ height: "100%", background: "rgba(255,255,255,0.05)" }} />
                <div className="absolute w-0.5 rounded-full"
                  style={{
                    height: `${(Math.abs(bands[i]) / 12) * 48}%`,
                    ...(bands[i] >= 0 ? { bottom: "50%" } : { top: "50%" }),
                    background: bands[i] >= 0 ? "#00E5FF" : "#FF007F",
                    boxShadow: `0 0 5px ${bands[i] >= 0 ? "rgba(0,229,255,0.6)" : "rgba(255,0,127,0.6)"}`,
                  }} />
                <div className="absolute w-3 h-3 rounded-full border-2 pointer-events-none"
                  style={{
                    top: `calc(50% - ${(bands[i] / 12) * 48}% - 6px)`,
                    background: "#070707",
                    borderColor: bands[i] >= 0 ? "#00E5FF" : "#FF007F",
                    boxShadow: `0 0 4px ${bands[i] >= 0 ? "rgba(0,229,255,0.7)" : "rgba(255,0,127,0.7)"}`,
                  }} />
                <input type="range" min={-12} max={12} step={1} value={bands[i]}
                  onChange={e => setBand(i, Number(e.target.value))}
                  className="eq-vslider"
                  style={{ position: "absolute", width: 140, height: 20, cursor: "pointer" }} />
              </div>
              <span className="text-[8px] text-white/25 text-center leading-tight">{band}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-3">
          <span className="text-[9px] text-white/15">−12 dB ←──────────── 0 ────────────→ +12 dB</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>실시간 스펙트럼 분석</SectionTitle>
        <canvas ref={canvasRef} width={800} height={100} className="w-full rounded-xl"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,229,255,0.07)" }} />
      </Card>

      <Card>
        <button onClick={() => setCompExpanded(!compExpanded)}
          className="flex items-center justify-between w-full mb-1">
          <SectionTitle>컴프레서</SectionTitle>
          <div className="flex items-center gap-3">
            <Toggle checked={compOn} onChange={e => { setCompOn(e); e && setCompExpanded(true); }} />
            <Icon icon={compExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
              className="w-4 h-4 text-white/30" />
          </div>
        </button>
        {compExpanded && (
          <div className="flex flex-col gap-4 mt-3">
            {[
              { label: "임계값 (Threshold)", v: threshold, set: setThreshold, min: -60, max: 0, unit: "dB" },
              { label: "비율 (Ratio)", v: ratio, set: setRatio, min: 1, max: 20, unit: ":1" },
              { label: "어택 (Attack)", v: attack, set: setAttack, min: 0, max: 200, unit: "ms" },
              { label: "릴리즈 (Release)", v: release, set: setRelease, min: 0, max: 1000, unit: "ms" },
              { label: "메이크업 게인", v: makeupGain, set: setMakeupGain, min: 0, max: 24, unit: "dB" },
            ].map(({ label, v, set, min, max, unit }) => (
              <div key={label}>
                <div className="flex justify-between mb-1"><span className="text-sm text-white/75">{label}</span><span className="text-xs text-[#00E5FF]">{v}{unit}</span></div>
                <Slider value={v} onChange={set} min={min} max={max} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 4: Lighting
// ─────────────────────────────────────────────────────────────

function LightingTab() {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lightMode, setLightMode] = useState("분위기");
  const [ambientColor, setAmbientColor] = useState("#00E5FF");
  const [brightness, setBrightness] = useState(70);
  const [colorTemp, setColorTemp] = useState(50);
  const [bpmSens, setBpmSens] = useState(60);
  const [bpmEffect, setBpmEffect] = useState("Pulse");
  const [minBright, setMinBright] = useState(20);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [keyLight, setKeyLight] = useState(75);
  const [fillLight, setFillLight] = useState(40);

  const devices = [
    { name: "L'Sync LED Strip #1", status: "connected" },
    { name: "L'Sync Spotlight #2", status: "connected" },
    { name: "스마트 전구 (거실)", status: "standby" },
  ];
  const lightModes = [
    { id: "음악 싱크", icon: "🎵", desc: "BPM 반응" },
    { id: "분위기", icon: "🎨", desc: "Ambient" },
    { id: "파티", icon: "🎉", desc: "Random flash" },
    { id: "집중", icon: "🕯️", desc: "Steady warm" },
    { id: "Black 모드", icon: "🖤", desc: "Ultra dim gold" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>스마트 조명 연동</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-sm text-white/80">{connected ? "연결됨 (3개 장치)" : scanning ? "L'Sync 검색 중..." : "장치 없음"}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Bluetooth / WiFi</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: connected ? "#22c55e" : scanning ? "#C9A84C" : "rgba(255,255,255,0.15)" }} />
              <button onClick={() => { setScanning(true); setTimeout(() => { setScanning(false); setConnected(true); }, 2200); }}
                disabled={scanning || connected}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
                style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF", opacity: (scanning || connected) ? 0.55 : 1 }}>
                {scanning ? "검색중..." : connected ? "연결됨 ✅" : "조명 검색"}
              </button>
            </div>
          </div>
          {connected && devices.map(d => (
            <div key={d.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2"><span>💡</span><span className="text-xs text-white/70">{d.name}</span></div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.status === "connected" ? "#22c55e" : "#C9A84C" }} />
                <span className="text-[10px]" style={{ color: d.status === "connected" ? "#22c55e" : "#C9A84C" }}>
                  {d.status === "connected" ? "연결됨" : "대기중"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>조명 모드</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {lightModes.map(m => (
            <button key={m.id} onClick={() => setLightMode(m.id)}
              className="flex flex-col items-start gap-1.5 p-4 rounded-xl transition-all active:scale-95"
              style={lightMode === m.id
                ? { background: m.id === "Black 모드" ? "rgba(201,168,76,0.1)" : "rgba(0,229,255,0.1)", border: `1px solid ${m.id === "Black 모드" ? "rgba(201,168,76,0.4)" : "rgba(0,229,255,0.4)"}`, color: m.id === "Black 모드" ? "#C9A84C" : "#00E5FF" }
                : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs font-medium">{m.id}</span>
              <span className="text-[9px] opacity-55">{m.desc}</span>
            </button>
          ))}
        </div>

        {lightMode === "분위기" && (
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/75">색상</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-white/20" style={{ background: ambientColor }} />
                <input type="color" value={ambientColor} onChange={e => setAmbientColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer bg-transparent border-0" />
              </div>
            </div>
            <div><div className="flex justify-between mb-1"><span className="text-sm text-white/75">밝기</span><span className="text-xs text-[#00E5FF]">{brightness}%</span></div><Slider value={brightness} onChange={setBrightness} /></div>
            <div><div className="flex justify-between mb-1 text-[10px] text-white/30"><span>따뜻한</span><span>색온도</span><span>차가운</span></div><Slider value={colorTemp} onChange={setColorTemp} /></div>
          </div>
        )}

        {lightMode === "음악 싱크" && (
          <div className="mt-5 flex flex-col gap-4">
            <div><div className="flex justify-between mb-1"><span className="text-sm text-white/75">감도</span><span className="text-xs text-[#00E5FF]">{bpmSens}%</span></div><Slider value={bpmSens} onChange={setBpmSens} /></div>
            <div>
              <p className="text-[10px] text-white/35 mb-2">이펙트 타입</p>
              <SegmentButtons options={["Pulse", "Strobe", "Wave", "Rainbow"]} value={bpmEffect} onChange={setBpmEffect} />
            </div>
            <div><div className="flex justify-between mb-1"><span className="text-sm text-white/75">최소 밝기 (안전)</span><span className="text-xs text-[#00E5FF]">{minBright}%</span></div><Slider value={minBright} onChange={setMinBright} /></div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>웹캠 조명 최적화</SectionTitle>
        <div className="flex flex-col gap-4">
          <ControlRow label="자동 조명 보정" control={<Toggle checked={autoCorrect} onChange={setAutoCorrect} />} />
          <div><div className="flex justify-between mb-1"><span className="text-sm text-white/75">키 라이트 강도</span><span className="text-xs text-[#00E5FF]">{keyLight}%</span></div><Slider value={keyLight} onChange={setKeyLight} /></div>
          <div><div className="flex justify-between mb-1"><span className="text-sm text-white/75">필 라이트</span><span className="text-xs text-[#00E5FF]">{fillLight}%</span></div><Slider value={fillLight} onChange={setFillLight} /></div>
          <button className="self-start px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            조명 테스트 ⚡
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 5: Display
// ─────────────────────────────────────────────────────────────

function DisplayTab() {
  const [uiSize, setUiSize] = useState("Medium");
  const [animEffects, setAnimEffects] = useState(true);
  const [effectIntensity, setEffectIntensity] = useState(70);
  const [chatPos, setChatPos] = useState("오른쪽");
  const [participantPos, setParticipantPos] = useState("하단");
  const [queuePos, setQueuePos] = useState("오른쪽");
  const [theme, setTheme] = useState("네온 사이버");
  const [subtitles, setSubtitles] = useState(false);
  const [subSize, setSubSize] = useState("Medium");
  const [subPos, setSubPos] = useState("하단");
  const [subOpacity, setSubOpacity] = useState(70);

  const themes = [
    { id: "네온 사이버", icon: "🌊", c1: "#00E5FF", c2: "#FF007F" },
    { id: "파이어", icon: "🔥", c1: "#FF6B00", c2: "#FF0000" },
    { id: "퍼플 드림", icon: "💜", c1: "#9B59B6", c2: "#D7BEE8" },
    { id: "네이처", icon: "🌿", c1: "#00B894", c2: "#00CEC9" },
    { id: "모노크롬", icon: "🖤", c1: "#FFFFFF", c2: "#888888" },
    { id: "VVIP 골드", icon: "✨", c1: "#C9A84C", c2: "#FFD700" },
  ];

  const layoutOpts = [
    { label: "채팅창 위치", v: chatPos, set: setChatPos, opts: ["오른쪽", "왼쪽", "숨김"] },
    { label: "참여자 패널", v: participantPos, set: setParticipantPos, opts: ["하단", "오른쪽", "숨김"] },
    { label: "대기열 패널", v: queuePos, set: setQueuePos, opts: ["오른쪽", "왼쪽", "숨김"] },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>화면 설정</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-xs text-white/40">감지된 해상도</span>
            <span className="text-xs font-mono text-[#00E5FF]">2560 × 1600 (Retina)</span>
          </div>
          <div>
            <p className="text-[10px] text-white/35 mb-2">UI 크기</p>
            <SegmentButtons options={["Small", "Medium", "Large", "Extra Large"]} value={uiSize} onChange={setUiSize} />
          </div>
          <ControlRow label="애니메이션 효과" note="모션 감소시 배터리 절약" control={<Toggle checked={animEffects} onChange={setAnimEffects} />} />
          <div>
            <div className="flex justify-between mb-1"><span className="text-sm text-white/75">화면 효과 강도</span><span className="text-xs text-[#00E5FF]">{effectIntensity}%</span></div>
            <Slider value={effectIntensity} onChange={setEffectIntensity} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>레이아웃 설정</SectionTitle>
        <div className="flex flex-col gap-4">
          {layoutOpts.map(({ label, v, set, opts }) => (
            <div key={label} className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm text-white/75 flex-shrink-0">{label}</span>
              <SegmentButtons options={opts} value={v} onChange={set} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>색상 테마</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {themes.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
              style={theme === t.id
                ? { background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.35)" }
                : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <div>
                <p className="text-xs font-medium text-white/80">{t.id}</p>
                <div className="flex gap-1 mt-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: t.c1 }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: t.c2 }} />
                </div>
              </div>
            </button>
          ))}
        </div>
        <button className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
          테마 적용
        </button>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle>자막 설정</SectionTitle>
          <Toggle checked={subtitles} onChange={setSubtitles} />
        </div>
        {subtitles && (
          <div className="flex flex-col gap-4 mt-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm text-white/75">자막 크기</span>
              <SegmentButtons options={["Small", "Medium", "Large"]} value={subSize} onChange={setSubSize} />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm text-white/75">자막 위치</span>
              <SegmentButtons options={["상단", "하단"]} value={subPos} onChange={setSubPos} />
            </div>
            <div>
              <div className="flex justify-between mb-1"><span className="text-sm text-white/75">배경 불투명도</span><span className="text-xs text-[#00E5FF]">{subOpacity}%</span></div>
              <Slider value={subOpacity} onChange={setSubOpacity} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 6: Diagnostics
// ─────────────────────────────────────────────────────────────

interface DiagItem { label: string; status: "ok" | "warn" | "error"; detail: string; }

const DIAG_LIST: DiagItem[] = [
  { label: "인터넷 연결 확인", status: "ok", detail: "완료 (ping: 12ms)" },
  { label: "카메라 접근 권한", status: "ok", detail: "허용됨" },
  { label: "마이크 접근 권한", status: "ok", detail: "허용됨" },
  { label: "Zoom SDK 상태", status: "ok", detail: "데모 모드" },
  { label: "Supabase 연결", status: "warn", detail: "미설정 (데모 모드)" },
  { label: "YouTube API", status: "ok", detail: "응답 정상" },
  { label: "오디오 컨텍스트", status: "ok", detail: "정상" },
  { label: "WebRTC 지원", status: "ok", detail: "지원됨" },
  { label: "브라우저 호환성", status: "ok", detail: "Chrome 최신버전" },
];

function DiagnosticsTab() {
  const [visible, setVisible] = useState<DiagItem[]>([]);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [speedDone, setSpeedDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setVisible([]);
    DIAG_LIST.forEach((item, i) => {
      setTimeout(() => setVisible(prev => [...prev, item]), (i + 1) * 220);
    });
  }, []);

  const caps = [
    { label: "WebRTC", ok: true }, { label: "WebAudio API", ok: true },
    { label: "Canvas API", ok: true }, { label: "getUserMedia", ok: true },
    { label: "WebGL", ok: true }, { label: "Bluetooth API", ok: false, note: "제한적 지원" },
  ];

  const os = typeof navigator === "undefined" ? "N/A" :
    navigator.userAgent.includes("Mac") ? "macOS" :
    navigator.userAgent.includes("Win") ? "Windows" :
    navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad") ? "iOS" : "Android/기타";

  const browser = typeof navigator === "undefined" ? "N/A" :
    navigator.userAgent.includes("Edg") ? "Edge" :
    navigator.userAgent.includes("Chrome") ? "Chrome" :
    navigator.userAgent.includes("Firefox") ? "Firefox" :
    navigator.userAgent.includes("Safari") ? "Safari" : "기타";

  const cores = typeof navigator !== "undefined" ? `${navigator.hardwareConcurrency ?? "N/A"}코어` : "N/A";
  const ram = typeof navigator !== "undefined" && "deviceMemory" in navigator
    ? `${(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "N/A"} GB` : "N/A";

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>시스템 진단</SectionTitle>
        <div className="flex flex-col">
          {visible.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)", animation: "diagIn 0.3s ease forwards" }}>
              <span className="text-base flex-shrink-0">{item.status === "ok" ? "✅" : item.status === "warn" ? "⚠️" : "❌"}</span>
              <span className="text-sm text-white/75 flex-1">{item.label}</span>
              <span className="text-xs font-mono flex-shrink-0 text-right"
                style={{ color: item.status === "ok" ? "rgba(34,197,94,0.85)" : item.status === "warn" ? "#C9A84C" : "#FF007F" }}>
                {item.detail}
              </span>
            </div>
          ))}
          {visible.length < DIAG_LIST.length && (
            <div className="flex items-center gap-2 py-3 text-sm text-white/30">
              <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(0,229,255,0.4)", borderTopColor: "transparent" }} />
              검사중...
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>네트워크 속도 테스트</SectionTitle>
        <div className="flex flex-col gap-4">
          <button onClick={() => { setSpeedTesting(true); setSpeedDone(false); setTimeout(() => { setSpeedTesting(false); setSpeedDone(true); }, 2600); }}
            disabled={speedTesting}
            className="self-start px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF", opacity: speedTesting ? 0.6 : 1 }}>
            {speedTesting ? "⏱️ 테스트 중..." : "속도 테스트"}
          </button>
          {(speedTesting || speedDone) && (
            <div className="flex flex-col gap-3">
              {[
                { label: "다운로드", value: 450, max: 500, color: "#00E5FF" },
                { label: "업로드", value: 180, max: 500, color: "#FF007F" },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1"><span className="text-sm text-white/75">{label}</span><span className="text-xs font-mono" style={{ color }}>{speedDone ? value : "..."} Mbps</span></div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: speedDone ? `${(value / max) * 100}%` : "0%", background: color }} />
                  </div>
                </div>
              ))}
              {speedDone && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <span>✅</span><span className="text-xs text-green-400">지연시간: 12ms · 4K 스트리밍 가능</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>브라우저 기능</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {caps.map(c => (
            <div key={c.label} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-sm">{c.ok ? "✅" : "⚠️"}</span>
              <div><p className="text-xs text-white/70">{c.label}</p>{c.note && <p className="text-[9px] text-white/30">{c.note}</p>}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>기기 정보</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[{ label: "OS", value: os }, { label: "브라우저", value: browser }, { label: "CPU 코어", value: cores }, { label: "RAM", value: ram }].map(({ label, value }) => (
            <div key={label} className="p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-white/30 mb-1">{label}</p>
              <p className="text-sm font-medium text-white/80">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => {
            const text = DIAG_LIST.map(d => `${d.status === "ok" ? "✅" : "⚠️"} ${d.label}: ${d.detail}`).join("\n");
            navigator.clipboard.writeText(text).catch(() => null);
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }} className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}>
            {copied ? "복사됨 ✅" : "📋 진단 보고서 복사"}
          </button>
          <button className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            💬 고객센터에 보내기
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 7: Updates
// ─────────────────────────────────────────────────────────────

function UpdatesTab() {
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const drivers = [
    { id: "echo-mic", icon: "🎙️", name: "Echo Mic V2 드라이버", cur: "v1.2.3", latest: "v1.3.0", changes: "노이즈 캔슬링 성능 개선", upToDate: false },
    { id: "lsync", icon: "💡", name: "L'Sync 조명 펌웨어", cur: "v2.0.1", latest: "v2.0.1", changes: "", upToDate: true },
    { id: "4k-cam", icon: "📷", name: "4K Pro 웹캠 펌웨어", cur: "v3.1.0", latest: "v3.2.0", changes: "4K 60fps 안정성 개선", upToDate: false },
  ];

  const tips = [
    { id: "accel", title: "하드웨어 가속 활성화 방법", content: "Chrome → 설정 → 시스템 → '가능한 경우 하드웨어 가속 사용' 활성화. 페이지 재시작 필요." },
    { id: "perms", title: "카메라/마이크 권한 설정 가이드", content: "Chrome 주소창 왼쪽 자물쇠 아이콘 → 사이트 설정 → 카메라/마이크를 '허용'으로 변경." },
  ];

  const handleUpdate = (id: string) => {
    setUpdating(id); setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 18 + 6;
        if (next >= 100) {
          clearInterval(interval);
          setUpdating(null);
          setDone(s => new Set([...s, id]));
          return 0;
        }
        return next;
      });
    }, 180);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>플랫폼 업데이트</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div>
              <p className="text-base font-semibold text-white/90">L&apos;Oxygène v2.1.0</p>
              <p className="text-xs text-white/40 mt-0.5">마지막 업데이트: 2026.04.12</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-green-400">최신 버전</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto hide-scrollbar p-0.5">
            <p className="text-[10px] font-bold text-white/40 mt-1">v2.1.0 (현재)</p>
            {["✨ 바이브 디렉터 시스템 추가", "✨ 실시간 채팅 개선", "🐛 모바일 레이아웃 수정", "🐛 가사 싱크 타이밍 수정"].map(c => <p key={c} className="text-xs text-white/50 py-0.5">{c}</p>)}
            <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.05)" }} />
            <p className="text-[10px] font-bold text-white/40">v2.0.0</p>
            {["✨ L'Oxygène Black 룸 오픈", "✨ 결제 시스템 구축", "✨ 다국어 지원 (KR/EN/JP/CN)"].map(c => <p key={c} className="text-xs text-white/50 py-0.5">{c}</p>)}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
              업데이트 확인
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-white/35">자동</span>
              <Toggle checked={autoUpdate} onChange={setAutoUpdate} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>하드웨어 드라이버</SectionTitle>
        <div className="flex flex-col gap-3">
          {drivers.map(d => (
            <div key={d.id} className="p-4 rounded-xl flex flex-col gap-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg flex-shrink-0">{d.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/85 truncate">{d.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{d.cur} → {d.latest}</p>
                  </div>
                </div>
                {(d.upToDate || done.has(d.id)) ? (
                  <span className="text-xs text-green-400 flex-shrink-0">✅ 최신</span>
                ) : updating === d.id ? (
                  <span className="text-xs text-[#00E5FF] flex-shrink-0 font-mono">{Math.min(99, Math.round(progress))}%</span>
                ) : (
                  <button onClick={() => handleUpdate(d.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                    style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                    업데이트
                  </button>
                )}
              </div>
              {!d.upToDate && d.changes && <p className="text-[10px] text-white/30 pl-8">📝 {d.changes}</p>}
              {updating === d.id && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(99, progress)}%`, background: "linear-gradient(to right, rgba(0,229,255,0.6), #00E5FF)" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>브라우저 최적화 팁</SectionTitle>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)" }}>
            <span>🌐</span>
            <p className="text-xs text-white/60">Chrome 최신버전 사용을 권장합니다. 최적 성능과 보안을 위해 업데이트하세요.</p>
          </div>
          {tips.map(tip => (
            <div key={tip.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
                className="w-full flex items-center justify-between p-3 text-left"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-xs text-white/65">{tip.title}</span>
                <Icon icon={expandedTip === tip.id ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} className="w-3.5 h-3.5 text-white/30 flex-shrink-0 ml-2" />
              </button>
              {expandedTip === tip.id && (
                <div className="px-4 py-3 text-xs text-white/45 leading-relaxed" style={{ background: "rgba(0,0,0,0.3)" }}>
                  {tip.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 8: Theme
// ─────────────────────────────────────────────────────────────

function ThemeTab() {
  const [primary, setPrimary] = useState("#00E5FF");
  const [secondary, setSecondary] = useState("#FF007F");
  const [bgColor, setBgColor] = useState("#070707");
  const [font, setFont] = useState("Outfit");
  const [glowIntensity, setGlowIntensity] = useState(60);
  const [borderOpacity, setBorderOpacity] = useState(40);
  const [blurStrength, setBlurStrength] = useState(50);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const fonts = ["Outfit", "Noto Sans KR", "IBM Plex Mono", "Pretendard"];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>나만의 테마 만들기</SectionTitle>
        <div className="flex flex-col gap-4">
          {[
            { label: "Primary (기본: 사이안)", v: primary, set: setPrimary },
            { label: "Secondary (기본: 핑크)", v: secondary, set: setSecondary },
            { label: "배경 색상", v: bgColor, set: setBgColor },
          ].map(({ label, v, set }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-white/75">{label}</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-white/20" style={{ background: v }} />
                <input type="color" value={v} onChange={e => set(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer bg-transparent border-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="mt-5 p-4 rounded-xl" style={{ background: bgColor, border: `1px solid ${primary}25` }}>
          <p className="text-[9px] mb-3" style={{ color: `${primary}60` }}>미리보기</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: `${primary}20`, border: `1px solid ${primary}50` }}>🎤</div>
            <div>
              <div className="w-24 h-2.5 rounded-full mb-1.5" style={{ background: `${primary}25` }} />
              <div className="w-16 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 py-2 rounded-lg text-center text-[10px] font-medium"
              style={{ background: `${primary}18`, border: `1px solid ${primary}40`, color: primary }}>참여하기</div>
            <div className="flex-1 py-2 rounded-lg text-center text-[10px] font-medium"
              style={{ background: `${secondary}12`, border: `1px solid ${secondary}30`, color: secondary }}>선물 💐</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>폰트 선택</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {fonts.map(f => (
            <button key={f} onClick={() => setFont(f)}
              className="py-3 rounded-xl text-sm transition-all"
              style={font === f
                ? { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }
                : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
              {f}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>시각 효과 강도</SectionTitle>
        <div className="flex flex-col gap-4">
          {[
            { label: "글로우 강도", v: glowIntensity, set: setGlowIntensity },
            { label: "테두리 불투명도", v: borderOpacity, set: setBorderOpacity },
            { label: "블러 강도", v: blurStrength, set: setBlurStrength },
          ].map(({ label, v, set }) => (
            <div key={label}>
              <div className="flex justify-between mb-1"><span className="text-sm text-white/75">{label}</span><span className="text-xs text-[#00E5FF]">{v}%</span></div>
              <Slider value={v} onChange={set} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>테마 저장 및 공유</SectionTitle>
        <div className="flex flex-col gap-3">
          <button onClick={() => {
            try { localStorage.setItem("loxygene-theme", JSON.stringify({ primary, secondary, bgColor, font, glowIntensity, borderOpacity, blurStrength })); } catch {}
            setSaved(true); setTimeout(() => setSaved(false), 2200);
          }} className="w-full py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
            {saved ? "저장됨 ✅" : "💾 테마 저장"}
          </button>
          <div className="flex gap-3">
            <button onClick={() => { setPrimary("#00E5FF"); setSecondary("#FF007F"); setBgColor("#070707"); setFont("Outfit"); setGlowIntensity(60); setBorderOpacity(40); setBlurStrength(50); try { localStorage.removeItem("loxygene-theme"); } catch {} }}
              className="flex-1 py-2.5 rounded-xl text-xs transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              기본값으로 초기화
            </button>
            <button onClick={() => {
              const css = `--cp: ${primary};\n--cs: ${secondary};\n--cb: ${bgColor};\n--glow: ${glowIntensity}%;\n--blur: ${blurStrength / 10}px;`;
              navigator.clipboard.writeText(css).catch(() => null);
              setCopied(true); setTimeout(() => setCopied(false), 2000);
            }} className="flex-1 py-2.5 rounded-xl text-xs transition-all active:scale-95"
              style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C" }}>
              {copied ? "복사됨 ✅" : "🔗 테마 공유"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "audio",       icon: "🎙️", label: "오디오 설정" },
  { id: "video",       icon: "📷", label: "비디오 설정" },
  { id: "eq",          icon: "🎚️", label: "이퀄라이저" },
  { id: "lighting",    icon: "💡", label: "조명 설정" },
  { id: "display",     icon: "🖥️", label: "디스플레이" },
  { id: "diagnostics", icon: "🔧", label: "시스템 진단" },
  { id: "updates",     icon: "📦", label: "업데이트 센터" },
  { id: "theme",       icon: "🎨", label: "테마 커스텀" },
];

export default function ControlPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("audio");

  const handleTabChange = (id: Tab) => setActiveTab(id);

  const renderContent = () => {
    switch (activeTab) {
      case "audio":       return <AudioTab />;
      case "video":       return <VideoTab />;
      case "eq":          return <EQTab />;
      case "lighting":    return <LightingTab />;
      case "display":     return <DisplayTab />;
      case "diagnostics": return <DiagnosticsTab />;
      case "updates":     return <UpdatesTab />;
      case "theme":       return <ThemeTab />;
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "#070707" }}>
      {/* BG glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-8%] left-[-4%] w-[35%] h-[35%] rounded-full"
          style={{ background: "rgba(0,229,255,0.04)", filter: "blur(100px)" }} />
        <div className="absolute bottom-[-8%] right-[-4%] w-[35%] h-[35%] rounded-full"
          style={{ background: "rgba(255,0,127,0.04)", filter: "blur(100px)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40"
        style={{ background: "rgba(7,7,7,0.96)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/"
            className="flex items-center gap-2 transition-colors flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
            <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
            <span className="text-xs font-light tracking-widest hidden sm:block">L&apos;OXYGÈNE</span>
          </Link>
          <div className="w-px h-5 hidden sm:block" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold tracking-[0.15em]"
              style={{ color: "#00E5FF", textShadow: "0 0 14px rgba(0,229,255,0.5)" }}>
              CONTROL PANEL
            </h1>
            <p className="text-[10px] hidden sm:block" style={{ color: "rgba(255,255,255,0.25)" }}>
              스튜디오 환경을 최적화하세요
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px] font-medium text-green-400">시스템 정상</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full relative z-10">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 px-4 pt-6">
          <nav className="sticky top-[72px] flex flex-col gap-0.5 p-2 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full"
                style={activeTab === tab.id
                  ? { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF", boxShadow: "0 0 10px rgba(0,229,255,0.07)" }
                  : { color: "rgba(255,255,255,0.42)", border: "1px solid transparent" }}>
                <span className="text-base leading-none flex-shrink-0">{tab.icon}</span>
                <span className="flex-1">{tab.label}</span>
                {activeTab === tab.id && <Icon icon="solar:arrow-right-linear" className="w-3 h-3 opacity-40 flex-shrink-0" />}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 px-4 lg:pr-8 lg:pl-6 py-6 flex flex-col gap-5">
          {/* Mobile horizontal tab scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={activeTab === tab.id
                  ? { background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                <span>{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content — key forces remount + re-animation on tab change */}
          <div key={activeTab} style={{ animation: "cpFadeIn 0.22s ease forwards" }}>
            {renderContent()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cpFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes diagIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .cp-slider { -webkit-appearance: none; appearance: none; }
        .cp-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; }
        /* EQ vertical slider via CSS rotate trick */
        .eq-vslider {
          -webkit-appearance: none;
          appearance: none;
          writing-mode: vertical-lr;
          direction: rtl;
          background: transparent;
          cursor: ns-resize;
          opacity: 0;
        }
        .eq-vslider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
        }
        select option { background: #111; color: #fff; }
      `}</style>
    </div>
  );
}
