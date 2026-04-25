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
}

interface UseDailyBroadcastReturn {
  joined: boolean;
  localAudioOn: boolean;
  localVideoOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  participants: Record<string, BroadcastParticipant>;
  guestCount: number;
}

export function useDailyBroadcast({
  roomUrl,
  token,
  isHost,
  nickname,
}: UseDailyBroadcastOptions): UseDailyBroadcastReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);
  const [joined, setJoined] = useState(false);
  const [localAudioOn, setLocalAudioOn] = useState(false);
  const [localVideoOn, setLocalVideoOn] = useState(isHost); // 호스트만 기본 켜짐
  const [participants, setParticipants] = useState<Record<string, BroadcastParticipant>>({});

  useEffect(() => {
    if (!roomUrl) return;

    let destroyed = false;

    import("@daily-co/daily-js").then((mod) => {
      if (destroyed) return;
      const DailyIframe = mod.default;

      const call = DailyIframe.createCallObject(
        isHost
          ? { audioSource: true,  videoSource: false }
          : { audioSource: false, videoSource: false }
      );

      // 게스트: 모든 참가자 오디오 트랙 자동 구독 (Daily SDK 기본값이지만 명시 설정)
      if (!isHost) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call as any).setSubscribeToTracksAutomatically?.(true);
      }
      callRef.current = call;

      const syncParticipants = (data: { participants?: Record<string, BroadcastParticipant> }) => {
        if (data.participants) setParticipants({ ...data.participants });
      };

      call.on("joined-meeting", (e: { participants: Record<string, BroadcastParticipant> }) => {
        setJoined(true);
        syncParticipants(e);
        if (isHost) {
          // 호스트: 마이크 활성화
          call.setLocalAudio(true);
          setLocalAudioOn(true);
        } else {
          // 게스트: 오디오 수신 명시적 활성화
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (call as any).setSubscribeToTracksAutomatically?.(true);
        }
      });

      call.on("participant-joined", (e: { participant: BroadcastParticipant }) =>
        setParticipants(prev => ({ ...prev, [e.participant.session_id]: e.participant }))
      );
      call.on("participant-updated", (e: { participant: BroadcastParticipant }) =>
        setParticipants(prev => ({ ...prev, [e.participant.session_id]: e.participant }))
      );
      call.on("participant-left", (e: { participant: BroadcastParticipant }) =>
        setParticipants(prev => {
          const next = { ...prev };
          delete next[e.participant.session_id];
          return next;
        })
      );

      const joinOpts: Record<string, unknown> = { url: roomUrl };
      if (token) joinOpts.token = token;
      if (nickname) joinOpts.userName = nickname;

      call.join(joinOpts).catch(console.error);
    });

    return () => {
      destroyed = true;
      if (callRef.current) {
        callRef.current.leave().catch(() => {});
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl, token]);

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

  const guestCount = Object.values(participants).filter(p => !p.local).length;

  return { joined, localAudioOn, localVideoOn, toggleMic, toggleCamera, participants, guestCount };
}
