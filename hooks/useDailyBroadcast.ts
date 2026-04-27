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
  onAppMessage?: (data: unknown) => void; // 수신 콜백
}

interface UseDailyBroadcastReturn {
  joined: boolean;
  localAudioOn: boolean;
  localVideoOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  participants: Record<string, BroadcastParticipant>;
  guestCount: number;
  hostVideoTrack: MediaStreamTrack | null;
  hostAudioTrack: MediaStreamTrack | null;
  sendAppMessage: (data: unknown) => void;
  setBackground: (type: "none" | "blur" | "image", imageUrl?: string) => Promise<void>;
  setVideoZoom: (level: number) => Promise<void>;
  dailyZoomSupported: boolean;
  error: string | null;
  status: "idle" | "connecting" | "connected" | "error";
}

export function useDailyBroadcast({
  roomUrl,
  token,
  isHost,
  nickname,
  ready,
  onAppMessage,
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

      // 원격 참가자 비디오·오디오 구독 강제 활성화
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscribeToRemote = (sessionId: string) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (call as any).updateParticipant?.(sessionId, {
            setSubscribedTracks: { video: true, audio: true, screenVideo: false },
          });
        } catch { /* ignore */ }
      };

      call.on("joined-meeting", (e: { participants: Record<string, BroadcastParticipant> }) => {
        if (destroyed) return;
        setJoined(true);
        setStatus("connected");
        setError(null);
        if (e.participants) {
          syncParticipants(e.participants);
          // 이미 방에 있는 원격 참가자 모두 구독
          Object.values(e.participants).forEach(p => {
            if (!p.local) subscribeToRemote(p.session_id);
          });
        }

        if (isHost) {
          call.setLocalAudio(true);
          call.setLocalVideo(true);
          setLocalAudioOn(true);
          setLocalVideoOn(true);
        } else {
          call.setLocalAudio(false);
          call.setLocalVideo(false);
        }
      });

      call.on("participant-joined", (e: { participant: BroadcastParticipant }) => {
        if (destroyed) return;
        setParticipants(prev => ({ ...prev, [e.participant.session_id]: e.participant }));
        if (!e.participant.local) subscribeToRemote(e.participant.session_id);
      });
      call.on("participant-updated", (e: { participant: BroadcastParticipant }) => {
        if (destroyed) return;
        setParticipants(prev => ({ ...prev, [e.participant.session_id]: e.participant }));
        if (!e.participant.local) subscribeToRemote(e.participant.session_id);
      });
      // 트랙이 재생 가능 상태가 되면 참가자 정보 즉시 갱신
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on("track-started", (e: any) => {
        if (destroyed || !e?.participant) return;
        setParticipants(prev => ({
          ...prev,
          [e.participant.session_id]: e.participant,
        }));
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

      // Daily 앱 메시지 — 채팅·타이머·콘텐츠 동기화용
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on("app-message", (e: any) => {
        if (destroyed) return;
        try {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          onAppMessage?.(data);
        } catch { /* ignore */ }
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

  // ── 가상 배경 설정 (Daily.co 내장 ML 세그멘테이션) ──────────────────────
  const setBackground = useCallback(async (
    type: "none" | "blur" | "image",
    imageUrl?: string,
  ) => {
    if (!callRef.current || !isHost) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processor: any =
        type === "blur"  ? { type: "background-blur",  config: { strength: 0.5 } } :
        type === "image" ? { type: "background-image", config: { source: imageUrl } } :
                           { type: "none" };
      await (callRef.current as any).updateInputSettings({ video: { processor } });
    } catch (e) {
      console.error("[Daily] setBackground failed:", e);
    }
  }, [isHost]);

  // ── 카메라 줌 (MediaTrack constraints → CSS fallback) ────────────────────
  const [dailyZoomSupported, setDailyZoomSupported] = useState(false);
  const setVideoZoom = useCallback(async (level: number) => {
    if (!callRef.current || !isHost) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const local = (callRef.current as any).participants?.()?.local;
      const track: MediaStreamTrack | null = local?.tracks?.video?.persistentTrack ?? null;
      if (track) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const caps = (track as any).getCapabilities?.() as any;
        if (caps?.zoom) {
          await track.applyConstraints({ advanced: [{ zoom: level } as MediaTrackConstraintSet] });
          setDailyZoomSupported(true);
          return;
        }
      }
    } catch { /* zoom not supported by hardware */ }
    // CSS fallback은 page.tsx에서 별도 처리
    setDailyZoomSupported(false);
  }, [isHost]);

  const sendAppMessage = useCallback((data: unknown) => {
    if (!callRef.current) return;
    try {
      callRef.current.sendAppMessage(data, "*");
    } catch (e) {
      console.error("[Daily] sendAppMessage failed:", e);
    }
  }, []);

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
    sendAppMessage,
    setBackground,
    setVideoZoom,
    dailyZoomSupported,
    error, status,
  };
}
