"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { Leaderboard } from "@/components/room/Leaderboard";
import { BottomActionBar } from "@/components/room/BottomActionBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRoomStore } from "@/lib/store/roomStore";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";

// New components
import ZoomVideoRoom from "@/components/room/ZoomVideoRoom";
import MainStage from "@/components/room/MainStage";
import ParticipantRow, { type RoomParticipant } from "@/components/room/ParticipantRow";
import ReactiveBackground from "@/components/room/ReactiveBackground";
import VoiceScoreDisplay from "@/components/room/VoiceScoreDisplay";
import DuetMode, { type DuetSinger } from "@/components/room/DuetMode";
import AudienceReactions, { type AudienceReactionsHandle } from "@/components/room/AudienceReactions";

// Hooks
import { useBPMDetector } from "@/lib/audio/useBPMDetector";
import { useVoiceScoring } from "@/lib/scoring/useVoiceScoring";
import { hasNickname, getUserNickname, setUserNickname, randomNickname } from "@/lib/utils/userSession";
import { envConfig } from "@/lib/utils/envCheck";

// ── Constants ──────────────────────────────────────────────────────────────────
const SONG_TITLE = "안동역에서";
const ARTIST_NAME = "진성";
const YOUTUBE_ID = "L26jSx5TZns";
const MY_ID = "p3";
const MY_NICKNAME = "여름밤";
const TICKET_COST = 0; // 0 = free room

// ── Types ──────────────────────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  title: string;
  thumbnail?: string;
}

interface QueueItem {
  id: string;
  songTitle: string;
  artist: string;
  singerName: string | null;
  singerId: string | null;
  status: "waiting" | "active" | "done";
  pendingApproval?: boolean;
}
interface ChatMessage {
  id: string;
  type: "user" | "system" | "gift_bouquet" | "gift_champagne";
  nickname?: string;
  text: string;
  timestamp?: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
// Song parsing helper: "제목 - 아티스트 (가라오케)" → { songTitle, artist }
function parseSongTitle(raw: string): { songTitle: string; artist: string } {
  const match = raw.match(/^(.+?)\s*[-–]\s*(.+?)(?:\s*\(.*?\))?\s*$/);
  if (match) return { songTitle: match[1].trim(), artist: match[2].trim() };
  return { songTitle: raw.replace(/\s*\(가라오케\)\s*$/i, "").trim(), artist: "" };
}

const INIT_PARTICIPANTS: RoomParticipant[] = [
  { id: "p1", nickname: "가을바람",   isMuted: true,  isCurrentSinger: false, isVIP: true  },
  { id: "p2", nickname: "봄날의꿈",   isMuted: true,  isCurrentSinger: false, isVIP: false },
  { id: "p3", nickname: "여름밤",     isMuted: true,  isCurrentSinger: false, isVIP: false },
  { id: "p4", nickname: "하늘별",     isMuted: true,  isCurrentSinger: false, isVIP: true  },
  { id: "p5", nickname: "별빛가수",   isMuted: true,  isCurrentSinger: false, isVIP: false },
  { id: "p6", nickname: "달빛소나타", isMuted: true,  isCurrentSinger: false, isVIP: false },
];

const INIT_QUEUE: QueueItem[] = [
  { id: "q1", songTitle: "사랑했지만",             artist: "김광석", singerName: "가을바람", singerId: "p1", status: "waiting" },
  { id: "q2", songTitle: "첫눈처럼 너에게 가겠다", artist: "엑소",   singerName: "봄날의꿈", singerId: "p2", status: "waiting" },
  { id: "q3", songTitle: "너에게 난, 나에게 넌",   artist: "god",    singerName: null,       singerId: null, status: "waiting" },
];

const INIT_MESSAGES: ChatMessage[] = [
  { id: "m0", type: "system",       text: "방구석 가왕 룸에 입장했습니다 🎤" },
  { id: "m1", type: "user",         nickname: "김민준", text: "안녕하세요~~",       timestamp: "00:01" },
  { id: "m2", type: "user",         nickname: "이지현", text: "오늘 노래 기대돼요!", timestamp: "00:02" },
  { id: "m3", type: "gift_bouquet", text: "박서준님이 꽃다발을 선물했습니다! 🌸" },
  { id: "m4", type: "user",         nickname: "최유나", text: "ㅋㅋㅋ 신난다",       timestamp: "00:03" },
  { id: "m5", type: "system",       text: "진성 - 안동역에서 재생 중 🎵" },
];

const getTs = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};
const nickColor = (nick: string) => {
  const c = ["#00E5FF","#FF007F","#C9A84C","#A855F7","#22C55E","#F59E0B"];
  let h = 0; for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) & 0xffffffff;
  return c[Math.abs(h) % c.length];
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function ColosseumRoom001Page() {
  // Role
  const [isHost, setIsHost] = useState(true);

  // Ticket
  const [ticketChecked, setTicketChecked] = useState(TICKET_COST === 0);
  const [showTicketModal, setShowTicketModal] = useState(TICKET_COST > 0);

  // Video
  const [started, setStarted] = useState(false);
  const [showSongInfo, setShowSongInfo] = useState(false);
  const songInfoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Panel tabs
  const [activeTab, setActiveTab] = useState<"chat" | "queue">("chat");

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>(INIT_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [guestRequestOpen, setGuestRequestOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>(INIT_QUEUE);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  // Participants
  const [participants, setParticipants] = useState<RoomParticipant[]>(INIT_PARTICIPANTS);
  const [participantModalQueueId, setParticipantModalQueueId] = useState<string | null>(null);

  // Now playing
  const [nowPlaying, setNowPlaying] = useState<{ song: string; singer: string } | null>(null);
  const [nowPlayingVisible, setNowPlayingVisible] = useState(false);

  // Voice scoring (only active when MY mic is live)
  const [isMySinging, setIsMySinging] = useState(false);
  const [songFinished, setSongFinished] = useState(false);
  const scoring = useVoiceScoring();

  // BPM detector
  const bpm = useBPMDetector();

  // Duet mode
  const [isDuetMode, setIsDuetMode] = useState(false);

  // Audience reactions ref
  const reactionsRef = useRef<AudienceReactionsHandle>(null);

  // Toasts
  const [toast, setToast] = useState<string | null>(null);
  const [lastGift, setLastGift] = useState<string | null>(null);
  const [lastGiftType, setLastGiftType] = useState<"bouquet" | "champagne" | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Director
  const [directorOpen, setDirectorOpen] = useState(false);

  // Demo mode banner
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);

  // Nickname modal
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");

  useEffect(() => {
    if (!hasNickname()) setNicknameModalOpen(true);
  }, []);

  const handleNicknameSubmit = () => {
    const name = nicknameInput.trim();
    if (!name) return;
    setUserNickname(name);
    setNicknameModalOpen(false);
  };

  const gifts = useRoomStore((s) => s.gifts);

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Gifts → chat + confetti ────────────────────────────────────────────────
  useEffect(() => {
    if (gifts.length === 0) return;
    const latest = gifts[gifts.length - 1];
    const isChamp = latest.type === "champagne";
    const gType: "bouquet" | "champagne" = isChamp ? "champagne" : "bouquet";
    setLastGift(isChamp ? "🍾 샴페인 전송!" : "💐 꽃다발 전송!");
    setLastGiftType(gType);
    reactionsRef.current?.trigger(isChamp ? "🥂" : "🌸", 6);
    setMessages(prev => [...prev, {
      id: `gift-${Date.now()}`,
      type: isChamp ? "gift_champagne" : "gift_bouquet",
      text: isChamp ? `${MY_NICKNAME}님이 샴페인을 선물했습니다! 🥂` : `${MY_NICKNAME}님이 꽃다발을 선물했습니다! 🌸`,
    }]);
    const t = setTimeout(() => { setLastGift(null); setLastGiftType(null); }, 2000);
    return () => clearTimeout(t);
  }, [gifts]);

  // ── Outside click for search ───────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (songInfoTimerRef.current) clearTimeout(songInfoTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addSysMsg = (text: string) =>
    setMessages(prev => [...prev, { id: `sys-${Date.now()}`, type: "system", text }]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  // ── Song search (debounced, hits /api/youtube-search) ─────────────────────
  const searchSongs = (query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (query.length < 2) { setSearchResults([]); setShowResults(false); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { items: SearchResult[]; isMock: boolean };
        setSearchResults(data.items ?? []);
        setShowResults(true);
      } catch (err) {
        console.error("[searchSongs]", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePlay = () => {
    if (!ticketChecked) { setShowTicketModal(true); return; }
    setStarted(true);
    setShowSongInfo(true);
    songInfoTimerRef.current = setTimeout(() => setShowSongInfo(false), 3000);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { id: `msg-${Date.now()}`, type: "user", nickname: MY_NICKNAME, text: chatInput.trim(), timestamp: getTs() }]);
    setChatInput("");
  };

  const handleAddSong = (song: SearchResult) => {
    const { songTitle, artist } = parseSongTitle(song.title);
    setQueue(prev => [...prev, { id: `q-${Date.now()}`, songTitle, artist, singerName: null, singerId: null, status: "waiting" }]);
    setSearchQuery(""); setShowResults(false); setSearchResults([]);
    showToast("대기열에 추가되었습니다");
  };

  const handleGuestRequest = (song: SearchResult) => {
    const { songTitle, artist } = parseSongTitle(song.title);
    setQueue(prev => [...prev, { id: `req-${Date.now()}`, songTitle, artist, singerName: MY_NICKNAME, singerId: MY_ID, status: "waiting", pendingApproval: true }]);
    setSearchQuery(""); setShowResults(false); setSearchResults([]); setGuestRequestOpen(false);
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
    setQueue(prev => prev.map(q => ({ ...q, status: q.id === item.id ? "active" : q.status === "active" ? "done" : q.status })));
    setActiveSongId(item.id);
    const updatedParticipants = participants.map(p => ({ ...p, isCurrentSinger: p.id === item.singerId, isMuted: p.id !== item.singerId }));
    setParticipants(updatedParticipants);
    const info = { song: `${item.songTitle} - ${item.artist}`, singer: item.singerName ?? "미배정" };
    setNowPlaying(info);
    setNowPlayingVisible(true);
    setTimeout(() => setNowPlayingVisible(false), 3000);
    addSysMsg(`${item.singerName ?? "미배정"}님이 마이크를 잡았습니다 🎤`);
    showToast(`🎤 ${item.singerName ?? "미배정"}님 시작!`);
    setSongFinished(false);
    // If assigned singer is me, start voice scoring + BPM
    if (item.singerId === MY_ID) {
      setIsMySinging(true);
      scoring.startScoring();
      bpm.startAnalysis();
    }
  };

  const handleAssignParticipant = (queueId: string, p: RoomParticipant) => {
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

  const handleTransferHost = (pid: string) => {
    const p = participants.find(x => x.id === pid);
    if (!p) return;
    setParticipants(prev => prev.map(x => ({ ...x, isHost: x.id === pid })));
    setIsHost(false);
    showToast(`${p.nickname}님에게 호스트를 넘겼습니다`);
    addSysMsg(`${p.nickname}님이 호스트가 되었습니다 👑`);
  };

  const handleReactionSent = (emoji: string) => {
    addSysMsg(`${MY_NICKNAME}님이 ${emoji} 반응을 보냈습니다`);
  };

  const activeItem = queue.find(q => q.id === activeSongId) ?? null;

  // Duet singers (mock — would be real in production)
  const duetSinger1: DuetSinger = { id: "p1", nickname: "가을바람", score: 72, pitchAccuracy: 75, rhythmAccuracy: 68, grade: "B" };
  const duetSinger2: DuetSinger = { id: "p2", nickname: "봄날의꿈", score: 81, pitchAccuracy: 84, rhythmAccuracy: 76, grade: "A" };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ZoomVideoRoom sessionName="colosseum-room-001" userName={MY_NICKNAME} role={isHost ? "host" : "guest"} onLeave={() => window.location.href = "/"}>
    <div className="flex flex-col bg-[#070707] min-h-screen lg:h-screen lg:overflow-hidden relative overflow-x-hidden">

      {/* Background effects layer */}
      <ReactiveBackground
        beatDetected={bpm.beatDetected}
        currentBPM={bpm.currentBPM}
        isSomeoneSinging={!!activeSongId}
        lastGiftType={lastGiftType}
      />

      {/* Audience reactions overlay + quick buttons */}
      <AudienceReactions ref={reactionsRef} onReactionSent={handleReactionSent} />

      {/* Demo mode banner (dev only, dismissible) */}
      {process.env.NODE_ENV !== "production" && envConfig.isDemoMode() && !demoBannerDismissed && (
        <div className="fixed top-0 inset-x-0 z-[55] flex items-center justify-center gap-2 px-4 py-1.5 text-xs"
          style={{ background: "rgba(99,102,241,0.1)", borderBottom: "1px solid rgba(99,102,241,0.2)", backdropFilter: "blur(8px)" }}>
          <span className="text-indigo-300/80">🔵 데모 모드 — 실제 서비스를 위해 Supabase와 Zoom SDK를 연결하세요</span>
          <button onClick={() => setDemoBannerDismissed(true)} className="ml-2 text-white/30 hover:text-white/60 transition-colors">
            ✕
          </button>
        </div>
      )}

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

      {/* Ticket banner (paid rooms) */}
      {TICKET_COST > 0 && !ticketChecked && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
          <span>🎟️ 입장권: {TICKET_COST.toLocaleString()} O₂</span>
        </div>
      )}

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

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 pb-[88px] lg:pb-0">

        {/* Row 1: Video + Chat/Queue panel */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* MainStage + VoiceScoreDisplay */}
          <MainStage
            currentSinger={activeItem?.singerName ?? null}
            songTitle={nowPlayingVisible ? `${activeItem?.songTitle} - ${activeItem?.artist}` : null}
            beatDetected={bpm.beatDetected}
            className="video-container lg:aspect-auto lg:flex-1"
          >
            {/* Duet overlay */}
            {isDuetMode && (
              <DuetMode
                singer1={duetSinger1}
                singer2={duetSinger2}
                songTitle={activeItem?.songTitle ?? ""}
                isHost={isHost}
                onEnd={() => setIsDuetMode(false)}
              />
            )}

            {/* YouTube iframe */}
            {started && !isDuetMode && (
              <iframe key="yt-iframe" className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
                title={`${SONG_TITLE} - ${ARTIST_NAME}`}
                allow="autoplay; encrypted-media" allowFullScreen />
            )}

            {/* Thumbnail + play button */}
            {!started && !isDuetMode && (
              <>
                <div className="absolute inset-0 bg-[#070707]"
                  style={{ backgroundImage: `url(https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }}>
                  <div className="absolute inset-0" style={{ background: "rgba(7,7,7,0.55)" }} />
                </div>
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
                  {/* Duet test button (host only) */}
                  {isHost && (
                    <button onClick={e => { e.stopPropagation(); setIsDuetMode(true); }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}>
                      🎤 듀엣 모드 테스트
                    </button>
                  )}
                </button>
              </>
            )}

            {/* Voice score overlay */}
            <VoiceScoreDisplay
              isScoring={isMySinging && scoring.isScoring}
              pitchAccuracy={scoring.pitchAccuracy}
              rhythmAccuracy={scoring.rhythmAccuracy}
              currentScore={scoring.currentScore}
              totalScore={scoring.totalScore}
              grade={scoring.grade}
              isFinished={songFinished}
              onRestart={() => { setSongFinished(false); scoring.resetScore(); }}
              onNextSong={() => { setSongFinished(false); setActiveSongId(null); setIsMySinging(false); scoring.stopScoring(); bpm.stopAnalysis(); }}
            />
          </MainStage>

          {/* ── Chat / Queue panel ─────────────────────────────────────────── */}
          <div className="flex flex-col w-full lg:w-72 lg:flex-shrink-0 max-h-[240px] lg:max-h-none"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-2 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
              {(["chat", "queue"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-3 py-2 text-xs font-medium transition-colors relative"
                  style={{ color: activeTab === tab ? "#00E5FF" : "rgba(255,255,255,0.4)" }}>
                  {tab === "chat" ? "💬 채팅" : "🎵 대기열"}
                  {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "#00E5FF" }} />}
                </button>
              ))}
              <div className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium mr-1"
                style={{ background: "rgba(0,229,255,0.1)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>
                {participants.length}명
              </div>
            </div>

            {/* CHAT TAB */}
            {activeTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2 flex flex-col gap-2 min-h-0">
                  {messages.map(msg => {
                    if (msg.type === "system") return (
                      <div key={msg.id} className="text-center"><span className="text-[10px] text-white/30 italic">{msg.text}</span></div>
                    );
                    if (msg.type === "gift_bouquet") return (
                      <div key={msg.id} className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,0,127,0.08)", border: "1px solid rgba(255,0,127,0.18)" }}>
                        <span className="text-xs" style={{ color: "#FF007F" }}>🌸 {msg.text}</span>
                      </div>
                    );
                    if (msg.type === "gift_champagne") return (
                      <div key={msg.id} className="px-3 py-2 rounded-lg" style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}>
                        <span className="text-xs text-[#00E5FF]">🥂 {msg.text}</span>
                      </div>
                    );
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
                <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }}
                    maxLength={100} placeholder="채팅 입력..."
                    className="flex-1 bg-white/5 text-white/80 text-xs px-3 py-1.5 rounded-lg placeholder-white/25 outline-none"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  <button onClick={handleSendMessage}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:bg-[rgba(0,229,255,0.25)] active:scale-95"
                    style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                    <Icon icon="solar:plain-2-linear" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

            {/* QUEUE TAB */}
            {activeTab === "queue" && (
              <div className="flex-1 overflow-y-auto hide-scrollbar p-3 flex flex-col gap-3 min-h-0">
                {isHost && (
                  <div ref={searchRef} className="relative flex flex-col gap-2">
                    <p className="text-white/50 text-[11px] font-medium">🎵 노래 추가</p>
                    <div className="relative">
                      <Icon icon="solar:magnifier-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                      <input value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); searchSongs(e.target.value); }}
                        onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                        placeholder="가라오케 곡 검색..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white/5 text-white/80 text-xs placeholder-white/20 outline-none"
                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                      {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setShowResults(false); setSearchResults([]); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                          <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {(showResults || isSearching) && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 rounded-lg overflow-hidden"
                        style={{ background: "rgba(10,10,10,0.98)", border: "1px solid rgba(0,229,255,0.15)" }}>
                        {isSearching && (
                          <div className="px-3 py-2 text-white/30 text-xs">검색 중...</div>
                        )}
                        {searchResults.map(song => (
                          <div key={song.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-white/80 text-xs font-medium truncate">{song.title}</p>
                            </div>
                            <button onClick={() => handleAddSong(song)}
                              className="flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-bold"
                              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                              추가
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!isHost && (
                  <div ref={searchRef} className="relative flex flex-col gap-2">
                    <button onClick={() => setGuestRequestOpen(o => !o)}
                      className="w-full py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: guestRequestOpen ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${guestRequestOpen ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.08)"}`, color: guestRequestOpen ? "#00E5FF" : "rgba(255,255,255,0.5)" }}>
                      🎤 신청하기
                    </button>
                    {guestRequestOpen && (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative">
                          <Icon icon="solar:magnifier-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); searchSongs(e.target.value); }}
                            placeholder="노래 검색..."
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white/5 text-white/80 text-xs placeholder-white/20 outline-none"
                            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                            onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                        </div>
                        {(showResults || isSearching) && (
                          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                            {isSearching && (
                              <div className="px-3 py-2 text-white/30 text-xs">검색 중...</div>
                            )}
                            {searchResults.map(song => (
                              <div key={song.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-white/5">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/75 text-xs truncate">{song.title}</p>
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
                <div className="flex items-center gap-2">
                  <Icon icon="solar:microphone-bold" className="text-[#00E5FF] w-3.5 h-3.5" />
                  <span className="text-white/70 text-xs font-bold tracking-wider">대기열</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(0,229,255,0.08)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>
                    {queue.filter(q => q.status !== "done").length}곡
                  </span>
                </div>
                {queue.length === 0 && <p className="text-white/20 text-xs text-center py-3 italic">대기열이 비어 있습니다</p>}
                {queue.map((item, index) => (
                  <div key={item.id} className="rounded-lg flex flex-col gap-1.5 p-2.5"
                    style={{ background: item.status === "active" ? "rgba(0,229,255,0.05)" : item.pendingApproval ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)", border: item.status === "active" ? "1px solid rgba(0,229,255,0.2)" : "1px solid rgba(255,255,255,0.04)", opacity: item.status === "done" ? 0.35 : 1 }}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black w-4 text-center flex-shrink-0 mt-0.5" style={{ color: item.status === "active" ? "#00E5FF" : "rgba(255,255,255,0.25)" }}>{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-semibold truncate">{item.songTitle}</p>
                        <p className="text-white/30 text-[10px] truncate">{item.artist}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: item.status === "active" ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.04)", color: item.status === "active" ? "#00E5FF" : "rgba(255,255,255,0.25)", border: item.status === "active" ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(255,255,255,0.06)" }}>
                        {item.status === "active" ? "진행중" : item.pendingApproval ? "대기중" : item.status === "done" ? "완료" : "대기중"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-6">
                      <Icon icon="solar:user-bold" className="w-2.5 h-2.5 text-white/20" />
                      <span className="text-[10px]" style={{ color: item.singerName ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>{item.singerName ?? "미배정"}</span>
                    </div>
                    {isHost && (
                      <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                        {!item.pendingApproval ? (
                          <>
                            <button onClick={() => setParticipantModalQueueId(item.id)}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                              <Icon icon="solar:user-plus-bold" className="w-2.5 h-2.5" /> 배정
                            </button>
                            {item.status === "waiting" && (
                              <button onClick={() => handleStartSong(item)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
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
                <Leaderboard />
              </div>
            )}
          </div>
        </div>

        {/* Participant Row (full width) */}
        <ParticipantRow
          participants={participants}
          activeSingerId={activeSongId ? (activeItem?.singerId ?? null) : null}
          currentUserId={MY_ID}
          isHost={isHost}
          onMicToggle={handleToggleMic}
          onAssign={id => setParticipantModalQueueId(id)}
          onTransferHost={handleTransferHost}
        />

        {/* Desktop action bar */}
        <div className="hidden lg:block flex-shrink-0">
          <BottomActionBar />
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 px-3 pt-3 pb-3"
        style={{ background: "linear-gradient(to top, rgba(7,7,7,0.98) 70%, transparent)" }}>
        <BottomActionBar />
      </div>

      {/* Toasts */}
      {lastGift && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap"
          style={{ background: "rgba(255,0,127,0.15)", border: "1px solid rgba(255,0,127,0.4)", color: "#FF007F", boxShadow: "0 0 20px rgba(255,0,127,0.3)" }}>
          {lastGift}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
          style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>
          {toast}
        </div>
      )}

      {/* Ticket modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-6 flex flex-col items-center gap-4"
            style={{ background: "rgba(14,14,14,0.98)", border: "1px solid rgba(201,168,76,0.25)" }}>
            <span className="text-3xl">🎟️</span>
            <div className="text-center">
              <p className="text-white font-bold">입장권이 필요합니다</p>
              <p className="text-white/50 text-sm mt-1">이 룸은 {TICKET_COST.toLocaleString()} O₂ 입장권이 필요합니다</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowTicketModal(false)} className="flex-1 py-2.5 rounded-lg text-sm text-white/50 transition-all hover:text-white/70" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>취소</button>
              <button onClick={() => { setTicketChecked(true); setShowTicketModal(false); handlePlay(); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }}>
                {TICKET_COST.toLocaleString()} O₂ 입장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participant assignment modal */}
      {participantModalQueueId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setParticipantModalQueueId(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "rgba(14,14,14,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">노래할 참여자 선택</h3>
                {(() => { const t = queue.find(q => q.id === participantModalQueueId); return t ? <p className="text-white/35 text-xs mt-0.5">&ldquo;{t.songTitle}&rdquo;</p> : null; })()}
              </div>
              <button onClick={() => setParticipantModalQueueId(null)} className="text-white/35 hover:text-white/60">
                <Icon icon="solar:close-bold" className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {participants.map(p => {
                const color = nickColor(p.nickname);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                      {p.nickname[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-semibold">{p.nickname}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: !p.isMuted ? "#22C55E" : "rgba(255,255,255,0.2)" }} />
                        <span className="text-white/30 text-[10px]">{!p.isMuted ? "마이크 켜짐" : "마이크 꺼짐"}</span>
                        {p.isVIP && <span className="text-[10px] px-1 rounded" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>VIP</span>}
                      </div>
                    </div>
                    <button onClick={() => handleAssignParticipant(participantModalQueueId, p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                      선택
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Nickname entry modal */}
      {nicknameModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: "rgba(10,10,10,0.99)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 40px rgba(0,229,255,0.1)" }}>
            <div className="text-center">
              <span className="text-3xl">🎤</span>
              <h2 className="text-white font-black text-lg mt-2">닉네임을 입력하세요</h2>
              <p className="text-white/35 text-sm mt-1">룸에서 사용할 이름을 정해주세요</p>
            </div>
            <div className="relative">
              <input
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleNicknameSubmit(); }}
                placeholder="예: 노래왕김씨"
                maxLength={20}
                autoFocus
                className="w-full bg-white/5 text-white text-sm px-4 py-3 rounded-xl outline-none placeholder-white/20"
                style={{ border: "1px solid rgba(0,229,255,0.3)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.6)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)")}
              />
              <button
                onClick={() => setNicknameInput(randomNickname())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none hover:scale-110 transition-transform"
                title="랜덤 닉네임"
              >
                🎲
              </button>
            </div>
            <button
              onClick={handleNicknameSubmit}
              disabled={!nicknameInput.trim()}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", boxShadow: nicknameInput.trim() ? "0 0 20px rgba(0,229,255,0.15)" : "none" }}
            >
              입장하기
            </button>
          </div>
        </div>
      )}

      <style>{`
        .video-container { aspect-ratio: 16 / 9; }
        @media (min-width: 1024px) { .video-container { aspect-ratio: unset; } }
        @keyframes scan-line {
          0%, 100% { transform: translateX(-100%); }
          50%       { transform: translateX(200%); }
        }
      `}</style>
    </div>
    </ZoomVideoRoom>
  );
}
