"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

// ── Local stream context ───────────────────────────────────────────────────────

interface LocalStreamContextValue {
  localStream: MediaStream | null;
  isCameraActive: boolean;
  isMicActive: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
}

const LocalStreamContext = createContext<LocalStreamContextValue>({
  localStream: null,
  isCameraActive: false,
  isMicActive: false,
  toggleMic: () => undefined,
  toggleCamera: () => undefined,
});

export function useLocalStream(): LocalStreamContextValue {
  return useContext(LocalStreamContext);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ZoomVideoRoomProps {
  sessionName: string;
  userName: string;
  role: "host" | "guest" | "vip";
  onLeave: () => void;
  children: React.ReactNode;
}

type ConnectionState = "idle" | "connecting" | "permission_denied" | "mock" | "connected" | "error";

const isSdkConfigured =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_ZOOM_SDK_KEY !== undefined &&
  process.env.NEXT_PUBLIC_ZOOM_SDK_KEY !== "your_zoom_sdk_key_here";

// ── Component ─────────────────────────────────────────────────────────────────

export default function ZoomVideoRoom({
  sessionName,
  userName,
  role,
  onLeave,
  children,
}: ZoomVideoRoomProps) {
  const [state, setState] = useState<ConnectionState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMockMode, setIsMockMode] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  // Connection status pill visibility
  const [showStatusPill, setShowStatusPill] = useState(false);
  const pillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Wire up localVideoRef to stream ────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ── Show status pill on state change ──────────────────────────────────────
  useEffect(() => {
    if (state === "idle") return;
    setShowStatusPill(true);
    if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    if (state === "connected" || state === "mock") {
      pillTimerRef.current = setTimeout(() => setShowStatusPill(false), 3000);
    }
    return () => {
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    };
  }, [state]);

  // ── Media helpers ──────────────────────────────────────────────────────────
  const initLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      setLocalStream(stream);
      setIsCameraActive(true);
      setIsMicActive(true);
      return stream;
    } catch (err) {
      const isPermissionDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      if (isPermissionDenied) {
        setState("permission_denied");
      } else {
        console.warn("[ZoomVideoRoom] Camera/mic not available:", err);
      }
      return null;
    }
  }, []);

  const toggleMic = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMicActive(prev => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraActive(prev => !prev);
  }, []);

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setState("connecting");
    setErrorMsg("");

    // Always try to get local camera (works in both real + mock mode)
    await initLocalMedia();

    if (!isSdkConfigured) {
      setIsMockMode(true);
      await new Promise(r => setTimeout(r, 600));
      setState("mock");
      return;
    }

    // Real Zoom SDK init
    try {
      const { getZoomClient, generateSignature } = await import("@/lib/zoom/zoomClient");
      const client = getZoomClient();
      await client.init("en-US", "Global", { patchJsMedia: true });
      const sig = await generateSignature(sessionName, role === "host" ? 1 : 0);
      await client.join(sessionName, sig, userName);
      setState("connected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "연결에 실패했습니다";
      setErrorMsg(msg);
      setState("error");
    }
  }, [sessionName, userName, role, initLocalMedia]);

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    connect();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionName, userName]);

  // ── Connection status pill ─────────────────────────────────────────────────
  const statusPill = showStatusPill && (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all"
      style={{
        background: "rgba(7,7,7,0.85)",
        border: state === "error"
          ? "1px solid rgba(239,68,68,0.4)"
          : state === "connecting"
          ? "1px solid rgba(201,168,76,0.4)"
          : "1px solid rgba(0,229,255,0.3)",
      }}
    >
      <span className={
        state === "error" ? "text-red-400" :
        state === "connecting" ? "text-yellow-400" : "text-[#00E5FF]"
      }>
        {state === "error" ? "🔴" : state === "connecting" ? "🟡" : "🟢"}
      </span>
      <span className="text-white/70">
        {state === "error" ? "연결 끊김" :
         state === "connecting" ? "연결 중..." : "연결됨"}
      </span>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === "idle" || state === "connecting") {
    return (
      <>
        {statusPill}
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full animate-ping"
              style={{ border: "2px solid rgba(0,229,255,0.4)", animationDuration: "1.2s" }} />
            <div className="absolute inset-2 rounded-full animate-ping"
              style={{ border: "1px solid rgba(0,229,255,0.2)", animationDuration: "1.6s", animationDelay: "0.3s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon icon="solar:wifi-bold" className="w-8 h-8 text-[#00E5FF]"
                style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.8))" }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm font-medium">룸에 연결 중...</p>
            <p className="text-white/30 text-xs mt-1">{sessionName}</p>
          </div>
          <div className="w-48 h-0.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full w-1/2 rounded-full"
              style={{ background: "linear-gradient(to right, transparent, #00E5FF, transparent)", animation: "scan-line 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </>
    );
  }

  // ── Permission denied ──────────────────────────────────────────────────────
  if (state === "permission_denied") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl max-w-sm w-full mx-4 text-center"
          style={{ background: "rgba(12,12,12,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
              <Icon icon="solar:camera-bold" className="w-7 h-7 text-[#00E5FF]" />
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
              <Icon icon="solar:microphone-bold" className="w-7 h-7 text-[#00E5FF]" />
            </div>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">카메라와 마이크 접근을 허용해주세요</h2>
            <p className="text-white/40 text-sm mt-2">노래방 참여를 위해 브라우저 설정에서 권한을 허용한 뒤 다시 시도해주세요.</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => { setState("idle"); connect(); }}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }}
            >
              허용하기
            </button>
            <button
              onClick={() => { setIsMockMode(true); setState("mock"); }}
              className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              나중에 (카메라 없이 입장)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <>
        {statusPill}
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <Icon icon="solar:wifi-slash-bold" className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm font-bold">연결 실패</p>
            <p className="text-white/40 text-xs mt-1 max-w-xs">{errorMsg}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={connect}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
              다시 시도
            </button>
            <button onClick={onLeave}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              나가기
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Connected (real or mock) ───────────────────────────────────────────────
  return (
    <LocalStreamContext.Provider value={{ localStream, isCameraActive, isMicActive, toggleMic, toggleCamera }}>
      {/* Demo mode badge */}
      {isMockMode && (
        <div className="fixed top-20 right-4 z-40 px-2 py-1 rounded text-[10px] font-medium"
          style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C" }}>
          데모 모드
        </div>
      )}

      {/* Connection status pill */}
      {statusPill}

      {/* Hidden local video (srcObject set via ref) */}
      <video ref={localVideoRef} autoPlay muted playsInline className="sr-only" />

      {children}
    </LocalStreamContext.Provider>
  );
}

// ── Local video tile ───────────────────────────────────────────────────────────
// Reusable component for displaying the local camera feed or avatar fallback.

interface LocalVideoTileProps {
  nickname: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LocalVideoTile({ nickname, className = "", style }: LocalVideoTileProps) {
  const { localStream, isCameraActive } = useLocalStream();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (localStream && isCameraActive) {
    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`object-cover ${className}`}
        style={{ transform: "scaleX(-1)", ...style }}
      />
    );
  }

  // Avatar fallback
  const palette = ["#00E5FF", "#FF007F", "#C9A84C", "#A855F7", "#22C55E"];
  let h = 0;
  for (let i = 0; i < nickname.length; i++) h = (h * 31 + nickname.charCodeAt(i)) & 0xffffffff;
  const color = palette[Math.abs(h) % palette.length];

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        background: `${color}18`,
        animation: "pulse-neon 2s ease-in-out infinite",
        ...style,
      }}
    >
      <div
        className="w-2/3 h-2/3 max-w-16 max-h-16 rounded-full flex items-center justify-center text-2xl font-black"
        style={{
          background: `${color}22`,
          border: `2px solid ${color}`,
          color,
          boxShadow: `0 0 20px ${color}33`,
        }}
      >
        {nickname[0]}
      </div>
    </div>
  );
}
