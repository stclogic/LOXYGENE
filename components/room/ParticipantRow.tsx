"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocalStream } from "@/components/room/ZoomVideoRoom";

export interface RoomParticipant {
  id: string;
  nickname: string;
  isMuted: boolean;
  isCurrentSinger: boolean;
  isVIP?: boolean;
  isHost?: boolean;
  videoStream?: MediaStream | null;
}

interface ParticipantRowProps {
  participants: RoomParticipant[];
  activeSingerId?: string | null;
  currentUserId?: string;
  isHost: boolean;
  onMicToggle?: (id: string) => void;
  onAssign?: (id: string) => void;
  onTransferHost?: (id: string) => void;
}

// Deterministic color per nickname
const avatarColor = (nick: string) => {
  const palette = ["#00E5FF", "#FF007F", "#C9A84C", "#A855F7", "#22C55E", "#F59E0B"];
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
};

interface PopupState { id: string; x: number; y: number }

// ── Video thumbnail ───────────────────────────────────────────────────────────

function VideoThumb({
  stream,
  nickname,
  size = 40,
}: {
  stream: MediaStream | null | undefined;
  nickname: string;
  size?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const color = avatarColor(nickname);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (stream) {
    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          transform: "scaleX(-1)",
        }}
      />
    );
  }

  // Avatar fallback
  return (
    <div
      className="flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        color,
      }}
    >
      {nickname[0]}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ParticipantRow({
  participants,
  activeSingerId,
  currentUserId,
  isHost,
  onMicToggle,
  onAssign,
  onTransferHost,
}: ParticipantRowProps) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const { localStream, isCameraActive, isMicActive } = useLocalStream();

  const handleThumbClick = (e: React.MouseEvent, id: string) => {
    if (!isHost) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopup(prev => prev?.id === id ? null : { id, x: rect.left, y: rect.top });
  };

  return (
    <div
      className="relative flex-shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar px-2 py-1.5"
      style={{ background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)", minHeight: 64 }}
      onClick={() => setPopup(null)}
    >
      {participants.map(p => {
        const isActive = p.isCurrentSinger || p.id === activeSingerId;
        const color = avatarColor(p.nickname);
        const isSelf = p.id === currentUserId;

        // Which stream to show:
        // - Local participant + camera active: use WebRTC localStream from context
        // - Local participant + camera off: null (show avatar + camera-slash overlay)
        // - VIP remote: use their videoStream prop if provided
        // - Others: no video (avatar)
        const streamToShow = isSelf
          ? (isCameraActive ? localStream : null)
          : (p.isVIP ? p.videoStream : null);

        // For local participant, use real track state; for others, use the prop
        const isMutedIndicator = isSelf ? !isMicActive : p.isMuted;

        return (
          <div
            key={p.id}
            className="relative flex-shrink-0 flex flex-col items-center gap-0.5 rounded-lg cursor-pointer select-none"
            style={{
              width: 52, padding: 3,
              background: isActive ? "rgba(0,229,255,0.06)" : "transparent",
              border: p.isVIP
                ? `1px solid ${isActive ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.25)"}`
                : `1px solid ${isActive ? "rgba(0,229,255,0.35)" : "transparent"}`,
              opacity: activeSingerId && !isActive ? 0.45 : 1,
              transition: "all 0.3s",
              boxShadow: isActive ? (p.isVIP ? "0 0 8px rgba(201,168,76,0.25)" : "0 0 8px rgba(0,229,255,0.2)") : "none",
            }}
            onClick={e => handleThumbClick(e, p.id)}
            title={isHost ? "클릭하여 제어" : p.nickname}
          >
            {/* Avatar / Video */}
            <div
              className="relative overflow-hidden flex-shrink-0"
              style={{
                width: 40, height: 40,
                borderRadius: "50%",
                border: `2px solid ${isActive ? color : p.isVIP ? "rgba(201,168,76,0.7)" : "rgba(255,255,255,0.1)"}`,
                boxShadow: p.isVIP ? "0 0 8px rgba(201,168,76,0.3)" : undefined,
              }}
            >
              <VideoThumb stream={streamToShow} nickname={p.nickname} size={40} />

              {/* Camera-off overlay for local participant */}
              {isSelf && !isCameraActive && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                >
                  <Icon
                    icon="solar:camera-slash-bold"
                    className="w-3.5 h-3.5"
                    style={{ color: "rgba(239,68,68,0.75)" }}
                  />
                </div>
              )}
            </div>

            {/* Nickname */}
            <span className="text-[9px] text-white/40 w-full text-center truncate leading-none mt-0.5 px-0.5">
              {p.nickname.slice(0, 5)}{isSelf ? " (나)" : ""}
            </span>

            {/* VIP badge — gold "V" top-right */}
            {p.isVIP && (
              <span
                className="absolute top-0.5 right-0.5 text-[8px] leading-none px-0.5 py-0.5 rounded font-black"
                style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)" }}
              >
                V
              </span>
            )}

            {/* Host crown */}
            {p.isHost && (
              <span className="absolute top-0.5 left-0.5 text-[9px] leading-none">👑</span>
            )}

            {/* Singing badge */}
            {isActive && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] leading-none">🎤</span>
            )}

            {/* Muted slash */}
            {isMutedIndicator && !isActive && (
              <div className="absolute bottom-[18px] right-[2px]">
                <Icon icon="solar:microphone-slash-bold" className="w-3 h-3" style={{ color: "rgba(239,68,68,0.8)" }} />
              </div>
            )}
          </div>
        );
      })}

      {/* Host control popup */}
      {popup && isHost && (() => {
        const target = participants.find(p => p.id === popup.id);
        if (!target) return null;
        return (
          <div
            className="fixed z-50 rounded-xl p-1.5 flex flex-col gap-0.5 min-w-[140px]"
            style={{
              top: Math.max(8, popup.y - 130),
              left: Math.max(8, popup.x),
              background: "rgba(12,12,12,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white/50 text-[10px] px-2 py-1 border-b border-white/5">{target.nickname}</p>
            <button
              onClick={() => { onMicToggle?.(popup.id); setPopup(null); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/5 transition-colors text-left"
            >
              <Icon icon={target.isMuted ? "solar:microphone-bold" : "solar:microphone-slash-bold"} className="w-3.5 h-3.5" />
              {target.isMuted ? "🎤 마이크 켜기" : "🔇 음소거"}
            </button>
            <button
              onClick={() => { onAssign?.(popup.id); setPopup(null); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/5 transition-colors text-left"
            >
              <Icon icon="solar:music-note-bold" className="w-3.5 h-3.5" />
              🎵 노래 지정
            </button>
            <button
              onClick={() => { onTransferHost?.(popup.id); setPopup(null); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/5 transition-colors text-left"
            >
              <Icon icon="solar:crown-bold" className="w-3.5 h-3.5 text-[#C9A84C]" />
              👑 호스트 넘기기
            </button>
          </div>
        );
      })()}
    </div>
  );
}
