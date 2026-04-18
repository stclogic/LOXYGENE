"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface DailyParticipant {
  session_id: string;
  user_name?: string;
  user_id?: string;
  local?: boolean;
  tracks: {
    video: { persistentTrack?: MediaStreamTrack | null; state?: string };
    audio: { persistentTrack?: MediaStreamTrack | null; state?: string };
  };
}

export function useDailyCall(roomUrl: string, token: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);
  const [joined, setJoined] = useState(false);
  const [localAudio, setLocalAudio] = useState(true);
  const [localVideo, setLocalVideo] = useState(true);
  const [participants, setParticipants] = useState<Record<string, DailyParticipant>>({});

  useEffect(() => {
    if (!roomUrl || !token) return;

    let destroyed = false;

    // Dynamic import to avoid SSR issues
    import("@daily-co/daily-js").then((mod) => {
      if (destroyed) return;
      const DailyIframe = mod.default;

      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      });
      callRef.current = call;

      call.on("joined-meeting", (e: { participants: Record<string, DailyParticipant> }) => {
        setJoined(true);
        setParticipants(e.participants ?? {});
      });

      call.on("participant-joined", (e: { participant: DailyParticipant }) => {
        setParticipants((prev) => ({ ...prev, [e.participant.session_id]: e.participant }));
      });

      call.on("participant-updated", (e: { participant: DailyParticipant }) => {
        setParticipants((prev) => ({ ...prev, [e.participant.session_id]: e.participant }));
      });

      call.on("participant-left", (e: { participant: DailyParticipant }) => {
        setParticipants((prev) => {
          const next = { ...prev };
          delete next[e.participant.session_id];
          return next;
        });
      });

      call.join({ url: roomUrl, token }).catch(console.error);
    });

    return () => {
      destroyed = true;
      if (callRef.current) {
        callRef.current.leave().catch(() => {});
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
    };
  }, [roomUrl, token]);

  const toggleMic = useCallback(() => {
    if (!callRef.current) return;
    callRef.current.setLocalAudio(!localAudio);
    setLocalAudio((p) => !p);
  }, [localAudio]);

  const toggleCamera = useCallback(() => {
    if (!callRef.current) return;
    callRef.current.setLocalVideo(!localVideo);
    setLocalVideo((p) => !p);
  }, [localVideo]);

  const leave = useCallback(() => {
    callRef.current?.leave().catch(() => {});
  }, []);

  return { joined, localAudio, localVideo, participants, toggleMic, toggleCamera, leave };
}
