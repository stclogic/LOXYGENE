"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

export interface ZoomVideoRoomProps {
  sessionName: string;
  userName: string;
  role: "host" | "guest" | "vip";
  onLeave: () => void;
  children: React.ReactNode;
}

type ConnectionState = "idle" | "connecting" | "mock" | "connected" | "error";

const isSdkConfigured =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_ZOOM_SDK_KEY !== undefined &&
  process.env.NEXT_PUBLIC_ZOOM_SDK_KEY !== "your_zoom_sdk_key_here";

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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mockStreamRef = useRef<MediaStream | null>(null);

  const connect = async () => {
    setState("connecting");
    setErrorMsg("");

    if (!isSdkConfigured) {
      // Mock mode: use local camera if available
      setIsMockMode(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        mockStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        // Camera not available — silent fallback to placeholder
      }
      // Brief artificial delay for UX
      await new Promise(r => setTimeout(r, 800));
      setState("mock");
      return;
    }

    // Real Zoom SDK init (production)
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
  };

  useEffect(() => {
    connect();
    return () => {
      mockStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionName, userName]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === "idle" || state === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6">
        {/* Scanning animation */}
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
        {/* Neon scan line */}
        <div className="w-48 h-0.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full w-1/2 rounded-full"
            style={{ background: "linear-gradient(to right, transparent, #00E5FF, transparent)", animation: "scan-line 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
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
    );
  }

  // ── Connected (real or mock) ───────────────────────────────────────────
  return (
    <>
      {/* Mock mode badge */}
      {isMockMode && (
        <div className="fixed top-20 right-4 z-40 px-2 py-1 rounded text-[10px] font-medium"
          style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C" }}>
          데모 모드
        </div>
      )}
      {/* Hidden local video element for mock camera */}
      <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
      {children}
    </>
  );
}
