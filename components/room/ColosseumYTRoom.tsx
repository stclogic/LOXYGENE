"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { FloatingChat } from "@/components/room/FloatingChat";

// ── helpers ────────────────────────────────────────────────────────────────

function extractYouTubeId(raw: string): string | null {
  const m = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m?.[1] ?? (raw.match(/^[a-zA-Z0-9_-]{11}$/) ? raw : null);
}

// ── Brick-wall studio background ──────────────────────────────────────────

function BrickWallBg() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base dark warm tone */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0e0806 0%, #130d09 50%, #0a0704 100%)" }} />

      {/* Brick rows — horizontal mortar lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 34px, rgba(0,0,0,0.55) 34px, rgba(0,0,0,0.55) 36px)",
        backgroundSize: "100% 36px",
      }} />

      {/* Brick columns — staggered vertical mortar (even rows) */}
      <div className="absolute inset-0" style={{
        backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 118px, rgba(0,0,0,0.55) 118px, rgba(0,0,0,0.55) 120px)",
        backgroundSize: "120px 72px",
        backgroundPosition: "0 0",
      }} />

      {/* Brick columns — staggered vertical mortar (odd rows, offset) */}
      <div className="absolute inset-0" style={{
        backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 118px, rgba(0,0,0,0.55) 118px, rgba(0,0,0,0.55) 120px)",
        backgroundSize: "120px 72px",
        backgroundPosition: "60px 36px",
      }} />

      {/* Warm brick tint */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 40%, rgba(90,40,15,0.18) 0%, transparent 70%)" }} />

      {/* Luxury gold rim-light — top */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 30%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.25) 70%, transparent 100%)" }} />

      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)" }} />
    </div>
  );
}

// ── YouTube iframe ─────────────────────────────────────────────────────────

function YouTubeEmbed({ videoId }: { videoId: string | null }) {
  if (!videoId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: "#0a0704" }}>
        <Icon icon="solar:video-library-bold" className="w-12 h-12 text-white/10" />
        <p className="text-white/20 text-sm text-center px-4">호스트가 영상을 선택하면<br />여기에 표시됩니다</p>
      </div>
    );
  }

  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0`;

  return (
    <iframe
      key={videoId}
      src={src}
      className="w-full h-full"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      style={{ border: "none" }}
    />
  );
}

// ── Host webcam panel ──────────────────────────────────────────────────────

function HostWebcam({ isHost }: { isHost: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setActive(true);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center" style={{ background: "#050302" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ display: active ? "block" : "none" }}
      />

      {!active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
            <Icon icon="solar:camera-bold" className="w-6 h-6 text-[#00E5FF]/50" />
          </div>
          {isHost ? (
            <>
              <p className="text-white/30 text-xs text-center">호스트 캠을 켜세요</p>
              {error && <p className="text-red-400/70 text-[10px] text-center">카메라 접근이 거부됐어요</p>}
              <button
                onClick={startCam}
                className="text-xs px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}
              >
                카메라 켜기
              </button>
            </>
          ) : (
            <p className="text-white/20 text-xs text-center">호스트 캠 대기 중</p>
          )}
        </div>
      )}

      {active && isHost && (
        <button
          onClick={stopCam}
          aria-label="카메라 끄기"
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)" }}
        >
          <Icon icon="solar:camera-slash-bold" className="w-3.5 h-3.5 text-red-400" />
        </button>
      )}
    </div>
  );
}

// ── Host YouTube URL control panel ────────────────────────────────────────

function HostYTControl({
  roomId,
  currentVideoId,
  onVideoChange,
}: {
  roomId: string;
  currentVideoId: string | null;
  onVideoChange: (id: string | null) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSet = async () => {
    setErr("");
    const id = extractYouTubeId(input.trim());
    if (!id) { setErr("올바른 YouTube URL을 입력해주세요."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/youtube`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: id }),
      });
      if (res.ok) {
        onVideoChange(id);
        setInput("");
      } else {
        const d = await res.json();
        setErr(d.error ?? "오류가 발생했습니다.");
      }
    } catch {
      setErr("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    await fetch(`/api/rooms/${roomId}/youtube`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtube_url: null }),
    });
    onVideoChange(null);
    setInput("");
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <Icon icon="solar:tv-bold" className="w-3.5 h-3.5 text-[#00E5FF]/60 flex-shrink-0" />
      <input
        value={input}
        onChange={(e) => { setInput(e.target.value); setErr(""); }}
        onKeyDown={(e) => { if (e.key === "Enter") handleSet(); }}
        placeholder="YouTube URL 또는 영상 ID"
        className="flex-1 min-w-0 bg-transparent text-white text-xs outline-none placeholder-white/20"
      />
      {err && <span className="text-red-400 text-[10px] flex-shrink-0">{err}</span>}
      {currentVideoId && (
        <button
          onClick={handleClear}
          disabled={loading}
          className="flex-shrink-0 px-2 py-1 rounded text-[10px] font-medium"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
        >
          중지
        </button>
      )}
      <button
        onClick={handleSet}
        disabled={loading || !input.trim()}
        className="flex-shrink-0 px-2 py-1 rounded text-[10px] font-medium disabled:opacity-40"
        style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}
      >
        {loading ? "..." : "재생"}
      </button>
    </div>
  );
}

// ── Participant chip row ───────────────────────────────────────────────────

const MOCK_GUESTS = [
  { id: "g1", name: "별빛가수",   color: "#00E5FF" },
  { id: "g2", name: "달빛연인",   color: "#FF007F" },
  { id: "g3", name: "봄날의꿈",   color: "#7C3AED" },
  { id: "g4", name: "가을바람",   color: "#F59E0B" },
  { id: "g5", name: "구름위에",   color: "#10B981" },
];

function ParticipantRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ background: "#000000" }}>
      <div className="flex -space-x-2">
        {MOCK_GUESTS.slice(0, 5).map((g) => (
          <div
            key={g.id}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
            style={{ background: g.color + "22", border: `1.5px solid ${g.color}66`, color: g.color, zIndex: 1 }}
            title={g.name}
          >
            {g.name[0]}
          </div>
        ))}
      </div>
      <span className="text-white/30 text-[10px]">{count}명 참여 중</span>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-[10px] font-bold tracking-wider">LIVE</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface ColosseumYTRoomProps {
  roomId: string;
  nickname: string;
  isHost?: boolean;
}

export default function ColosseumYTRoom({ roomId, nickname, isHost = false }: ColosseumYTRoomProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(127);
  const [chatOpen, setChatOpen] = useState(false);

  // ── Supabase Realtime: sync youtube_url for all guests ────────────────
  useEffect(() => {
    const supabase = getSupabaseClient();

    // Fetch current state
    supabase
      .from("rooms")
      .select("youtube_url, participant_count")
      .eq("id", roomId)
      .single()
      .then(({ data }) => {
        if (data?.youtube_url) setVideoId(data.youtube_url);
        if (data?.participant_count) setParticipantCount(data.participant_count);
      });

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`colosseum-yt:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as Record<string, string | number | null>;
          if ("youtube_url" in row) setVideoId(row.youtube_url as string | null);
          if ("participant_count" in row && typeof row.participant_count === "number") {
            setParticipantCount(row.participant_count);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ fontFamily: "inherit" }}>

      {/* ── Background ──────────────────────────────────────────────────── */}
      <BrickWallBg />

      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link
          href="/rooms/colosseum"
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <Icon icon="solar:arrow-left-bold" className="w-4 h-4" />
          THE COLOSSEUM
        </Link>

        {/* Model toggle badge */}
        <Link
          href={`/rooms/colosseum/${roomId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", boxShadow: "0 0 8px rgba(0,229,255,0.1)" }}
        >
          <Icon icon="solar:camera-bold" className="w-3.5 h-3.5" />
          Model A (Daily.co)로 전환
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ boxShadow: "0 0 6px rgba(239,68,68,0.8)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{nickname}</span>
          {isHost && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)", color: "#d4af37" }}>HOST</span>
          )}
        </div>
      </div>

      {/* ── L'OXYGÈNE center logo ────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-center py-2" style={{ background: "rgba(0,0,0,0.3)" }}>
        <h1
          className="text-xl font-black tracking-[0.3em] select-none"
          style={{
            color: "#00E5FF",
            textShadow: "0 0 12px rgba(0,229,255,0.8), 0 0 30px rgba(0,229,255,0.4), 0 0 60px rgba(0,229,255,0.15)",
            letterSpacing: "0.35em",
          }}
        >
          L&apos;OXYGÈNE
        </h1>
      </div>

      {/* ── Main stage: 7:3 split ────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 gap-2 px-3 pb-2 min-h-0" style={{ height: "calc(100vh - 220px)" }}>

        {/* Left 70% — YouTube content */}
        <div className="relative flex flex-col overflow-hidden rounded-xl" style={{ flex: "7", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 0 30px rgba(0,0,0,0.6)" }}>
          {/* Gold top accent */}
          <div className="absolute top-0 left-0 right-0 h-px z-10" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

          <div className="flex-1 min-h-0">
            <YouTubeEmbed videoId={videoId} />
          </div>

          {/* Host URL control bar — only visible to host */}
          {isHost && (
            <HostYTControl
              roomId={roomId}
              currentVideoId={videoId}
              onVideoChange={setVideoId}
            />
          )}

          {/* Currently playing badge */}
          {videoId && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg z-10" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,229,255,0.2)", backdropFilter: "blur(8px)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="text-[10px] text-[#00E5FF] font-medium">재생 중</span>
            </div>
          )}
        </div>

        {/* Right 30% — Host webcam */}
        <div className="relative flex flex-col overflow-hidden rounded-xl" style={{ flex: "3", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 0 30px rgba(0,0,0,0.6)" }}>
          {/* Gold top accent */}
          <div className="absolute top-0 left-0 right-0 h-px z-10" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

          <div className="flex-1 min-h-0">
            <HostWebcam isHost={isHost} />
          </div>

          {/* Label */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-medium" style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
            HOST CAM
          </div>
        </div>
      </div>

      {/* ── Solid black footer ───────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0" style={{ background: "#000000" }}>
        {/* Participant row */}
        <ParticipantRow count={participantCount} />

        {/* Action bar */}
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#000000", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen((v) => !v)}
            aria-label="채팅"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{
              background: chatOpen ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.05)",
              border: chatOpen ? "1px solid rgba(0,229,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: chatOpen ? "#00E5FF" : "rgba(255,255,255,0.5)",
            }}
          >
            <Icon icon="solar:chat-round-bold" className="w-4 h-4" />
            채팅
          </button>

          {/* Gift */}
          <button
            aria-label="선물"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.25)", color: "#FF007F" }}
          >
            <Icon icon="solar:gift-bold" className="w-4 h-4" />
            선물
          </button>

          {/* Karaoke queue */}
          <button
            aria-label="신청곡"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#7C3AED" }}
          >
            <Icon icon="solar:microphone-bold" className="w-4 h-4" />
            신청곡
          </button>

          <div className="flex-1" />

          {/* Room ID badge */}
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            #{roomId.slice(-6)}
          </span>
        </div>
      </div>

      {/* ── Floating chat ────────────────────────────────────────────────── */}
      {chatOpen && (
        <div className="fixed bottom-24 left-4 w-72 z-50">
          <FloatingChat roomId={roomId} nickname={nickname} accentColor="#00E5FF" onClose={() => setChatOpen(false)} />
        </div>
      )}
    </div>
  );
}
