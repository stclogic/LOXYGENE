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
  ready: boolean;
}

interface UseDailyBroadcastReturn {
  joined: boolean;
  localAudioOn: boolean;
  localVideoOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  participants: Record<string, BroadcastParticipant>;
  guestCount: number;
  // 호스트의 오디오/비디오 트랙 (게스트 화면에서 재생용)
  hostVideoTrack: MediaStreamTrack | null;
  hostAudioTrack: MediaStreamTrack | null;
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
  const [localVideoOn, setLocalVideoOn] = useState(false);
  const [participants, setParticipants] = useState<Record<string, BroadcastParticipant>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  useEffect(() => {
    if (!ready || !roomUrl || !token) return;

    let destroyed = false;

    import("@daily-co/daily-js").then((mod) => {
      if (destroyed) return;
      const DailyIframe = mod.default;

      // 호스트: 마이크+카메라 모두 켜기 / 게스트: 수신 전용 (마이크만 초기화 후 즉시 뮤트)
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: isHost, // 호스트만 카메라 ON
      });
      callRef.current = call;

      const syncParticipants = (ps: Record<string, BroadcastParticipant>) =>
        setParticipants({ ...ps });

      call.on("joined-meeting", (e: { participants: Record<string, BroadcastParticipant> }) => {
        if (destroyed) return;
        setJoined(true);
        setStatus("connected");
        setError(null);
        if (e.participants) syncParticipants(e.participants);

        if (isHost) {
          // 호스트: 마이크 + 카메라 활성화
          call.setLocalAudio(true);
          call.setLocalVideo(true);
          setLocalAudioOn(true);
          setLocalVideoOn(true);
        } else {
          // 게스트: 마이크 즉시 뮤트, 카메라 off (수신 전용)
          call.setLocalAudio(false);
          call.setLocalVideo(false);
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
        setError(e?.errorMsg ?? e?.error ?? "연결 오류");
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
      setError(e instanceof Error ? e.message : "SDK 로드 실패");
      setStatus("error");
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

  const toggleCamera = useCallback(() => {
    if (!callRef.current || !isHost) return;
    const next = !localVideoOn;
    callRef.current.setLocalVideo(next);
    setLocalVideoOn(next);
  }, [localVideoOn, isHost]);

  // 원격 호스트 트랙 — 트랙 상태가 playable 인 참가자를 우선 선택
  const remoteParticipants = Object.values(participants).filter(p => !p.local);
  const remoteHost = remoteParticipants.find(
    p => p.tracks.video.state === "playable" || p.tracks.audio.state === "playable"
  ) ?? remoteParticipants[0];
  const hostVideoTrack = remoteHost?.tracks.video.persistentTrack ?? null;
  const hostAudioTrack = remoteHost?.tracks.audio.persistentTrack ?? null;

  const guestCount = Object.values(participants).filter(p => !p.local).length;

  return {
    joined, localAudioOn, localVideoOn,
    toggleMic, toggleCamera,
    participants, guestCount,
    hostVideoTrack, hostAudioTrack,
    error, status,
  };
}
