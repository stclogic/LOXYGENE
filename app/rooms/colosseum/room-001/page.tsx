"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Leaderboard } from "@/components/room/Leaderboard";
import { BottomActionBar } from "@/components/room/BottomActionBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRoomStore } from "@/lib/store/roomStore";
import Link from "next/link";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";

// ── Constants ─────────────────────────────────────────────────────────────────
const SONG_TITLE = "안동역에서";
const ARTIST_NAME = "진성";
const YOUTUBE_ID = "L26jSx5TZns";
const MY_ID = "p3"; // guest test identity
const MY_NICKNAME = "여름밤";

// ── Types ──────────────────────────────────────────────────────────────────────
interface QueueItem {
  id: string;
  songTitle: string;
  artist: string;
  singerName: string | null;
  singerId: string | null;
  status: "waiting" | "active" | "done";
  pendingApproval?: boolean;
}

interface Participant {
  id: string;
  nickname: string;
  isMuted: boolean;
  isCurrentSinger: boolean;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_SONGS = [
  { id: "s1", title: "안동역에서",  artist: "진성"   },
  { id: "s2", title: "사랑했나봐",  artist: "이창원" },
  { id: "s3", title: "봄날",        artist: "BTS"    },
  { id: "s4", title: "밤편지",      artist: "IU"     },
  { id: "s5", title: "너를 위해",   artist: "임재범" },
  { id: "s6", title: "사랑했지만",  artist: "김광석" },
  { id: "s7", title: "첫눈처럼 너에게 가겠다", artist: "엑소" },
];

const INIT_PARTICIPANTS: Participant[] = [
  { id: "p1", nickname: "가을바람",   isMuted: true,  isCurrentSinger: false },
  { id: "p2", nickname: "봄날의꿈",   isMuted: true,  isCurrentSinger: false },
  { id: "p3", nickname: "여름밤",     isMuted: true,  isCurrentSinger: false },
  { id: "p4", nickname: "하늘별",     isMuted: true,  isCurrentSinger: false },
  { id: "p5", nickname: "별빛가수",   isMuted: true,  isCurrentSinger: false },
  { id: "p6", nickname: "달빛소나타", isMuted: true,  isCurrentSinger: false },
];

const INIT_QUEUE: QueueItem[] = [
  { id: "q1", songTitle: "사랑했지만",            artist: "김광석", singerName: "가을바람", singerId: "p1", status: "waiting" },
  { id: "q2", songTitle: "첫눈처럼 너에게 가겠다", artist: "엑소",   singerName: "봄날의꿈", singerId: "p2", status: "waiting" },
  { id: "q3", songTitle: "너에게 난, 나에게 넌",   artist: "god",    singerName: null,       singerId: null, status: "waiting" },
  { id: "q4", songTitle: "그녀가 처음 울던 날",    artist: "이문세", singerName: null,       singerId: null, status: "waiting" },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function ColosseumRoom001Page() {
  // Role
  const [isHost, setIsHost] = useState(true);

  // Video
  const [started, setStarted] = useState(false);
  const [showSongInfo, setShowSongInfo] = useState(false);
  const songInfoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [guestRequestOpen, setGuestRequestOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>(INIT_QUEUE);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(true);

  // Participants
  const [participants, setParticipants] = useState<Participant[]>(INIT_PARTICIPANTS);
  const [participantModalQueueId, setParticipantModalQueueId] = useState<string | null>(null);

  // Now playing overlay
  const [nowPlaying, setNowPlaying] = useState<{ song: string; singer: string } | null>(null);
  const [nowPlayingVisible, setNowPlayingVisible] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gifts
  const [lastGift, setLastGift] = useState<string | null>(null);
  const [directorOpen, setDirectorOpen] = useState(false);

  const gifts = useRoomStore((s) => s.gifts);

  // ── Gift toast ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gifts.length > 0) {
      const latest = gifts[gifts.length - 1];
      setLastGift(latest.type === "bouquet" ? "💐 꽃다발 전송!" : "🍾 샴페인 전송!");
      const t = setTimeout(() => setLastGift(null), 2000);
      return () => clearTimeout(t);
    }
  }, [gifts]);

  // ── Close search on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cleanup timers ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (songInfoTimerRef.current) clearTimeout(songInfoTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  const filteredSongs = searchQuery.length >= 2
    ? MOCK_SONGS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePlay = () => {
    setStarted(true);
    setShowSongInfo(true);
    songInfoTimerRef.current = setTimeout(() => setShowSongInfo(false), 3000);
  };

  const handleAddSong = (song: typeof MOCK_SONGS[0]) => {
    const newItem: QueueItem = {
      id: `q-${Date.now()}`,
      songTitle: song.title,
      artist: song.artist,
      singerName: null,
      singerId: null,
      status: "waiting",
    };
    setQueue(prev => [...prev, newItem]);
    setSearchQuery("");
    setShowResults(false);
    showToast("대기열에 추가되었습니다");
  };

  const handleGuestRequest = (song: typeof MOCK_SONGS[0]) => {
    const newItem: QueueItem = {
      id: `req-${Date.now()}`,
      songTitle: song.title,
      artist: song.artist,
      singerName: MY_NICKNAME,
      singerId: MY_ID,
      status: "waiting",
      pendingApproval: true,
    };
    setQueue(prev => [...prev, newItem]);
    setSearchQuery("");
    setShowResults(false);
    setGuestRequestOpen(false);
    showToast("신청이 접수되었습니다");
  };

  const handleRemoveSong = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    if (activeSongId === id) {
      setActiveSongId(null);
      setNowPlaying(null);
      setParticipants(prev => prev.map(p => ({ ...p, isMuted: true, isCurrentSinger: false })));
    }
  };

  const handleStartSong = (item: QueueItem) => {
    setQueue(prev => prev.map(q => ({
      ...q,
      status: q.id === item.id ? "active" : q.status === "active" ? "done" : q.status,
    })));
    setActiveSongId(item.id);
    setParticipants(prev => prev.map(p => ({
      ...p,
      isCurrentSinger: p.id === item.singerId,
      isMuted: p.id !== item.singerId,
    })));
    const info = { song: `${item.songTitle} - ${item.artist}`, singer: item.singerName ?? "미배정" };
    setNowPlaying(info);
    setNowPlayingVisible(true);
    setTimeout(() => setNowPlayingVisible(false), 3000);
    showToast(`🎤 ${item.singerName ?? "미배정"}님 시작!`);
  };

  const handleAssignParticipant = (queueId: string, p: Participant) => {
    setQueue(prev => prev.map(q => q.id === queueId ? { ...q, singerName: p.nickname, singerId: p.id } : q));
    setParticipantModalQueueId(null);
    showToast(`${p.nickname}님 배정 완료`);
  };

  const handleToggleMic = (participantId: string) => {
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isMuted: !p.isMuted } : p));
  };

  const handleApproveRequest = (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, pendingApproval: false } : q));
    showToast("신청 승인됨");
  };

  const handleRejectRequest = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    showToast("신청 거절됨");
  };

  const activeItem = queue.find(q => q.id === activeSongId) ?? null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-[#070707] min-h-screen lg:h-screen lg:overflow-hidden relative overflow-x-hidden">

      {/* Home button */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00E5FF] bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#00E5FF]/50 transition-all"
      >
        ← L&apos;OXYGÈNE
      </Link>

      {/* Role toggle (testing) */}
      <button
        onClick={() => setIsHost(h => !h)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded text-[10px] font-medium transition-all hover:opacity-80"
        style={{
          background: isHost ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.05)",
          border: isHost ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(255,255,255,0.1)",
          color: isHost ? "#00E5FF" : "rgba(255,255,255,0.4)",
        }}
      >
        {isHost ? "호스트 모드" : "참여자 모드"}
      </button>

      {/* Director FAB */}
      <button
        onClick={() => setDirectorOpen(true)}
        className="fixed top-14 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F", backdropFilter: "blur(12px)", boxShadow: "0 0 12px rgba(255,0,127,0.15)" }}
      >
        <Icon icon="solar:user-star-bold" className="w-3.5 h-3.5" />
        디렉터 호출
      </button>
      <QuickCallModal open={directorOpen} onClose={() => setDirectorOpen(false)} roomId="room-001" />

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)", filter: "blur(80px)", animation: "float-blob 12s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #FF007F 0%, transparent 70%)", filter: "blur(80px)", animation: "float-blob 14s ease-in-out infinite reverse" }} />
      </div>

      {/* Top nav */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "rgba(7,7,7,0.9)", borderBottom: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}>
        <Link href="/rooms/colosseum" className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors">
          <Icon icon="solar:arrow-left-bold" className="w-5 h-5" />
          <span className="text-sm">나가기</span>
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-[#00E5FF] font-black text-sm tracking-widest" style={{ textShadow: "0 0 10px rgba(0,229,255,0.5)" }}>
            THE COLOSSEUM
          </h1>
          <p className="text-white/40 text-xs hidden sm:block">90년대 감성 여행 🎵</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => setShowQueue(!showQueue)}
            className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs transition-colors">
            <Icon icon="solar:list-bold" className="w-4 h-4" />
            <span className="hidden sm:inline">대기열</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:user-bold" className="text-white/40 w-4 h-4" />
            <span className="text-white/60 text-sm">127</span>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="relative z-10 flex flex-col lg:flex-row flex-1 gap-3 p-3
                      pb-[88px] lg:pb-3
                      lg:overflow-hidden">

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 lg:overflow-hidden">

          {/* Video player */}
          <div className="lg:flex-1 lg:min-h-0 relative rounded-xl overflow-hidden bg-black"
            style={{ aspectRatio: "16/9" }}>

            {started && (
              <iframe
                key="yt-iframe"
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
                title={`${SONG_TITLE} - ${ARTIST_NAME}`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}

            {!started && (
              <div className="absolute inset-0 bg-[#070707]"
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }}>
                <div className="absolute inset-0" style={{ background: "rgba(7,7,7,0.55)" }} />
              </div>
            )}

            {/* Song info on play */}
            {showSongInfo && (
              <div className="absolute top-4 left-0 right-0 flex justify-center z-20 pointer-events-none"
                style={{ animation: "fadeInOut 3s ease forwards" }}>
                <div className="px-4 py-2.5 rounded-xl flex flex-col items-center gap-0.5"
                  style={{ background: "rgba(7,7,7,0.75)", border: "1px solid rgba(0,229,255,0.2)", backdropFilter: "blur(12px)" }}>
                  <span className="text-white font-black text-base tracking-wide" style={{ textShadow: "0 0 12px rgba(0,229,255,0.5)" }}>{SONG_TITLE}</span>
                  <span className="text-white/60 text-xs">{ARTIST_NAME}</span>
                  <span className="text-[#00E5FF] text-[10px] tracking-widest font-medium mt-0.5">🎤 KARAOKE VER.</span>
                </div>
              </div>
            )}

            {/* Now playing overlay (3s fade) */}
            {nowPlayingVisible && nowPlaying && (
              <div className="absolute top-4 left-0 right-0 flex justify-center z-20 pointer-events-none"
                style={{ animation: "fadeInOut 3s ease forwards" }}>
                <div className="px-4 py-2.5 rounded-xl flex flex-col items-center gap-0.5"
                  style={{ background: "rgba(7,7,7,0.8)", border: "1px solid rgba(0,229,255,0.25)", backdropFilter: "blur(12px)" }}>
                  <span className="text-[#00E5FF] text-[10px] tracking-widest font-bold">🎤 NOW SINGING</span>
                  <span className="text-white font-black text-sm tracking-wide">{nowPlaying.song}</span>
                  <span className="text-white/60 text-xs">{nowPlaying.singer}</span>
                </div>
              </div>
            )}

            {/* Active singer badge — persistent bottom-left */}
            {activeItem && (
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(7,7,7,0.75)", border: "1px solid rgba(0,229,255,0.2)", backdropFilter: "blur(8px)" }}>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse"
                  style={{ background: "rgba(0,229,255,0.2)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.4)" }}>
                  🎤 LIVE
                </span>
                <div>
                  <p className="text-white/90 text-[11px] font-semibold leading-tight">{activeItem.singerName ?? "미배정"}</p>
                  <p className="text-white/40 text-[10px] leading-tight">{activeItem.songTitle}</p>
                </div>
              </div>
            )}

            {/* Play button */}
            {!started && (
              <button onClick={handlePlay}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 group">
                <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95"
                  style={{ background: "rgba(255,0,127,0.1)", border: "2px solid rgba(255,0,127,0.5)", backdropFilter: "blur(12px)", boxShadow: "0 0 30px rgba(255,0,127,0.3), inset 0 0 20px rgba(255,0,127,0.05)" }}>
                  <Icon icon="solar:play-circle-linear" className="w-10 h-10 text-[#FF007F]" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,127,0.8))" }} />
                </div>
                <div className="px-4 py-2 rounded-full text-center"
                  style={{ background: "rgba(7,7,7,0.7)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                  <p className="text-white/90 text-sm font-semibold">▶ {SONG_TITLE} - {ARTIST_NAME}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">(가라오케)</p>
                </div>
              </button>
            )}
          </div>

          {/* Participant grid */}
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <Icon icon="solar:users-group-two-rounded-bold" className="text-white/30 w-4 h-4" />
              <span className="text-white/30 text-xs">참여자</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-2">
              {participants.map(p => (
                <div key={p.id} className="relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300"
                  style={{
                    background: p.isCurrentSinger ? "rgba(0,229,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: p.isCurrentSinger ? "1px solid rgba(0,229,255,0.3)" : "1px solid rgba(255,255,255,0.04)",
                    opacity: activeSongId && !p.isCurrentSinger ? 0.4 : 1,
                    boxShadow: p.isCurrentSinger ? "0 0 10px rgba(0,229,255,0.15)" : "none",
                  }}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: p.isCurrentSinger ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.08)", color: p.isCurrentSinger ? "#00E5FF" : "rgba(255,255,255,0.5)" }}>
                    {p.nickname[0]}
                  </div>
                  <span className="text-[10px] text-white/50 truncate w-full text-center">{p.nickname}</span>
                  {/* LIVE badge */}
                  {p.isCurrentSinger && (
                    <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded font-bold animate-pulse leading-none"
                      style={{ background: "rgba(0,229,255,0.2)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.4)" }}>
                      LIVE
                    </span>
                  )}
                  {/* Mic icon */}
                  {isHost ? (
                    <button onClick={() => handleToggleMic(p.id)} className="transition-transform hover:scale-110 active:scale-95" title={p.isMuted ? "음소거 해제" : "음소거"}>
                      <Icon icon={p.isMuted ? "solar:microphone-slash-bold" : "solar:microphone-bold"} className="w-3.5 h-3.5"
                        style={{ color: p.isMuted ? "rgba(255,255,255,0.2)" : "#22C55E" }} />
                    </button>
                  ) : (
                    <Icon icon={p.isMuted ? "solar:microphone-slash-bold" : "solar:microphone-bold"} className="w-3.5 h-3.5"
                      style={{ color: p.isMuted ? "rgba(255,255,255,0.2)" : "#22C55E" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action bar — desktop only */}
          <div className="hidden lg:block">
            <BottomActionBar />
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 w-full lg:w-64 lg:flex-shrink-0 lg:overflow-y-auto hide-scrollbar">
          <Leaderboard />

          {showQueue && (
            <GlassCard className="p-3 flex flex-col gap-3 min-h-0">

              {/* ── Host: Song search ────────────────────────────────────── */}
              {isHost && (
                <div ref={searchRef} className="relative flex flex-col gap-2">
                  <p className="text-white/60 text-xs font-medium">🎵 노래 추가</p>
                  <div className="relative">
                    <Icon icon="solar:magnifier-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    <input
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setShowResults(e.target.value.length >= 2); }}
                      onFocus={() => { if (searchQuery.length >= 2) setShowResults(true); }}
                      placeholder="가라오케 곡 검색..."
                      className="w-full pl-8 pr-7 py-2 rounded-lg bg-white/5 text-white/80 text-xs placeholder-white/25 outline-none transition-all"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: "none" }}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                      onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                    />
                    {searchQuery && (
                      <button onClick={() => { setSearchQuery(""); setShowResults(false); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Results dropdown */}
                  {showResults && filteredSongs.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 rounded-lg overflow-hidden shadow-2xl"
                      style={{ background: "rgba(14,14,14,0.98)", border: "1px solid rgba(0,229,255,0.15)" }}>
                      {filteredSongs.map(song => (
                        <div key={song.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-xs font-semibold truncate">{song.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-white/40 text-[10px]">{song.artist}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded font-medium"
                                style={{ background: "rgba(0,229,255,0.08)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.15)" }}>
                                🎤 가라오케
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddSong(song)}
                            className="flex-shrink-0 px-2 py-1 rounded text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                            추가
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {showResults && filteredSongs.length === 0 && searchQuery.length >= 2 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 px-3 py-3 rounded-lg text-center"
                      style={{ background: "rgba(14,14,14,0.98)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white/30 text-xs">검색 결과 없음</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Guest: 신청하기 toggle ───────────────────────────────── */}
              {!isHost && (
                <div ref={searchRef} className="relative flex flex-col gap-2">
                  <button
                    onClick={() => setGuestRequestOpen(o => !o)}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: guestRequestOpen ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${guestRequestOpen ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.08)"}`, color: guestRequestOpen ? "#00E5FF" : "rgba(255,255,255,0.6)" }}>
                    🎤 신청하기
                  </button>
                  {guestRequestOpen && (
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Icon icon="solar:magnifier-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        <input
                          value={searchQuery}
                          onChange={e => { setSearchQuery(e.target.value); setShowResults(e.target.value.length >= 2); }}
                          placeholder="노래 검색..."
                          className="w-full pl-8 pr-7 py-2 rounded-lg bg-white/5 text-white/80 text-xs placeholder-white/25 outline-none"
                          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                          onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                        />
                        {searchQuery && (
                          <button onClick={() => { setSearchQuery(""); setShowResults(false); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                            <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {showResults && filteredSongs.length > 0 && (
                        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                          {filteredSongs.map(song => (
                            <div key={song.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-white/5 transition-colors"
                              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-white/80 text-xs truncate">{song.title}</p>
                                <p className="text-white/40 text-[10px]">{song.artist}</p>
                              </div>
                              <button onClick={() => handleGuestRequest(song)}
                                className="flex-shrink-0 px-2 py-1 rounded text-[11px] font-bold transition-all hover:scale-105"
                                style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                                신청
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Queue header ─────────────────────────────────────────── */}
              <div className="flex items-center gap-2">
                <Icon icon="solar:microphone-bold" className="text-[#00E5FF] w-4 h-4" />
                <h3 className="text-white font-bold text-sm tracking-wider">대기열</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(0,229,255,0.1)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>
                  {queue.filter(q => q.status !== "done").length}곡
                </span>
              </div>

              {/* ── Queue items ───────────────────────────────────────────── */}
              <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar">
                {queue.length === 0 && (
                  <p className="text-white/20 text-xs text-center py-4 italic">대기열이 비어 있습니다</p>
                )}
                {queue.map((item, index) => (
                  <div key={item.id} className="rounded-lg flex flex-col gap-1.5 p-2.5 transition-all"
                    style={{
                      background: item.status === "active" ? "rgba(0,229,255,0.05)" : item.pendingApproval ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                      border: item.status === "active" ? "1px solid rgba(0,229,255,0.2)" : item.pendingApproval ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.04)",
                      opacity: item.status === "done" ? 0.35 : 1,
                    }}>

                    {/* Row 1: position + song + status */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black w-4 text-center flex-shrink-0 mt-0.5"
                        style={{ color: item.status === "active" ? "#00E5FF" : "rgba(255,255,255,0.25)" }}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-semibold truncate">{item.songTitle}</p>
                        <p className="text-white/35 text-[10px] truncate">{item.artist}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
                        style={{
                          background: item.status === "active" ? "rgba(0,229,255,0.15)" : item.pendingApproval ? "rgba(255,255,255,0.05)" : item.status === "done" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.04)",
                          color: item.status === "active" ? "#00E5FF" : item.pendingApproval ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.25)",
                          border: item.status === "active" ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
                        }}>
                        {item.status === "active" ? "진행중" : item.pendingApproval ? "승인 대기중" : item.status === "done" ? "완료" : "대기중"}
                      </span>
                    </div>

                    {/* Row 2: singer */}
                    <div className="flex items-center gap-1.5 pl-6">
                      <Icon icon="solar:user-bold" className="w-2.5 h-2.5 text-white/25" />
                      <span className="text-[10px]" style={{ color: item.singerName ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)" }}>
                        {item.singerName ?? "미배정"}
                      </span>
                    </div>

                    {/* Row 3: host controls */}
                    {isHost && (
                      <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                        {!item.pendingApproval ? (
                          <>
                            {/* Assign */}
                            <button onClick={() => setParticipantModalQueueId(item.id)}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-all hover:opacity-80"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                              <Icon icon="solar:user-plus-bold" className="w-2.5 h-2.5" />
                              배정
                            </button>
                            {/* Start */}
                            {item.status === "waiting" && (
                              <button onClick={() => handleStartSong(item)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}>
                                <Icon icon="solar:play-bold" className="w-2.5 h-2.5" />
                                시작
                              </button>
                            )}
                            {/* Remove */}
                            <button onClick={() => handleRemoveSong(item.id)}
                              className="ml-auto flex items-center justify-center w-5 h-5 rounded transition-all hover:opacity-80"
                              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "rgba(239,68,68,0.6)" }}>
                              <Icon icon="solar:close-bold" className="w-2.5 h-2.5" />
                            </button>
                          </>
                        ) : (
                          // Pending approval
                          <>
                            <button onClick={() => handleApproveRequest(item.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold transition-all hover:opacity-80"
                              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}>
                              승인
                            </button>
                            <button onClick={() => handleRejectRequest(item.id)}
                              className="px-2 py-0.5 rounded text-[10px] transition-all hover:opacity-80"
                              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.7)" }}>
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Guest: pending note */}
                    {!isHost && item.pendingApproval && item.singerId === MY_ID && (
                      <p className="pl-6 text-[10px] text-white/25 italic">호스트 승인 대기 중...</p>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Mobile fixed action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 px-3 pt-3 pb-3"
        style={{ background: "linear-gradient(to top, rgba(7,7,7,0.98) 70%, transparent)" }}>
        <BottomActionBar />
      </div>

      {/* Gift toast */}
      {lastGift && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap"
          style={{ background: "rgba(255,0,127,0.15)", border: "1px solid rgba(255,0,127,0.4)", color: "#FF007F", boxShadow: "0 0 20px rgba(255,0,127,0.3)" }}>
          {lastGift}
        </div>
      )}

      {/* Action toast */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
          style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>
          {toast}
        </div>
      )}

      {/* ── Participant selector modal ──────────────────────────────────────── */}
      {participantModalQueueId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setParticipantModalQueueId(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "rgba(14,14,14,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">노래할 참여자 선택</h3>
              <button onClick={() => setParticipantModalQueueId(null)} className="text-white/40 hover:text-white/70 transition-colors">
                <Icon icon="solar:close-bold" className="w-4 h-4" />
              </button>
            </div>
            {(() => {
              const targetItem = queue.find(q => q.id === participantModalQueueId);
              return (
                <p className="text-white/40 text-xs -mt-2">
                  {targetItem ? `"${targetItem.songTitle}"에 배정할 참여자를 선택하세요` : ""}
                </p>
              );
            })()}
            <div className="flex flex-col gap-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    {p.nickname[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-semibold">{p.nickname}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: !p.isMuted ? "#22C55E" : "rgba(255,255,255,0.2)" }} />
                      <span className="text-white/30 text-[10px]">{!p.isMuted ? "마이크 켜짐" : "마이크 꺼짐"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignParticipant(participantModalQueueId, p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                    선택
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: translateY(-8px); }
          15%  { opacity: 1; transform: translateY(0); }
          70%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
