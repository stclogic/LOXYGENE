"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getZoomClient, generateSignature, resetZoomClient } from "./zoomClient";
import type { ZoomParticipant, ZoomSession, ZoomStreamType } from "./zoomClient";

export type { ZoomParticipant };

export interface UseZoomRoomReturn {
  // State
  isConnected: boolean;
  isConnecting: boolean;
  isHost: boolean;
  participants: ZoomParticipant[];
  localStream: ZoomStreamType | null;
  error: string | null;

  // Session
  initSession: (config: ZoomSession) => Promise<void>;
  leaveSession: () => Promise<void>;

  // Participant controls (host only)
  muteParticipant: (userId: number) => Promise<void>;
  unmuteParticipant: (userId: number) => Promise<void>;
  muteAll: (exceptUserId?: number) => Promise<void>;
  transferHost: (userId: number) => Promise<void>;

  // Media
  shareScreen: () => Promise<void>;
  stopShareScreen: () => Promise<void>;
  setVirtualBackground: (imageUrl: string) => Promise<void>;
  toggleLocalAudio: () => Promise<void>;
  toggleLocalVideo: () => Promise<void>;
}

export function useZoomRoom(): UseZoomRoomReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<ZoomParticipant[]>([]);
  const [localStream, setLocalStream] = useState<ZoomStreamType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<ZoomStreamType | null>(null);
  const sessionNameRef = useRef<string>("");

  // ── Participant list sync ──────────────────────────────────────────────────
  const syncParticipants = useCallback(() => {
    try {
      const client = getZoomClient();
      const list = (client.getAllUser() as unknown) as ZoomParticipant[];
      setParticipants(list ?? []);
    } catch {
      // SDK not initialized yet — ignore
    }
  }, []);

  // ── Init + join session ────────────────────────────────────────────────────
  const initSession = useCallback(async (config: ZoomSession) => {
    setIsConnecting(true);
    setError(null);

    try {
      const client = getZoomClient();
      await client.init("en-US", "Global", { patchJsMedia: true });

      const signature = await generateSignature(config.sessionName, config.role);

      await client.join(
        config.sessionName,
        signature,
        config.userName,
        config.sessionPassword ?? ""
      );

      sessionNameRef.current = config.sessionName;

      const stream = client.getMediaStream();
      streamRef.current = stream;
      setLocalStream(stream);

      await stream.startAudio();
      await stream.startVideo();

      const currentUser = client.getCurrentUserInfo();
      setIsHost(currentUser?.isHost ?? config.role === 1);

      // Event listeners
      client.on("user-added", syncParticipants);
      client.on("user-removed", syncParticipants);
      client.on("user-updated", syncParticipants);

      syncParticipants();
      setIsConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join session";
      setError(msg);
      console.error("[useZoomRoom] initSession error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [syncParticipants]);

  // ── Leave session ──────────────────────────────────────────────────────────
  const leaveSession = useCallback(async () => {
    try {
      const client = getZoomClient();
      client.off("user-added", syncParticipants);
      client.off("user-removed", syncParticipants);
      client.off("user-updated", syncParticipants);

      if (streamRef.current) {
        await streamRef.current.stopAudio().catch(() => null);
        await streamRef.current.stopVideo().catch(() => null);
      }

      await client.leave();
      resetZoomClient();
    } catch (err) {
      console.error("[useZoomRoom] leaveSession error:", err);
    } finally {
      setIsConnected(false);
      setIsHost(false);
      setParticipants([]);
      setLocalStream(null);
      streamRef.current = null;
    }
  }, [syncParticipants]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => { leaveSession().catch(() => null); }, [leaveSession]);

  // ── Participant controls ───────────────────────────────────────────────────
  const muteParticipant = useCallback(async (userId: number) => {
    if (!isHost) return;
    try {
      await streamRef.current?.muteAudio(userId);
      syncParticipants();
    } catch (err) {
      console.error("[useZoomRoom] muteParticipant:", err);
    }
  }, [isHost, syncParticipants]);

  const unmuteParticipant = useCallback(async (userId: number) => {
    if (!isHost) return;
    try {
      await streamRef.current?.unmuteAudio(userId);
      syncParticipants();
    } catch (err) {
      console.error("[useZoomRoom] unmuteParticipant:", err);
    }
  }, [isHost, syncParticipants]);

  const muteAll = useCallback(async (exceptUserId?: number) => {
    if (!isHost) return;
    for (const p of participants) {
      if (p.userId !== exceptUserId && !p.isAudioMuted) {
        await muteParticipant(p.userId);
      }
    }
  }, [isHost, participants, muteParticipant]);

  const transferHost = useCallback(async (userId: number) => {
    if (!isHost) return;
    try {
      const client = getZoomClient();
      await client.makeHost(userId);
      setIsHost(false);
      syncParticipants();
    } catch (err) {
      console.error("[useZoomRoom] transferHost:", err);
    }
  }, [isHost, syncParticipants]);

  // ── Screen share ───────────────────────────────────────────────────────────
  const shareScreen = useCallback(async () => {
    try {
      const videoEl = document.querySelector<HTMLVideoElement>("#zoom-screen-share-video");
      await streamRef.current?.startShareScreen(videoEl ?? document.createElement("video"));
    } catch (err) {
      console.error("[useZoomRoom] shareScreen:", err);
    }
  }, []);

  const stopShareScreen = useCallback(async () => {
    try {
      await streamRef.current?.stopShareScreen();
    } catch (err) {
      console.error("[useZoomRoom] stopShareScreen:", err);
    }
  }, []);

  // ── Virtual background ─────────────────────────────────────────────────────
  const setVirtualBackground = useCallback(async (imageUrl: string) => {
    try {
      await streamRef.current?.updateVirtualBackgroundImage(imageUrl);
    } catch (err) {
      console.error("[useZoomRoom] setVirtualBackground:", err);
    }
  }, []);

  // ── Local audio/video toggle ───────────────────────────────────────────────
  const toggleLocalAudio = useCallback(async () => {
    try {
      const client = getZoomClient();
      const me = client.getCurrentUserInfo() as unknown as ZoomParticipant | null;
      if (!me) return;
      if (me.isAudioMuted) {
        await streamRef.current?.unmuteAudio(me.userId);
      } else {
        await streamRef.current?.muteAudio(me.userId);
      }
      syncParticipants();
    } catch (err) {
      console.error("[useZoomRoom] toggleLocalAudio:", err);
    }
  }, [syncParticipants]);

  const toggleLocalVideo = useCallback(async () => {
    try {
      const client = getZoomClient();
      const me = client.getCurrentUserInfo();
      if (!me) return;
      if (me.bVideoOn) {
        await streamRef.current?.stopVideo();
      } else {
        await streamRef.current?.startVideo();
      }
      syncParticipants();
    } catch (err) {
      console.error("[useZoomRoom] toggleLocalVideo:", err);
    }
  }, [syncParticipants]);

  return {
    isConnected,
    isConnecting,
    isHost,
    participants,
    localStream,
    error,
    initSession,
    leaveSession,
    muteParticipant,
    unmuteParticipant,
    muteAll,
    transferHost,
    shareScreen,
    stopShareScreen,
    setVirtualBackground,
    toggleLocalAudio,
    toggleLocalVideo,
  };
}

// ── WebRTC fallback hook (no Zoom SDK required) ───────────────────────────────

export interface WebRTCParticipant {
  userId: string;
  nickname: string;
  isMicActive: boolean;
  isCameraActive: boolean;
  role: "host" | "guest" | "vip";
}

export interface UseWebRTCMediaReturn {
  localStream: MediaStream | null;
  participants: WebRTCParticipant[];
  isHost: boolean;
  isMicActive: boolean;
  isCameraActive: boolean;
  isSDKReady: boolean;
  initLocalMedia: () => Promise<MediaStream | null>;
  toggleMic: () => void;
  toggleCamera: () => void;
  muteParticipant: (userId: string) => void;
  unmuteParticipant: (userId: string) => void;
  muteAll: () => void;
  transferHost: (userId: string) => void;
  setIsHost: (v: boolean) => void;
}

export function useWebRTCMedia(): UseWebRTCMediaReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<WebRTCParticipant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

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
      setIsSDKReady(true);
      return stream;
    } catch (err) {
      console.warn("[useWebRTCMedia] Camera/mic not available:", err);
      setIsSDKReady(true); // mark ready even without camera
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

  const muteParticipant = useCallback((userId: string) => {
    setParticipants(prev =>
      prev.map(p => p.userId === userId ? { ...p, isMicActive: false } : p)
    );
  }, []);

  const unmuteParticipant = useCallback((userId: string) => {
    setParticipants(prev =>
      prev.map(p => p.userId === userId ? { ...p, isMicActive: true } : p)
    );
  }, []);

  const muteAll = useCallback(() => {
    setParticipants(prev => prev.map(p => ({ ...p, isMicActive: false })));
  }, []);

  const transferHost = useCallback((userId: string) => {
    setParticipants(prev =>
      prev.map(p => ({
        ...p,
        role: p.userId === userId ? "host" : p.role === "host" ? "guest" : p.role,
      }))
    );
    setIsHost(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return {
    localStream,
    participants,
    isHost,
    isMicActive,
    isCameraActive,
    isSDKReady,
    initLocalMedia,
    toggleMic,
    toggleCamera,
    muteParticipant,
    unmuteParticipant,
    muteAll,
    transferHost,
    setIsHost,
  };
}
