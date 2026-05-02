"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

// ── helpers ────────────────────────────────────────────────────────────────

function extractYouTubeId(raw: string): string | null {
  const m = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m?.[1] ?? (raw.match(/^[a-zA-Z0-9_-]{11}$/) ? raw : null);
}

// ── Preset playlist ────────────────────────────────────────────────────────

const PRESET_SONGS = [
  { id: "LW5kMpGAL3o", title: "관광버스 댄스 메들리", artist: "트로트" },
  { id: "9bZkp7q19f0", title: "Gangnam Style", artist: "PSY" },
  { id: "CK1tJBVGhMQ", title: "사랑했지만", artist: "김광석" },
  { id: "O0YGBjRqe_o", title: "첫눈처럼 너에게 가겠다", artist: "에일리" },
  { id: "2XLZ4Z8styQ", title: "K-POP 파티 메들리", artist: "Various" },
  { id: "R3iFCa7OYdE", title: "애인이 되어줘", artist: "홍진호" },
];

// ── Camera view ────────────────────────────────────────────────────────────

function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"pending" | "active" | "error">("pending");
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("active");
      })
      .catch(() => setStatus("error"));
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] rounded-lg overflow-hidden flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ display: status === "active" ? "block" : "none" }} />
      {status !== "active" && (
        <div className="flex flex-col items-center gap-2 text-white/30">
          <Icon icon="solar:camera-bold" className="w-7 h-7" />
          <p className="text-xs">{status === "error" ? "카메라 접근 거부됨" : "카메라 연결 중..."}</p>
        </div>
      )}
      {/* Resize handle — cosmetic */}
      <div className="absolute bottom-1 right-1 text-white/10">
        <Icon icon="solar:alt-arrow-right-bold" className="w-3 h-3 rotate-45" />
      </div>
    </div>
  );
}

// ── YouTube embed ──────────────────────────────────────────────────────────

function YouTubeEmbed({ videoId, onClick }: { videoId: string | null; onClick?: () => void }) {
  if (!videoId) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer select-none rounded-lg"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={onClick}
      >
        <Icon icon="solar:play-circle-bold" className="w-10 h-10 text-white/20" />
        <p className="text-white/30 text-xs">클릭하여 재생</p>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,100,0,0.4)", boxShadow: "0 0 20px rgba(255,100,0,0.15)" }}>
      <iframe
        key={videoId}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0`}
        className="w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{ border: "none" }}
      />
      {/* URL 변경 badge */}
      <button
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white/70 hover:text-white transition-colors"
        style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
        onClick={onClick}
        aria-label="URL 변경"
      >
        <Icon icon="solar:link-bold" className="w-3 h-3" />
        URL 변경
      </button>
    </div>
  );
}

// ── Left panel ─────────────────────────────────────────────────────────────

function LeftPanel({
  roomId,
  videoId,
  onVideoChange,
  isHost,
}: {
  roomId: string;
  videoId: string | null;
  onVideoChange: (id: string | null) => void;
  isHost: boolean;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lyricsText, setLyricsText] = useState("");
  const [lyricsEdit, setLyricsEdit] = useState(false);

  const handlePlay = useCallback(async () => {
    const id = extractYouTubeId(urlInput.trim());
    if (!id) { setUrlError(true); return; }
    setUrlError(false);

    if (isHost) {
      setLoading(true);
      await fetch(`/api/rooms/${roomId}/youtube`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: id }),
      }).catch(() => null);
      setLoading(false);
    }
    onVideoChange(id);
    setUrlInput("");
  }, [urlInput, isHost, roomId, onVideoChange]);

  const handlePreset = async (id: string) => {
    if (isHost) {
      await fetch(`/api/rooms/${roomId}/youtube`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: id }),
      }).catch(() => null);
    }
    onVideoChange(id);
  };

  const lyricsLines = lyricsText.split("\n").filter((l) => l.trim());

  return (
    <div className="flex flex-col h-full gap-3">
      {/* YouTube URL input */}
      <div className="rounded-xl p-3 flex flex-col gap-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.3)" }}>
        <p className="text-[10px] font-bold tracking-widest text-white/40">YouTube URL 입력</p>
        <div className="flex gap-1.5">
          <input
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setUrlError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") handlePlay(); }}
            placeholder="youtube.com/watch?v=... 또는 ID"
            className="flex-1 min-w-0 bg-transparent text-white text-xs outline-none placeholder-white/20"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${urlError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: "6px", padding: "6px 8px" }}
          />
          <button
            onClick={handlePlay}
            disabled={loading || !urlInput.trim()}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: "#7C3AED" }}
          >
            {loading ? "..." : "재생"}
          </button>
        </div>
        {urlError && <p className="text-[10px] text-red-400">올바른 YouTube URL을 입력해주세요.</p>}
      </div>

      {/* Lyrics */}
      <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest text-white/40">가사 입력 (선택)</p>
          <button
            onClick={() => setLyricsEdit((v) => !v)}
            className="text-[10px] px-2 py-0.5 rounded transition-all"
            style={{ background: lyricsEdit ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.05)", color: lyricsEdit ? "#00E5FF" : "rgba(255,255,255,0.35)", border: `1px solid ${lyricsEdit ? "rgba(0,229,255,0.3)" : "rgba(255,255,255,0.08)"}` }}
          >
            {lyricsEdit ? "완료" : "편집"}
          </button>
        </div>
        {lyricsEdit ? (
          <textarea
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            placeholder={"가사를 한 줄씩 입력하면\n화면 하단에 표시됩니다"}
            rows={5}
            className="w-full text-xs text-white outline-none resize-none placeholder-white/20"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: "6px", padding: "6px 8px", lineHeight: 1.7 }}
          />
        ) : (
          <p className="text-[11px] text-white/25 leading-relaxed">
            {lyricsLines.length > 0 ? lyricsLines[0] + (lyricsLines.length > 1 ? ` +${lyricsLines.length - 1}줄` : "") : "가사 입력 버튼을 눌러 가사를 추가하면 무대 하단에 표시됩니다"}
          </p>
        )}
      </div>

      {/* Playlist */}
      <div className="flex-1 rounded-xl p-3 flex flex-col gap-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[10px] font-bold tracking-widest text-white/40">추천 플레이리스트</p>
        <div className="flex flex-col gap-1 overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {PRESET_SONGS.map((song, i) => (
            <button
              key={song.id}
              onClick={() => handlePreset(song.id)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all hover:scale-[1.01] group"
              style={{
                background: videoId === song.id ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${videoId === song.id ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <span className="text-[10px] font-black w-4 text-center flex-shrink-0" style={{ color: videoId === song.id ? "#00E5FF" : "rgba(255,255,255,0.2)" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 truncate group-hover:text-white transition-colors">{song.title}</p>
                <p className="text-[10px] text-white/30 truncate">{song.artist}</p>
              </div>
              {videoId === song.id && <Icon icon="solar:play-bold" className="w-3 h-3 text-[#00E5FF] flex-shrink-0 animate-pulse" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Chat panel ─────────────────────────────────────────────────────────────

const MOCK_CHAT = [
  { id: "c1", name: "별빛가수", text: "안녕하세요~", color: "#00E5FF" },
  { id: "c2", name: "달빛연인", text: "오늘 노래 최고다!", color: "#FF007F" },
  { id: "c3", name: "봄날의꿈", text: "다음 곡은 뭐예요?", color: "#7C3AED" },
];

function ChatPanel({ participantCount }: { participantCount: number }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MOCK_CHAT);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), name: "나", text: input.trim(), color: "#00E5FF" }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#000", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Tabs */}
      <div className="flex items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button className="flex-1 py-2.5 text-xs font-bold text-white/80 flex items-center justify-center gap-1" style={{ borderBottom: "2px solid #00E5FF" }}>
          <Icon icon="solar:chat-round-bold" className="w-3.5 h-3.5" /> 채팅
        </button>
        <button className="flex-1 py-2.5 text-xs text-white/30 flex items-center justify-center gap-1">
          <Icon icon="solar:music-note-bold" className="w-3.5 h-3.5" /> 대기열
        </button>
        <div className="px-3 py-2.5 flex items-center gap-1 text-[10px] text-white/30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          {participantCount}명
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-1.5">
            <span className="text-[10px] font-bold flex-shrink-0" style={{ color: m.color }}>{m.name}</span>
            <span className="text-[11px] text-white/70 leading-relaxed">{m.text}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="채팅 입력..."
          className="flex-1 min-w-0 bg-transparent text-white text-xs outline-none placeholder-white/20"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 10px" }}
        />
        <button onClick={send} aria-label="전송" className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)" }}>
          <Icon icon="solar:arrow-right-bold" className="w-4 h-4 text-[#00E5FF]" />
        </button>
      </div>

      {/* Reaction buttons */}
      <div className="flex justify-around py-2 px-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {["🌹", "⭐", "🔥", "💝", "👏"].map((e) => (
          <button key={e} className="text-lg hover:scale-125 transition-transform active:scale-95">{e}</button>
        ))}
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
  const [participantCount] = useState(127);
  const [leftOpen, setLeftOpen] = useState(true);
  const [timer, setTimer] = useState(0);
  const channelRef = useRef<ReturnType<typeof getSupabaseClient>["channel"] extends (...args: never[]) => infer R ? R : never | null>(null);

  // Live timer
  useEffect(() => {
    const t = setInterval(() => setTimer((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Supabase Broadcast sync (DB 스키마 불필요, 즉시 동작) ──────────────
  useEffect(() => {
    const supabase = getSupabaseClient();

    // 1) 입장 시 현재 영상 DB에서 로드 (best-effort)
    supabase.from("rooms").select("youtube_url").eq("id", roomId).single()
      .then(({ data }) => { if (data?.youtube_url) setVideoId(data.youtube_url as string); });

    // 2) Broadcast 채널 구독 — 호스트 영상 변경 이벤트 수신
    const ch = supabase
      .channel(`yt-sync:${roomId}`)
      .on("broadcast", { event: "video-change" }, ({ payload }) => {
        if (payload?.videoId !== undefined) setVideoId(payload.videoId as string | null);
      })
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [roomId]);

  // 호스트가 영상 바꿀 때 broadcast + 로컬 state 동시 업데이트
  const handleVideoChange = useCallback((id: string | null) => {
    setVideoId(id);
    // Broadcast → 모든 게스트에게 즉시 전달
    channelRef.current?.send({
      type: "broadcast",
      event: "video-change",
      payload: { videoId: id },
    });
    // DB 저장 (best-effort — youtube_url 컬럼 없어도 무방)
    fetch(`/api/rooms/${roomId}/youtube`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtube_url: id }),
    }).catch(() => {});
  }, [roomId]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0a0a0a", color: "white" }}>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2" style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/rooms/colosseum" className="text-xs font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1">
          <Icon icon="solar:arrow-left-bold" className="w-3.5 h-3.5" />
          L&apos;OXYGÈNE
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-widest text-white">THE COLOSSEUM</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400">LIVE</span>
            <span className="text-[10px] font-mono text-white/60">{fmt(timer)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/60" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon icon="solar:users-group-rounded-bold" className="w-3.5 h-3.5" />
            {participantCount}
          </div>
          <Link
            href={`/rooms/colosseum/${roomId}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#00E5FF]"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}
          >
            <Icon icon="solar:camera-bold" className="w-3.5 h-3.5" />
            Model A (Daily.co)
          </Link>
        </div>
      </div>

      {/* ── Sub toolbar ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2" style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {isHost && (
          <button className="text-xs px-2 py-1 rounded text-white/40 text-[10px]" style={{ background: "rgba(255,0,127,0.12)", border: "1px solid rgba(255,0,127,0.25)", color: "#FF007F" }}>
            디렉터 호출
          </button>
        )}
        <button
          onClick={() => setLeftOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
          style={{ background: leftOpen ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${leftOpen ? "rgba(0,229,255,0.3)" : "rgba(255,255,255,0.08)"}`, color: leftOpen ? "#00E5FF" : "rgba(255,255,255,0.5)" }}
        >
          <Icon icon="solar:music-note-bold" className="w-3.5 h-3.5" />
          🎵 노래방 {leftOpen ? "ON" : "OFF"}
        </button>
        <span className="text-white/20 text-xs">|</span>
        <span className="text-[10px] text-white/30">{nickname}</span>
        {isHost && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.35)", color: "#d4af37" }}>HOST</span>}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left panel */}
        {leftOpen && (
          <div className="w-64 flex-shrink-0 overflow-y-auto p-3" style={{ background: "#000", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <LeftPanel roomId={roomId} videoId={videoId} onVideoChange={handleVideoChange} isHost={isHost} />
          </div>
        )}

        {/* Center: YouTube (top) + Camera (bottom) */}
        <div className="flex-1 flex flex-col gap-2 p-3 min-w-0">
          {/* YouTube — flex-[2] = 2/3 of vertical space */}
          <div className="flex-[2] min-h-0">
            <YouTubeEmbed videoId={videoId} onClick={() => setLeftOpen(true)} />
          </div>

          {/* Camera — flex-[1] = 1/3 of vertical space */}
          <div className="flex-1 min-h-0">
            <CameraView />
          </div>
        </div>

        {/* Right: Chat */}
        <div className="w-72 flex-shrink-0" style={{ background: "#000" }}>
          <ChatPanel participantCount={participantCount} />
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3" style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "rgba(255,0,127,0.3)" }} />
          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "rgba(0,229,255,0.3)" }} />
        </div>
        <button
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", boxShadow: "0 0 16px rgba(0,229,255,0.15)" }}
        >
          <Icon icon="solar:microphone-bold" className="w-4 h-4" />
          마이크 잡기
        </button>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white" style={{ background: "rgba(255,0,127,0.2)", border: "1px solid rgba(255,0,127,0.4)" }}>
            <Icon icon="solar:gift-bold" className="w-3.5 h-3.5" /> 꽃다발
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.35)" }}>
            <Icon icon="solar:star-bold" className="w-3.5 h-3.5" /> 샴페인
          </button>
          <button aria-label="설정" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon icon="solar:settings-bold" className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>
    </div>
  );
}
