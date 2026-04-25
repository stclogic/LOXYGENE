"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface BroadcastParticipant {
  session_id: string;
  user_name?: string;
  user_id?: string;
  local?: boolean;
  tracks: {
    audio: { persistentTrack?: MediaStreamTrack | null; state?: string };
    video: { persistentTrack?: MediaStreamTrack | null; state?: string };
  };
}

interface UseDailyBroadcastOptions {
  roomUrl: string;
  token: string | null;
  isHost: boolean;
  nickname: string;
  ready: boolean; // API 응답 완료 후 true — 이전에는 join 시도 안 함
}

interface UseDailyBroadcastReturn {
  joined: boolean;
  localAudioOn: boolean;
  localVideoOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  participants: Record<string, BroadcastParticipant>;
  guestCount: number;
  error: string | null;
  status: "idle" | "connecting" | "connected" | "error";
}

export function useDailyBroadcast({
  roomUrl,
  token,
  isHost,
  nickname,
  ready,
}: UseDailyBroadcastOptions): UseDailyBroadcastReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);
  const [joined, setJoined] = useState(false);
  const [localAudioOn, setLocalAudioOn] = useState(false);
  const [participants, setParticipants] = useState<Record<string, BroadcastParticipant>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  useEffect(() => {
    // ready + roomUrl + token 모두 확보된 이후에만 join
    if (!ready || !roomUrl || !token) return;

    let destroyed = false;

    // useDailyCall과 동일한 패턴
    import("@daily-co/daily-js").then((mod) => {
      if (destroyed) return;
      const DailyIframe = mod.default;

      const call = DailyIframe.createCallObject({
        audioSource: isHost,   // 호스트만 마이크 열기
        videoSource: false,    // 비디오 불필요
      });
      callRef.current = call;

      call.on("joined-meeting", (e: { participants: Record<string, BroadcastParticipant> }) => {
        if (destroyed) return;
        setJoined(true);
        setStatus("connected");
        setError(null);
        if (e.participants) setParticipants({ ...e.participants });
        if (isHost) {
          call.setLocalAudio(true);
          setLocalAudioOn(true);
        }
      });

      call.on("participant-joined", (e: { participant: BroadcastParticipant }) => {
        if (destroyed) return;
        setParticipants(prev => ({ ...prev, [e.participant.session_id]: e.participant }));
      });
      call.on("participant-updated", (e: { participant: BroadcastParticipant }) => {
        if (destroyed) return;
        setParticipants(prev => ({ ...prev, [e.participant.session_id]: e.participant }));
      });
      call.on("participant-left", (e: { participant: BroadcastParticipant }) => {
        if (destroyed) return;
        setParticipants(prev => {
          const next = { ...prev };
          delete next[e.participant.session_id];
          return next;
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on("error", (e: any) => {
        if (destroyed) return;
        const msg = e?.errorMsg ?? e?.error ?? "연결 오류";
        setError(msg);
        setStatus("error");
        console.error("[Daily] error:", e);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on("left-meeting", (_e: any) => {
        if (destroyed) return;
        setJoined(false);
        setStatus("idle");
      });

      setStatus("connecting");
      call
        .join({ url: roomUrl, token, userName: nickname })
        .catch((e: unknown) => {
          if (destroyed) return;
          const msg = e instanceof Error ? e.message : "join 실패";
          setError(msg);
          setStatus("error");
          console.error("[Daily] join failed:", e);
        });
    }).catch((e: unknown) => {
      if (destroyed) return;
      const msg = e instanceof Error ? e.message : "SDK 로드 실패";
      setError(msg);
      setStatus("error");
      console.error("[Daily] SDK import failed:", e);
    });

    return () => {
      destroyed = true;
      if (callRef.current) {
        callRef.current.leave().catch(() => {});
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
      setJoined(false);
      setStatus("idle");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, roomUrl, token]);

  const toggleMic = useCallback(() => {
    if (!callRef.current || !isHost) return;
    const next = !localAudioOn;
    callRef.current.setLocalAudio(next);
    setLocalAudioOn(next);
  }, [localAudioOn, isHost]);

  const guestCount = Object.values(participants).filter(p => !p.local).length;

  return {
    joined,
    localAudioOn,
    localVideoOn: false,
    toggleMic,
    toggleCamera: () => {},
    participants,
    guestCount,
    error,
    status,
  };
}
