"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Leaderboard } from "@/components/room/Leaderboard";
import { BottomActionBar } from "@/components/room/BottomActionBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRoomStore } from "@/lib/store/roomStore";
import Link from "next/link";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";

// ── Constants ──────────────────────────────────────────────────────────────────
const SONG_TITLE = "안동역에서";
const ARTIST_NAME = "진성";
const YOUTUBE_ID = "L26jSx5TZns";
const MY_ID = "p3";
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
interface ChatMessage {
  id: string;
  type: "user" | "system" | "gift_bouquet" | "gift_champagne";
  nickname?: string;
  text: string;
  timestamp?: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_SONGS = [
  { id: "s1", title: "안동역에서",             artist: "진성"   },
  { id: "s2", title: "사랑했나봐",             artist: "이창원" },
  { id: "s3", title: "봄날",                   artist: "BTS"    },
  { id: "s4", title: "밤편지",                 artist: "IU"     },
  { id: "s5", title: "너를 위해",              artist: "임재범" },
  { id: "s6", title: "사랑했지만",             artist: "김광석" },
  { id: "s7", title: "첫눈처럼 너에게 가겠다", artist: "엑소"   },
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
  { id: "q1", songTitle: "사랑했지만",             artist: "김광석", singerName: "가을바람", singerId: "p1", status: "waiting" },
  { id: "q2", songTitle: "첫눈처럼 너에게 가겠다", artist: "엑소",   singerName: "봄날의꿈", singerId: "p2", status: "waiting" },
  { id: "q3", songTitle: "너에게 난, 나에게 넌",   artist: "god",    singerName: null,       singerId: null, status: "waiting" },
  { id: "q4", songTitle: "그녀가 처음 울던 날",    artist: "이문세", singerName: null,       singerId: null, status: "waiting" },
];

const INIT_MESSAGES: ChatMessage[] = [
  { id: "m0", type: "system",       text: "방구석 가왕 룸에 입장했습니다 🎤" },
  { id: "m1", type: "user",         nickname: "김민준", text: "안녕하세요~~",       timestamp: "00:01" },
  { id: "m2", type: "user",         nickname: "이지현", text: "오늘 노래 기대돼요!", timestamp: "00:02" },
  { id: "m3", type: "gift_bouquet", text: "박서준님이 꽃다발 3개를 선물했습니다! 🌸" },
  { id: "m4", type: "user",         nickname: "최유나", text: "ㅋㅋㅋ 신난다",       timestamp: "00:03" },
  { id: "m5", type: "system",       text: "진성 - 안동역에서 재생 중 🎵" },
];

const getTimestamp = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

// ── Nickname → pastel color ────────────────────────────────────────────────────
const nickColor = (nick: string) => {
  const colors = ["#00E5FF", "#FF007F", "#C9A84C", "#A855F7", "#22C55E", "#F59E0B"];
  let h = 0; for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function ColosseumRoom001Page() {
  // Role
  const [isHost, setIsHost] = useState(true);

  // Video
  const [started, setStarted] = useState(false);
  const [showSongInfo, setShowSongInfo] = useState(false);
  const songInfoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Right panel tab
  const [activeTab, setActiveTab] = useState<"chat" | "queue">("chat");

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>(INIT_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Song search
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [guestRequestOpen, setGuestRequestOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>(INIT_QUEUE);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  // Participants
  const [participants, setParticipants] = useState<Participant[]>(INIT_PARTICIPANTS);
  const [participantModalQueueId, setParticipantModalQueueId] = useState<string | null>(null);

  // Now playing overlay
  const [nowPlaying, setNowPlaying] = useState<{ song: string; singer: string } | null>(null);
  const [nowPlayingVisible, setNowPlayingVisible] = useState(false);

  // Toasts
  const [toast, setToast] = useState<string | null>(null);
  const [lastGift, setLastGift] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Director
  const [directorOpen, setDirectorOpen] = useState(false);

  const gifts = useRoomStore((s) => s.gifts);

  // ── Auto-scroll chat ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Gift → chat ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gifts.length === 0) return;
    const latest = gifts[gifts.length - 1];
    const isChampagne = latest.type === "champagne";
    setLastGift(isChampagne ? "🍾 샴페인 전송!" : "💐 꽃다발 전송!");
    setMessages(prev => [...prev, {
      id: `gift-${Date.now()}`,
      type: isChampagne ? "gift_champagne" : "gift_bouquet",
      text: isChampagne
        ? `${MY_NICKNAME}님이 샴페인을 선물했습니다! 🥂`
        : `${MY_NICKNAME}님이 꽃다발을 선물했습니다! 🌸`,
    }]);
    const t = setTimeout(() => setLastGift(null), 2000);
    return () => clearTimeout(t);
  }, [gifts]);

  // ── Close search on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (songInfoTimerRef.current) clearTimeout(songInfoTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const addSysMsg = (text: string) =>
    setMessages(prev => [...prev, { id: `sys-${Date.now()}`, type: "system", text }]);

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

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handlePlay = () => {
    setStarted(true);
    setShowSongInfo(true);
    songInfoTimerRef.current = setTimeout(() => setShowSongInfo(false), 3000);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      type: "user",
      nickname: MY_NICKNAME,
      text: chatInput.trim(),
      timestamp: getTimestamp(),
    }]);
    setChatInput("");
  };

  const handleAddSong = (song: typeof MOCK_SONGS[0]) => {
    setQueue(prev => [...prev, {
      id: `q-${Date.now()}`, songTitle: song.title, artist: song.artist,
      singerName: null, singerId: null, status: "waiting",
    }]);
    setSearchQuery(""); setShowResults(false);
    showToast("대기열에 추가되었습니다");
  };

  const handleGuestRequest = (song: typeof MOCK_SONGS[0]) => {
    setQueue(prev => [...prev, {
      id: `req-${Date.now()}`, songTitle: song.title, artist: song.artist,
      singerName: MY_NICKNAME, singerId: MY_ID, status: "waiting", pendingApproval: true,
    }]);
    setSearchQuery(""); setShowResults(false); setGuestRequestOpen(false);
    showToast("신청이 접수되었습니다");
  };

  const handleRemoveSong = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    if (activeSongId === id) {
      setActiveSongId(null); setNowPlaying(null);
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
    addSysMsg(`${item.singerName ?? "미배정"}님이 마이크를 잡았습니다 🎤`);
    showToast(`🎤 ${item.singerName ?? "미배정"}님 시작!`);
  };

  const handleAssignParticipant = (queueId: string, p: Participant) => {
    setQueue(prev => prev.map(q => q.id === queueId ? { ...q, singerName: p.nickname, singerId: p.id } : q));
    setParticipantModalQueueId(null);
    showToast(`${p.nickname}님 배정 완료`);
  };

  const handleToggleMic = (pid: string) =>
    setParticipants(prev => prev.map(p => p.id === pid ? { ...p, isMuted: !p.isMuted } : p));

  const handleApproveRequest = (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, pendingApproval: false } : q));
    showToast("신청 승인됨");
  };
  const handleRejectRequest = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    showToast("신청 거절됨");
  };

  const activeItem = queue.find(q => q.id === activeSongId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-[#070707] min-h-screen lg:h-screen lg:overflow-hidden relative overflow-x-hidden">

      {/* Fixed overlays */}
      <Link href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00E5FF] bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#00E5FF]/50 transition-all">
        ← L&apos;OXYGÈNE
      </Link>

      <button onClick={() => setIsHost(h => !h)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded text-[10px] font-medium transition-all hover:opacity-80"
        style={{ background: isHost ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.05)", border: isHost ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(255,255,255,0.1)", color: isHost ? "#00E5FF" : "rgba(255,255,255,0.4)" }}>
        {isHost ? "호스트 모드" : "참여자 모드"}
      </button>

      <button onClick={() => setDirectorOpen(true)}
        className="fixed top-14 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F", backdropFilter: "blur(12px)", boxShadow: "0 0 12px rgba(255,0,127,0.15)" }}>
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
      <div className="relative z-20 flex items-center justify-between px-4 py-3 flex-shrink-0"
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
        <div className="flex items-center gap-3">
          <Icon icon="solar:user-bold" className="text-white/40 w-4 h-4" />
          <span className="text-white/60 text-sm">127</span>
        </div>
      </div>

      {/* ── Main content area ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 pb-[88px] lg:pb-0">

        {/* Row 1: Video + Chat panel */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* Video column */}
          <div className="relative bg-black overflow-hidden video-container lg:flex-1">
            {started && (
              <iframe key="yt-iframe" className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
                title={`${SONG_TITLE} - ${ARTIST_NAME}`}
                allow="autoplay; encrypted-media" allowFullScreen />
            )}
            {!started && (
              <div className="absolute inset-0 bg-[#070707]"
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }}>
                <div className="absolute inset-0" style={{ background: "rgba(7,7,7,0.55)" }} />
              </div>
            )}

            {/* Song info fade overlay */}
            {showSongInfo && (
              <div className="absolute top-4 inset-x-0 flex justify-center z-20 pointer-events-none"
                style={{ animation: "fadeInOut 3s ease forwards" }}>
                <div className="px-4 py-2.5 rounded-xl flex flex-col items-center gap-0.5"
                  style={{ background: "rgba(7,7,7,0.75)", border: "1px solid rgba(0,229,255,0.2)", backdropFilter: "blur(12px)" }}>
                  <span className="text-white font-black text-base tracking-wide" style={{ textShadow: "0 0 12px rgba(0,229,255,0.5)" }}>{SONG_TITLE}</span>
                  <span className="text-white/60 text-xs">{ARTIST_NAME}</span>
                  <span className="text-[#00E5FF] text-[10px] tracking-widest font-medium mt-0.5">🎤 KARAOKE VER.</span>
                </div>
              </div>
            )}

            {/* Now playing fade overlay */}
            {nowPlayingVisible && nowPlaying && (
              <div className="absolute top-4 inset-x-0 flex justify-center z-20 pointer-events-none"
                style={{ animation: "fadeInOut 3s ease forwards" }}>
                <div className="px-4 py-2.5 rounded-xl flex flex-col items-center gap-0.5"
                  style={{ background: "rgba(7,7,7,0.8)", border: "1px solid rgba(0,229,255,0.25)", backdropFilter: "blur(12px)" }}>
                  <span className="text-[#00E5FF] text-[10px] tracking-widest font-bold">🎤 NOW SINGING</span>
                  <span className="text-white font-black text-sm tracking-wide">{nowPlaying.song}</span>
                  <span className="text-white/60 text-xs">{nowPlaying.singer}</span>
                </div>
              </div>
            )}

            {/* Active singer badge — persistent */}
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
                  style={{ background: "rgba(255,0,127,0.1)", border: "2px solid rgba(255,0,127,0.5)", backdropFilter: "blur(12px)", boxShadow: "0 0 30px rgba(255,0,127,0.3)" }}>
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

          {/* ── Chat / Queue panel ──────────────────────────────────────────── */}
          <div className="flex flex-col w-full lg:w-72 lg:flex-shrink-0 max-h-[240px] lg:max-h-none"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)", borderLeft: "0" }}
            // Desktop: border-left instead of border-top
          >
            {/* Panel header + tabs */}
            <div className="flex items-center gap-1 px-2 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
              <button onClick={() => setActiveTab("chat")}
                className="px-3 py-2 text-xs font-medium transition-colors relative"
                style={{ color: activeTab === "chat" ? "#00E5FF" : "rgba(255,255,255,0.4)" }}>
                💬 채팅
                {activeTab === "chat" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "#00E5FF" }} />}
              </button>
              <button onClick={() => setActiveTab("queue")}
                className="px-3 py-2 text-xs font-medium transition-colors relative"
                style={{ color: activeTab === "queue" ? "#00E5FF" : "rgba(255,255,255,0.4)" }}>
                🎵 대기열
                {activeTab === "queue" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "#00E5FF" }} />}
              </button>
              <div className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium mr-1"
                style={{ background: "rgba(0,229,255,0.1)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>
                {participants.length}명
              </div>
            </div>

            {/* ── CHAT TAB ─────────────────────────────────────────────────── */}
            {activeTab === "chat" && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2 flex flex-col gap-2 min-h-0">
                  {messages.map(msg => {
                    if (msg.type === "system") return (
                      <div key={msg.id} className="text-center">
                        <span className="text-[10px] text-white/30 italic">{msg.text}</span>
                      </div>
                    );
                    if (msg.type === "gift_bouquet") return (
                      <div key={msg.id} className="px-3 py-2 rounded-lg"
                        style={{ background: "rgba(255,0,127,0.08)", border: "1px solid rgba(255,0,127,0.18)" }}>
                        <span className="text-xs" style={{ color: "#FF007F" }}>🌸 {msg.text}</span>
                      </div>
                    );
                    if (msg.type === "gift_champagne") return (
                      <div key={msg.id} className="px-3 py-2 rounded-lg"
                        style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}>
                        <span className="text-xs text-[#00E5FF]">🥂 {msg.text}</span>
                      </div>
                    );
                    // user message
                    return (
                      <div key={msg.id} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                          style={{ background: `${nickColor(msg.nickname ?? "")}20`, color: nickColor(msg.nickname ?? ""), border: `1px solid ${nickColor(msg.nickname ?? "")}40` }}>
                          {(msg.nickname ?? "?")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-medium text-white/80">{msg.nickname}</span>
                            {msg.timestamp && <span className="text-[9px] text-white/25">{msg.timestamp}</span>}
                          </div>
                          <p className="text-xs text-white/65 mt-0.5 break-words">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat input */}
                <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }}
                    maxLength={100}
                    placeholder="채팅 입력..."
                    className="flex-1 bg-white/5 text-white/80 text-xs px-3 py-1.5 rounded-lg placeholder-white/25 outline-none transition-all"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <button onClick={handleSendMessage}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[rgba(0,229,255,0.25)] active:scale-95"
                    style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                    <Icon icon="solar:plain-2-linear" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

            {/* ── QUEUE TAB ────────────────────────────────────────────────── */}
            {activeTab === "queue" && (
              <div className="flex-1 overflow-y-auto hide-scrollbar p-3 flex flex-col gap-3 min-h-0">

                {/* Host search */}
                {isHost && (
                  <div ref={searchRef} className="relative flex flex-col gap-2">
                    <p className="text-white/50 text-[11px] font-medium">🎵 노래 추가</p>
                    <div className="relative">
                      <Icon icon="solar:magnifier-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                      <input value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setShowResults(e.target.value.length >= 2); }}
                        onFocus={() => { if (searchQuery.length >= 2) setShowResults(true); }}
                        placeholder="가라오케 곡 검색..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white/5 text-white/80 text-xs placeholder-white/20 outline-none"
                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                      {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setShowResults(false); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                          <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {showResults && filteredSongs.length > 0 && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 rounded-lg overflow-hidden"
                        style={{ background: "rgba(10,10,10,0.98)", border: "1px solid rgba(0,229,255,0.15)" }}>
                        {filteredSongs.map(song => (
                          <div key={song.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-white/80 text-xs font-medium truncate">{song.title}</p>
                              <p className="text-white/35 text-[10px]">{song.artist}</p>
                            </div>
                            <button onClick={() => handleAddSong(song)}
                              className="flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-bold transition-all hover:scale-105"
                              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                              추가
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Guest request button */}
                {!isHost && (
                  <div ref={searchRef} className="relative flex flex-col gap-2">
                    <button onClick={() => setGuestRequestOpen(o => !o)}
                      className="w-full py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                      style={{ background: guestRequestOpen ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${guestRequestOpen ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.08)"}`, color: guestRequestOpen ? "#00E5FF" : "rgba(255,255,255,0.5)" }}>
                      🎤 신청하기
                    </button>
                    {guestRequestOpen && (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative">
                          <Icon icon="solar:magnifier-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                          <input value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setShowResults(e.target.value.length >= 2); }}
                            placeholder="노래 검색..."
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white/5 text-white/80 text-xs placeholder-white/20 outline-none"
                            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                            onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                          />
                        </div>
                        {showResults && filteredSongs.length > 0 && (
                          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                            {filteredSongs.map(song => (
                              <div key={song.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-white/5">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/75 text-xs truncate">{song.title}</p>
                                  <p className="text-white/35 text-[10px]">{song.artist}</p>
                                </div>
                                <button onClick={() => handleGuestRequest(song)}
                                  className="flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-bold"
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

                {/* Queue header */}
                <div className="flex items-center gap-2">
                  <Icon icon="solar:microphone-bold" className="text-[#00E5FF] w-3.5 h-3.5" />
                  <span className="text-white/70 text-xs font-bold tracking-wider">대기열</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(0,229,255,0.08)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>
                    {queue.filter(q => q.status !== "done").length}곡
                  </span>
                </div>

                {/* Queue items */}
                {queue.length === 0 && <p className="text-white/20 text-xs text-center py-3 italic">대기열이 비어 있습니다</p>}
                {queue.map((item, index) => (
                  <div key={item.id} className="rounded-lg flex flex-col gap-1.5 p-2.5 transition-all"
                    style={{
                      background: item.status === "active" ? "rgba(0,229,255,0.05)" : item.pendingApproval ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                      border: item.status === "active" ? "1px solid rgba(0,229,255,0.2)" : item.pendingApproval ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.04)",
                      opacity: item.status === "done" ? 0.35 : 1,
                    }}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black w-4 text-center flex-shrink-0 mt-0.5"
                        style={{ color: item.status === "active" ? "#00E5FF" : "rgba(255,255,255,0.25)" }}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-semibold truncate">{item.songTitle}</p>
                        <p className="text-white/30 text-[10px] truncate">{item.artist}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: item.status === "active" ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.04)", color: item.status === "active" ? "#00E5FF" : item.pendingApproval ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.25)", border: item.status === "active" ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(255,255,255,0.06)" }}>
                        {item.status === "active" ? "진행중" : item.pendingApproval ? "대기중" : item.status === "done" ? "완료" : "대기중"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-6">
                      <Icon icon="solar:user-bold" className="w-2.5 h-2.5 text-white/20" />
                      <span className="text-[10px]" style={{ color: item.singerName ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>
                        {item.singerName ?? "미배정"}
                      </span>
                    </div>
                    {isHost && (
                      <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                        {!item.pendingApproval ? (
                          <>
                            <button onClick={() => setParticipantModalQueueId(item.id)}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-all hover:opacity-80"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                              <Icon icon="solar:user-plus-bold" className="w-2.5 h-2.5" /> 배정
                            </button>
                            {item.status === "waiting" && (
                              <button onClick={() => handleStartSong(item)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}>
                                <Icon icon="solar:play-bold" className="w-2.5 h-2.5" /> 시작
                              </button>
                            )}
                            <button onClick={() => handleRemoveSong(item.id)}
                              className="ml-auto flex items-center justify-center w-5 h-5 rounded"
                              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "rgba(239,68,68,0.6)" }}>
                              <Icon icon="solar:close-bold" className="w-2.5 h-2.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleApproveRequest(item.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}>
                              승인
                            </button>
                            <button onClick={() => handleRejectRequest(item.id)}
                              className="px-2 py-0.5 rounded text-[10px]"
                              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.7)" }}>
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {!isHost && item.pendingApproval && item.singerId === MY_ID && (
                      <p className="pl-6 text-[10px] text-white/25 italic">호스트 승인 대기 중...</p>
                    )}
                  </div>
                ))}

                {/* Leaderboard in queue tab */}
                <Leaderboard />
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Participant thumbnail strip (full width) ─────────────── */}
        <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar px-2 py-1.5"
          style={{ background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)", minHeight: 64 }}>
          {participants.map(p => (
            <div key={p.id} className="relative flex-shrink-0 flex flex-col items-center gap-0.5 rounded-lg transition-all duration-300"
              style={{ width: 56, padding: 4, background: p.isCurrentSinger ? "rgba(0,229,255,0.06)" : "transparent", border: p.isCurrentSinger ? "1px solid rgba(0,229,255,0.25)" : "1px solid transparent", opacity: activeSongId && !p.isCurrentSinger ? 0.4 : 1, boxShadow: p.isCurrentSinger ? "0 0 8px rgba(0,229,255,0.2)" : "none" }}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: p.isCurrentSinger ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.08)", color: p.isCurrentSinger ? "#00E5FF" : "rgba(255,255,255,0.5)", border: p.isCurrentSinger ? "2px solid rgba(0,229,255,0.5)" : "2px solid transparent" }}>
                {p.nickname[0]}
              </div>
              {/* Nickname */}
              <span className="text-[9px] text-white/40 w-full text-center truncate leading-none mt-0.5">
                {p.nickname.slice(0, 5)}
              </span>
              {/* Singing badge */}
              {p.isCurrentSinger && (
                <span className="absolute top-0 right-0 text-[8px] leading-none">🎤</span>
              )}
              {/* Muted slash */}
              {p.isMuted && !p.isCurrentSinger && (
                <div className="absolute bottom-[18px] right-[4px]">
                  <Icon icon="solar:microphone-slash-bold" className="w-3 h-3" style={{ color: "rgba(239,68,68,0.7)" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Row 3: Action bar (desktop in-flow) ──────────────────────────── */}
        <div className="hidden lg:block flex-shrink-0">
          <BottomActionBar />
        </div>
      </div>

      {/* Mobile action bar (fixed) */}
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

      {/* ── Participant selector modal ─────────────────────────────────────── */}
      {participantModalQueueId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setParticipantModalQueueId(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "rgba(14,14,14,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">노래할 참여자 선택</h3>
                {(() => {
                  const t = queue.find(q => q.id === participantModalQueueId);
                  return t ? <p className="text-white/35 text-xs mt-0.5">&ldquo;{t.songTitle}&rdquo;</p> : null;
                })()}
              </div>
              <button onClick={() => setParticipantModalQueueId(null)} className="text-white/35 hover:text-white/60 transition-colors">
                <Icon icon="solar:close-bold" className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${nickColor(p.nickname)}20`, color: nickColor(p.nickname), border: `1px solid ${nickColor(p.nickname)}40` }}>
                    {p.nickname[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-semibold">{p.nickname}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: !p.isMuted ? "#22C55E" : "rgba(255,255,255,0.2)" }} />
                      <span className="text-white/30 text-[10px]">{!p.isMuted ? "마이크 켜짐" : "마이크 꺼짐"}</span>
                    </div>
                  </div>
                  <button onClick={() => handleAssignParticipant(participantModalQueueId, p)}
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
        .video-container { aspect-ratio: 16 / 9; }
        @media (min-width: 1024px) {
          .video-container { aspect-ratio: unset; }
          .chat-panel-border { border-left: 1px solid rgba(255,255,255,0.05); border-top: none; }
        }
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
