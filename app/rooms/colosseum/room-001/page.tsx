"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { Leaderboard } from "@/components/room/Leaderboard";
import { BottomActionBar } from "@/components/room/BottomActionBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRoomStore } from "@/lib/store/roomStore";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";
// Heavy components — lazy-loaded, no SSR (use browser APIs)
const ReactiveBackground = dynamic(
  () => import("@/components/room/ReactiveBackground"),
  { ssr: false }
);

// Other room components
import { FloatingPanel } from "@/components/room/PartyRoomShell";
import { YouTubeBackgroundPlayer } from "@/components/room/YouTubeBackgroundPlayer";
import MainStage from "@/components/room/MainStage";
import ParticipantRow, { type RoomParticipant } from "@/components/room/ParticipantRow";
import VoiceScoreDisplay from "@/components/room/VoiceScoreDisplay";
import DuetMode, { type DuetSinger } from "@/components/room/DuetMode";
import AudienceReactions, { type AudienceReactionsHandle } from "@/components/room/AudienceReactions";

// Hooks
import { useBPMDetector } from "@/lib/audio/useBPMDetector";
import { useVoiceScoring } from "@/lib/scoring/useVoiceScoring";
import { hasNickname, getUserNickname, setUserNickname, randomNickname } from "@/lib/utils/userSession";
import { envConfig } from "@/lib/utils/envCheck";
import { useDailyBroadcast } from "@/hooks/useDailyBroadcast";
import { useRealtimeChat } from "@/lib/supabase/useRealtimeChat";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/supabaseClient";

// ── Constants ──────────────────────────────────────────────────────────────────
const SONG_TITLE = "안동역에서";
const ARTIST_NAME = "진성";
const YOUTUBE_ID = "L26jSx5TZns";

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? (url.match(/^[a-zA-Z0-9_-]{11}$/) ? url : null);
}
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

// ── 배경 옵션 ──────────────────────────────────────────────────────────────────
const ROOM_BG_OPTIONS = [
  { id: "dark",      label: "🌑 기본 다크",  gradient: "radial-gradient(ellipse at center, rgba(0,229,255,0.04) 0%, #070707 70%)", premium: false },
  { id: "city",      label: "🌃 도시야경",   gradient: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", premium: false },
  { id: "space",     label: "🌌 우주파티",   gradient: "linear-gradient(135deg,#0f0c29,#302b63,#000000)", premium: false },
  {
    id: "premium-1", label: "✨ 프리미엄 1",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEhTk7WuLOMkMHHKuX-IPA1ic6FXYH4czFNVhqRcKtbS1Wlkp5tg2jpMUKIs6a2Ju7RhknLzK5V7XipSOWPMMVOi6FyW62UlRZJzjYZ8NvIKfnAcMwJHSNVEMFHCAOxq2pgAj9UHxfAcPYwNGVJmHI9-xY6G6b5UCVOkY3WyRKH1TjhXlcIaT5mwqqhhHEs",
    premium: true,
  },
  {
    id: "premium-2", label: "✨ 프리미엄 2",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEg077Ew0Ol_z-dgXytQAuMtD-21etHa-f-TLheUTxlyQjVnE9vvyDUHvy-BEaeYsFfwnIEzImcPGJEpzfOHiywhI3vRl6sGxMbOsdI-ud7AymyQ3fjt3ZOuQHWu6oYNesaqy1Ul50WK1s3vlRWTlQH6YpcDyHPwwcBnfboYYDnKqffW9-krh6zvDSM318o",
    premium: true,
  },
  {
    id: "premium-3", label: "✨ 프리미엄 3",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEgnqrvLVVyAgqkWmGRK17DRvHZWfYUvIWaYqrBseJyyA_vS07ixzkjWCHDjskb8dRpNw-gu_P13oPsOTGkQaXyDmBIkqeLNmL-dlMk0rj27KOSbU7CRYFXd9UJ2Im50wX8LYwNkY5RPX-sDWvPVYng65peK-z3VsI5XdTi3RdN1QOICbJD7F8wBpwVHWJE",
    premium: true,
  },
] as const;
type RoomBg = typeof ROOM_BG_OPTIONS[number];

// ── Component ──────────────────────────────────────────────────────────────────
export default function ColosseumRoom001Page() {
  const router = useRouter();

  // Role
  const [isHost, setIsHost] = useState(false); // API 응답 전까지 게스트로 시작

  // ── Daily.co 단방향 방송 ───────────────────────────────────────────────────
  const [broadcastRoomUrl, setBroadcastRoomUrl] = useState("");
  const [broadcastToken, setBroadcastToken]   = useState<string | null>(null);
  const [broadcastRole, setBroadcastRole]     = useState<"host" | "guest">("guest");
  const [nicknameForBroadcast, setNicknameForBroadcast] = useState("게스트");
  const [broadcastReady, setBroadcastReady]   = useState(false); // API 완료 후 true

  // ── Daily app-message 수신 핸들러 (채팅·타이머·콘텐츠 동기화) ─────────────
  const handleAppMessage = useCallback((data: unknown) => {
    const msg = data as Record<string, unknown>;
    if (!msg || typeof msg !== "object") return;

    // 채팅 메시지
    if (msg._type === "chat") {
      sendRealtimeMessage(String(msg.text ?? ""), (msg.msgType as "chat" | "system") ?? "chat");
      return;
    }
    // 콘텐츠 동기화 (게스트만 적용)
    if (msg._type === "content" && !isHost) {
      if (msg.mainVideoId      !== undefined) { setMainVideoId(String(msg.mainVideoId)); setMainVideoPlaying(false); }
      if (msg.mainVideoPlaying !== undefined) setMainVideoPlaying(Boolean(msg.mainVideoPlaying));
      if (msg.karaokeVideoId   !== undefined) setKaraokeVideoId(msg.karaokeVideoId as string | null);
      if (msg.karaokeLyrics    !== undefined) setKaraokeLyrics(msg.karaokeLyrics as string[]);
    }
    // 타이머 동기화 (게스트만 적용)
    if (msg._type === "timer" && !isHost && msg.startTs) {
      const startTs = Number(msg.startTs);
      localStorage.setItem("colosseum-broadcast-start", String(startTs));
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      const remaining = Math.max(1, 2 * 60 * 60 - elapsed);
      setSecondsLeft(remaining);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  const {
    joined, localAudioOn, localVideoOn,
    toggleMic, toggleCamera,
    guestCount,
    hostVideoTrack, hostAudioTrack,
    sendAppMessage,
    error: dailyError, status: dailyStatus,
    participants: dailyParticipants,
  } = useDailyBroadcast({
    roomUrl:  broadcastRoomUrl,
    token:    broadcastToken,
    isHost:   broadcastRole === "host",
    nickname: nicknameForBroadcast,
    ready:    broadcastReady,
    onAppMessage: handleAppMessage,
  });

  // 호스트: Daily app-message로 콘텐츠 상태 전송
  const broadcastContent = useCallback((patch: Record<string, unknown>) => {
    if (!isHost) return;
    sendAppMessage({ _type: "content", ...patch });
  }, [isHost, sendAppMessage]);

  // 게스트: 호스트 Daily 비디오 트랙을 <video>에 연결
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!remoteVideoRef.current) return;
    if (hostVideoTrack) {
      remoteVideoRef.current.srcObject = new MediaStream([hostVideoTrack]);
      remoteVideoRef.current.play().catch(() => {});
    } else {
      remoteVideoRef.current.srcObject = null;
    }
  }, [hostVideoTrack]);

  // 게스트: 호스트 오디오 트랙 연결 (Daily SDK가 자동 처리하지 않을 경우 대비)
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!remoteAudioRef.current) return;
    if (hostAudioTrack) {
      remoteAudioRef.current.srcObject = new MediaStream([hostAudioTrack]);
      remoteAudioRef.current.play().catch(() => {});
    } else {
      remoteAudioRef.current.srcObject = null;
    }
  }, [hostAudioTrack]);

  // Broadcast countdown (2 hours = 7200s) — starts on mount
  const [secondsLeft, setSecondsLeft] = useState(2 * 60 * 60);
  const [broadcastEnded, setBroadcastEnded] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 비호스트가 호스트 기능 클릭 시 안내 모달
  const [hostInfoOpen, setHostInfoOpen] = useState(false);

  const formatCountdown = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Ticket
  const [ticketChecked, setTicketChecked] = useState(TICKET_COST === 0);
  const [showTicketModal, setShowTicketModal] = useState(TICKET_COST > 0);

  // Host camera
  const [hostStream, setHostStream] = useState<MediaStream | null>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);

  // 설정 팝업 + 볼륨 + 배경
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speakerVol, setSpeakerVol] = useState(80);
  const [micVol, setMicVol]         = useState(80);
  const [selectedBg, setSelectedBg] = useState<RoomBg>(ROOM_BG_OPTIONS[0]);
  // 마스터키 접속자 = isVVIPMember (localStorage)
  const [canUsePremiumBg, setCanUsePremiumBg] = useState(false);
  useEffect(() => {
    setCanUsePremiumBg(
      localStorage.getItem("isVVIPMember") === "true" || isHost
    );
  }, [isHost]);

  // 볼륨 변경 → 오디오 엘리먼트 즉시 반영
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = speakerVol / 100;
    }
  }, [speakerVol]);

  // Panel tabs
  const [activeTab, setActiveTab] = useState<"chat" | "queue">("chat");

  // Chat — Supabase Realtime
  const {
    messages: realtimeMessages,
    sendMessage: sendRealtimeMessage,
    isConnected: chatConnected,
  } = useRealtimeChat("room-001");
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Realtime 메시지를 로컬 ChatMessage 형식으로 변환
  const messages: ChatMessage[] = realtimeMessages.map(m => ({
    id: m.id,
    type: m.type === "chat" ? "user" : m.type as ChatMessage["type"],
    nickname: m.nickname,
    text: m.text,
    timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : undefined,
  }));

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

  // Participants — Daily 실접속자로 동기화
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [participantModalQueueId, setParticipantModalQueueId] = useState<string | null>(null);

  // Daily 참가자 → 하단 접속자 목록 동기화
  useEffect(() => {
    const list: RoomParticipant[] = Object.values(dailyParticipants).map(p => ({
      id: p.session_id,
      nickname: p.user_name ?? (p.local ? nicknameForBroadcast : "게스트"),
      isMuted: !p.tracks.audio.persistentTrack,
      isCurrentSinger: false,
      isVIP: false,
      isHost: p.local ? (broadcastRole === "host") : false,
    }));
    setParticipants(list);
  }, [dailyParticipants, nicknameForBroadcast, broadcastRole]);

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

  // ── 전체화면 ──────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  // ── 메인 무대 영상 (기본 정지) ──────────────────────────────────────────────
  const [mainVideoId, setMainVideoId] = useState("joCz5tmXAcI"); // 호스트가 변경 가능
  const [mainVideoPlaying, setMainVideoPlaying] = useState(false);
  const [mainVideoInput, setMainVideoInput] = useState("");
  const [mainVideoInputOpen, setMainVideoInputOpen] = useState(false);

  // ── 노래방 플로팅 패널 ────────────────────────────────────────────────────
  const [karaokeVideoId, setKaraokeVideoId] = useState<string | null>(null);
  const [karaokeLyrics, setKaraokeLyrics] = useState<string[]>([]);
  const [karaokeUrlInput, setKaraokeUrlInput] = useState("");
  const [karaokeInputOpen, setKaraokeInputOpen] = useState(false);
  const [karaokeUrlError, setKaraokeUrlError] = useState(false);
  const [karaokePopPos, setKaraokePopPos] = useState({ x: 144, y: 96 });
  const karaokeDragging = useRef(false);
  const karaokeDragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const startKaraokeDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    karaokeDragging.current = true;
    karaokeDragOrigin.current = { mx: e.clientX, my: e.clientY, px: karaokePopPos.x, py: karaokePopPos.y };
    const onMove = (ev: MouseEvent) => {
      if (!karaokeDragging.current) return;
      setKaraokePopPos({
        x: Math.max(0, Math.min(window.innerWidth - 288, karaokeDragOrigin.current.px + ev.clientX - karaokeDragOrigin.current.mx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, karaokeDragOrigin.current.py + ev.clientY - karaokeDragOrigin.current.my)),
      });
    };
    const onUp = () => {
      karaokeDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

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
    setNicknameForBroadcast(name);
    setNicknameModalOpen(false);
  };

  // ── broadcast-join: 고정 세션 THE COLOSSEUM 입장 ────────────────────────
  useEffect(() => {
    const nickname = getUserNickname();
    if (nickname) setNicknameForBroadcast(nickname);

    fetch("/api/rooms/colosseum/broadcast-join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname || "게스트" }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.roomUrl || !data.token) return;
        // 모든 값을 한 번에 설정 후 ready = true (React 18 자동 배치)
        setBroadcastRoomUrl(data.roomUrl);
        setBroadcastToken(data.token);
        setBroadcastRole(data.role ?? "guest");
        setIsHost(data.role === "host");
        setBroadcastReady(true); // ← 이 시점에 useDailyBroadcast join 시작
      })
      .catch(console.error);
  }, []);

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
    sendRealtimeMessage(
      isChamp ? `${MY_NICKNAME}님이 샴페인을 선물했습니다! 🥂` : `${MY_NICKNAME}님이 꽃다발을 선물했습니다! 🌸`,
      isChamp ? "gift_champagne" : "gift_bouquet"
    );
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

  // ── Host camera ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isHost) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => setHostStream(stream))
      .catch(() => {});
  }, [isHost]);

  useEffect(() => {
    if (hostVideoRef.current && hostStream) {
      hostVideoRef.current.srcObject = hostStream;
    }
  }, [hostStream]);

  useEffect(() => {
    return () => { hostStream?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Broadcast countdown ────────────────────────────────────────────────────
  useEffect(() => {
    const KEY = "colosseum-broadcast-start";
    const TWO_HOURS = 2 * 60 * 60;

    const raw = localStorage.getItem(KEY);

    if (isHost) {
      if (!raw) {
        // 호스트 첫 입장: 시작시각 기록
        localStorage.setItem(KEY, String(Date.now()));
      }
    } else {
      // 게스트: KEY 없으면 방송 준비중 — 카운트다운 시작 안 함
      if (!raw) return;
    }

    const startTs = Number(localStorage.getItem(KEY) ?? Date.now());
    const elapsed = Math.floor((Date.now() - startTs) / 1000);
    const remaining = Math.max(0, TWO_HOURS - elapsed);

    if (remaining === 0) { localStorage.removeItem(KEY); return; }
    setSecondsLeft(remaining);

    // 호스트: 게스트에게 타이머 시작시각 전송 (10초마다, 늦게 입장한 게스트 동기화)
    if (isHost) {
      const sendTs = () => sendAppMessage({ _type: "timer", startTs });
      sendTs();
      const syncInterval = setInterval(sendTs, 10000);
      const cleanup = () => clearInterval(syncInterval);
      window.addEventListener("beforeunload", cleanup, { once: true });
    }

    countdownRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          endBroadcast(isHost);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  // ── 방송 종료 공통 처리 ───────────────────────────────────────────────────
  const endBroadcast = useCallback((hostMode: boolean) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    localStorage.removeItem("colosseum-broadcast-start");
    setBroadcastEnded(true);
    if (hostMode) {
      // Daily 방 삭제 후 홈으로
      fetch("/api/rooms/colosseum/end-broadcast", { method: "POST" })
        .catch(() => {})
        .finally(() => setTimeout(() => router.push("/"), 2000));
    } else {
      // 게스트: 3초 후 홈으로
      setTimeout(() => router.push("/"), 3000);
    }
  }, [router]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addSysMsg = (text: string) => {
    sendRealtimeMessage(text, "system");
    sendAppMessage({ _type: "chat", text, msgType: "system", nickname: "system" });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

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
  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    // Auto-detect song request: "신청: 곡명" or "신청 곡명"
    const reqMatch = text.match(/^신청[:\s]\s*(.+)$/);
    if (reqMatch) {
      const songTitle = reqMatch[1].trim();
      const newItem: QueueItem = {
        id: `req-${Date.now()}`,
        songTitle,
        artist: "",
        singerName: MY_NICKNAME,
        singerId: MY_ID,
        status: "waiting",
        pendingApproval: true,
      };
      setQueue(prev => [...prev, newItem]);
      addSysMsg(`🎵 "${songTitle}" 신청이 접수되었습니다`);
    }
    // 자신은 로컬 추가, 상대방은 Daily app-message로 전달
    sendRealtimeMessage(text, "chat");
    sendAppMessage({ _type: "chat", text, msgType: "chat", nickname: nicknameForBroadcast });
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
    <div className="flex flex-col bg-[#070707] min-h-screen lg:h-screen lg:overflow-hidden relative overflow-x-hidden">

      {/* 선택된 배경 이미지 레이어 */}
      {"image" in selectedBg && selectedBg.image ? (
        <div className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url('${selectedBg.image}')`,
            backgroundSize: "cover", backgroundPosition: "center",
            backgroundColor: "rgba(4,4,10,0.75)", backgroundBlendMode: "luminosity",
          }} />
      ) : "gradient" in selectedBg && selectedBg.gradient ? (
        <div className="fixed inset-0 z-0 pointer-events-none"
          style={{ background: selectedBg.gradient, opacity: 0.8 }} />
      ) : null}

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

      <button onClick={() => setDirectorOpen(true)}
        className="fixed top-14 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
        style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.35)", color: "#FF007F", backdropFilter: "blur(12px)", boxShadow: "0 0 12px rgba(255,0,127,0.15)" }}>
        <Icon icon="solar:user-star-bold" className="w-3.5 h-3.5" />
        디렉터 호출
      </button>
      <QuickCallModal open={directorOpen} onClose={() => setDirectorOpen(false)} roomId="room-001" />

      {/* 노래방 버튼 — 비호스트 클릭 시 안내 */}
      {!isHost && (
        <button
          type="button"
          onClick={() => setHostInfoOpen(true)}
          className="fixed top-14 left-36 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)" }}
        >
          <Icon icon="solar:music-note-2-bold" className="w-3.5 h-3.5" />
          🎤 노래방
        </button>
      )}
      {/* 노래방 버튼 (호스트 전용) */}
      {isHost && (
        <button
          type="button"
          onClick={() => setKaraokeInputOpen(v => !v)}
          className="fixed top-14 left-36 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
          style={{
            background: karaokeVideoId ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.07)",
            border: `1px solid ${karaokeVideoId ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.15)"}`,
            color: karaokeVideoId ? "#ec4899" : "rgba(255,255,255,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Icon icon="solar:music-note-2-bold" className="w-3.5 h-3.5" />
          🎤 노래방 {karaokeVideoId ? "ON" : "OFF"}
        </button>
      )}

      {/* 노래방 URL 입력 팝오버 (드래그 가능) */}
      {isHost && karaokeInputOpen && (
        <div className="fixed z-50 w-72 rounded-xl flex flex-col overflow-hidden"
          style={{ left: karaokePopPos.x, top: karaokePopPos.y, background: "rgba(8,8,20,0.97)", border: "1px solid rgba(236,72,153,0.3)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
          {/* 드래그 핸들 */}
          <div
            onMouseDown={startKaraokeDrag}
            className="flex items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing select-none"
            style={{ background: "rgba(236,72,153,0.1)", borderBottom: "1px solid rgba(236,72,153,0.15)" }}
          >
            <span className="text-[10px] font-bold tracking-widest text-pink-400">🎤 노래방</span>
            <Icon icon="solar:menu-dots-bold" className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="p-4 flex flex-col gap-3">
          <p className="text-[11px] text-white/50 font-medium tracking-widest">YouTube URL 입력</p>
          <div className="flex gap-2">
            <input
              value={karaokeUrlInput}
              onChange={e => { setKaraokeUrlInput(e.target.value); setKaraokeUrlError(false); }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const id = extractYouTubeId(karaokeUrlInput.trim());
                  if (id) { setKaraokeVideoId(id); setKaraokeInputOpen(false); setKaraokeUrlError(false); broadcastContent({ karaokeVideoId: id }); }
                  else setKaraokeUrlError(true);
                }
              }}
              placeholder="youtube.com/watch?v=... 또는 ID"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${karaokeUrlError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}` }}
            />
            <button
              type="button"
              onClick={() => {
                const id = extractYouTubeId(karaokeUrlInput.trim());
                if (id) { setKaraokeVideoId(id); setKaraokeInputOpen(false); setKaraokeUrlError(false); broadcastContent({ karaokeVideoId: id }); }
                else setKaraokeUrlError(true);
              }}
              className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold"
              style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.4)", color: "#ec4899" }}
            >재생</button>
          </div>
          {karaokeUrlError && <p className="text-[10px] text-red-400">올바른 YouTube URL을 입력해주세요.</p>}
          {karaokeVideoId && (
            <button
              type="button"
              onClick={() => { setKaraokeVideoId(null); setKaraokeUrlInput(""); setKaraokeInputOpen(false); broadcastContent({ karaokeVideoId: null }); }}
              className="text-[11px] py-1.5 rounded-lg"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.8)" }}
            >🔴 영상 중지</button>
          )}
          <div className="border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] text-white/30 mb-2">가사 입력 (선택)</p>
            <textarea
              placeholder={"가사를 한 줄씩 입력하면\n화면 하단에 표시됩니다"}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20 resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.7 }}
              onChange={e => {
                const lines = e.target.value.split("\n").filter(l => l.trim());
                setKaraokeLyrics(lines);
                broadcastContent({ karaokeLyrics: lines });
              }}
            />
          </div>
          </div>
        </div>
      )}

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
        <div className="flex flex-col items-center gap-0.5">
          <h1 className="text-[#00E5FF] font-black text-sm tracking-widest" style={{ textShadow: "0 0 10px rgba(0,229,255,0.5)" }}>
            THE COLOSSEUM
          </h1>
          {/* Countdown timer */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: broadcastEnded ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.12)", border: broadcastEnded ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(239,68,68,0.3)" }}>
              <span className={`w-1.5 h-1.5 rounded-full ${broadcastEnded ? "bg-red-500/40" : "bg-red-500 animate-pulse"} block`} />
              <span className="text-[10px] font-bold text-red-400">{broadcastEnded ? "방송종료" : "LIVE"}</span>
            </div>
            {!broadcastEnded && (
              <span className={`text-[11px] font-mono font-bold tabular-nums ${secondsLeft < 600 ? "text-red-400" : "text-white/50"}`}>
                {formatCountdown(secondsLeft)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <YouTubeBackgroundPlayer videoId="ISrBAxw12bk" maxVolume={50} />
          {/* 역할 표시 — 수동 토글 불가, API 응답으로만 결정 */}
          {isHost && (
            <div className="px-2.5 py-1 rounded-lg text-[10px] font-medium"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
              👑 호스트
            </div>
          )}
          {/* 실시간 시청자 수 (Daily 연결 시 실제값, 미연결 시 mock) */}
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:user-bold" className="text-white/40 w-4 h-4" />
            <span className="text-white/60 text-sm">{joined ? guestCount : 127}</span>
          </div>

          {/* 호스트 방송 종료 버튼 */}
          {isHost && (
            <button
              type="button"
              title="방송 종료"
              onClick={() => endBroadcast(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80 active:scale-95"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              <Icon icon="solar:stop-bold" className="w-3.5 h-3.5" />
              방송종료
            </button>
          )}

          {/* 호스트 마이크 토글 (Daily 연결 후 표시) */}
          {isHost && joined && (
            <button
              type="button"
              title={localAudioOn ? "마이크 끄기" : "마이크 켜기 (방송 시작)"}
              onClick={toggleMic}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80 active:scale-95"
              style={{
                background: localAudioOn ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${localAudioOn ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.12)"}`,
                color: localAudioOn ? "#00E5FF" : "rgba(255,255,255,0.4)",
              }}
            >
              <Icon icon={localAudioOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"} className="w-3.5 h-3.5" />
              {localAudioOn ? "ON AIR" : "오프"}
            </button>
          )}

          {/* Daily 연결 상태 인디케이터 */}
          {dailyStatus === "connecting" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse block" />
              <span className="text-[9px] text-white/40 font-semibold tracking-wider">연결 중...</span>
            </div>
          )}
          {dailyStatus === "connected" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse block" />
              <span className="text-[9px] text-[#00E5FF] font-semibold tracking-wider">연결됨</span>
            </div>
          )}
          {dailyStatus === "error" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full cursor-help"
              title={dailyError ?? ""}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" />
              <span className="text-[9px] text-red-400 font-semibold tracking-wider">연결 실패</span>
            </div>
          )}
          <button
            type="button"
            title={isFullscreen ? "전체화면 종료 (ESC)" : "전체화면"}
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:opacity-80 active:scale-95"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Icon
              icon={isFullscreen ? "solar:quit-full-screen-bold" : "solar:full-screen-bold"}
              className="w-3.5 h-3.5 text-white/50"
            />
          </button>
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

            {/* Stage background */}
            <div className="absolute inset-0 bg-[#070707]" style={{ background: "radial-gradient(ellipse at center, rgba(0,229,255,0.04) 0%, #070707 70%)" }} />

            {/* Duet test button (host only, shown in stage) */}
            {isHost && !isDuetMode && (
              <button onClick={() => setIsDuetMode(true)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}>
                🎤 듀엣 모드 테스트
              </button>
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
              <div className="ml-auto flex items-center gap-1.5 mr-1">
                <span className={`w-1.5 h-1.5 rounded-full ${chatConnected ? "bg-green-400" : "bg-red-400"}`} title={chatConnected ? "채팅 연결됨" : "채팅 연결 중..."} />
                <div className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: "rgba(0,229,255,0.1)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>
                  {participants.length}명
                </div>
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
                    onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSendMessage(); }}
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
          <BottomActionBar onSettingsClick={() => setSettingsOpen(true)} />
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 px-3 pt-3 pb-3"
        style={{ background: "linear-gradient(to top, rgba(7,7,7,0.98) 70%, transparent)" }}>
        <BottomActionBar onSettingsClick={() => setSettingsOpen(true)} />
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
              <button onClick={() => { setTicketChecked(true); setShowTicketModal(false); }}
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

      {/* ── 호스트 자기 화면 (우측 상단 고정) ── */}
      {isHost && (
        <FloatingPanel defaultW={280} aspectRatio={16 / 9} zIndex={55}
          defaultX={typeof window !== "undefined" ? Math.max(0, window.innerWidth - 300) : 900}
          defaultY={80}>
          {hostStream ? (
            <video ref={hostVideoRef} autoPlay muted playsInline
              className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: "rgba(8,8,20,0.9)", backdropFilter: "blur(8px)" }}>
              <span className="text-3xl">📷</span>
              <span className="text-white/40 text-xs">카메라 연결 중...</span>
            </div>
          )}
        </FloatingPanel>
      )}

      {/* ── 게스트 화면: 호스트 Daily 비디오 (좌상단 배치) ── */}
      {!isHost && joined && (
        <FloatingPanel defaultW={480} aspectRatio={16 / 9} zIndex={55}
          defaultX={16} defaultY={80}>
          {hostVideoTrack ? (
            <video ref={remoteVideoRef} autoPlay playsInline
              className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: "rgba(8,8,20,0.95)" }}>
              <span className="text-3xl animate-pulse">📡</span>
              <span className="text-white/40 text-xs">호스트 연결 대기 중...</span>
            </div>
          )}
        </FloatingPanel>
      )}

      {/* 호스트 오디오 (Daily SDK 자동처리 보조) */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* ── BGM (YouTubeBackgroundPlayer — 버튼 + 이퀄라이저 포함) ── */}
      {/* 버튼은 헤더 우측에 렌더링, 여기선 플레이어만 마운트 */}

      {/* ── 메인 무대 영상 패널 (호스트: 좌상단, 게스트는 Daily 패널과 겹치지 않게 우측) ── */}
      <FloatingPanel defaultW={520} aspectRatio={16 / 9} zIndex={60}
        defaultX={isHost ? 16 : 520} defaultY={80}>
        {mainVideoPlaying ? (
          <iframe
            key={`main-${mainVideoId}`}
            title="메인 무대"
            src={`https://www.youtube.com/embed/${mainVideoId}?rel=0&modestbranding=1&autoplay=1`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundImage: `url(https://img.youtube.com/vi/${mainVideoId}/maxresdefault.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
            {/* 호스트: URL 변경 버튼 */}
            {isHost && (
              <button type="button" title="영상 변경"
                onClick={() => setMainVideoInputOpen(v => !v)}
                className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>
                <Icon icon="solar:link-bold" className="w-3 h-3" />
                URL 변경
              </button>
            )}
            {/* 호스트 URL 입력 */}
            {isHost && mainVideoInputOpen && (
              <div className="absolute top-10 right-3 z-30 w-64 rounded-xl p-3 flex flex-col gap-2"
                style={{ background: "rgba(8,8,20,0.97)", border: "1px solid rgba(0,229,255,0.3)", backdropFilter: "blur(16px)" }}>
                <p className="text-[10px] text-white/50 tracking-widest">YouTube URL</p>
                <div className="flex gap-2">
                  <input value={mainVideoInput}
                    onChange={e => setMainVideoInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        const id = extractYouTubeId(mainVideoInput.trim());
                        if (id) { setMainVideoId(id); setMainVideoPlaying(false); setMainVideoInputOpen(false); setMainVideoInput(""); broadcastContent({ mainVideoId: id, mainVideoPlaying: false }); }
                      }
                    }}
                    placeholder="youtube.com/watch?v=..."
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs text-white outline-none placeholder-white/20"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button type="button" onClick={() => {
                    const id = extractYouTubeId(mainVideoInput.trim());
                    if (id) { setMainVideoId(id); setMainVideoPlaying(false); setMainVideoInputOpen(false); setMainVideoInput(""); broadcastContent({ mainVideoId: id, mainVideoPlaying: false }); }
                  }}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold"
                    style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                    적용
                  </button>
                </div>
              </div>
            )}
            <button type="button"
              onClick={() => { setMainVideoPlaying(true); broadcastContent({ mainVideoPlaying: true }); }}
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              title="재생"
              style={{ background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.7)", backdropFilter: "blur(6px)" }}>
              <Icon icon="solar:play-bold" className="w-9 h-9 text-white" style={{ marginLeft: 4 }} />
            </button>
            <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/50 tracking-wider">클릭하여 재생</p>
          </div>
        )}
      </FloatingPanel>

      {/* ── 노래방 플로팅 패널 (사용자 URL 입력) ── */}
      {karaokeVideoId && (
        <FloatingPanel key={karaokeVideoId} defaultW={480} aspectRatio={16 / 9} zIndex={65}
          defaultX={16} defaultY={360}>
          <iframe
            title="노래방 유튜브"
            src={`https://www.youtube.com/embed/${karaokeVideoId}?rel=0&modestbranding=1&autoplay=1`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </FloatingPanel>
      )}

      {/* ── 가사 자막 ── */}
      {karaokeVideoId && karaokeLyrics.length > 0 && (
        <div className="fixed bottom-28 left-0 right-0 z-50 flex flex-col items-center gap-1 px-6 py-3 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}>
          {karaokeLyrics.slice(0, 4).map((line, i) => (
            <p key={i} className="text-center font-semibold drop-shadow-lg"
              style={{
                fontSize: i === 0 ? "1.1rem" : "0.8rem",
                color: i === 0 ? "#00E5FF" : "rgba(255,255,255,0.45)",
                textShadow: i === 0 ? "0 0 20px rgba(0,229,255,0.6)" : "none",
                letterSpacing: "0.05em",
              }}>
              {line}
            </p>
          ))}
        </div>
      )}

      {/* ── 설정 팝업 ── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
          <div className="w-full max-w-xs rounded-2xl overflow-hidden"
            style={{ background: "rgba(8,8,20,0.98)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 30px rgba(0,0,0,0.8)" }}>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <span className="text-sm font-bold text-white">⚙️ 설정</span>
              <button type="button" title="닫기" onClick={() => setSettingsOpen(false)}
                className="text-white/30 hover:text-white/70 transition-colors">
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-5">
              {/* 방송 음량 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/60">🔊 방송 음량</span>
                  <span className="text-sm font-black tabular-nums" style={{ color: "#00E5FF" }}>{speakerVol}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setSpeakerVol(v => Math.max(0, v - 10))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black transition-all active:scale-95 hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                    −
                  </button>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${speakerVol}%`, background: "linear-gradient(90deg, #00E5FF, #0099cc)" }} />
                  </div>
                  <button type="button"
                    onClick={() => setSpeakerVol(v => Math.min(100, v + 10))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black transition-all active:scale-95 hover:opacity-80"
                    style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF" }}>
                    +
                  </button>
                </div>
              </div>

              {/* 마이크 음량 (호스트 전용) */}
              {isHost && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/60">🎤 마이크 음량</span>
                    <span className="text-sm font-black tabular-nums" style={{ color: "#ec4899" }}>{micVol}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => {
                        const next = Math.max(0, micVol - 10);
                        setMicVol(next);
                        // Daily.co 마이크 gain 조절 (setLocalAudio로 토글)
                        if (next === 0) { toggleMic(); }
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black transition-all active:scale-95 hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                      −
                    </button>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${micVol}%`, background: "linear-gradient(90deg, #ec4899, #be185d)" }} />
                    </div>
                    <button type="button"
                      onClick={() => {
                        const next = Math.min(100, micVol + 10);
                        setMicVol(next);
                        if (next > 0 && !localAudioOn) { toggleMic(); }
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black transition-all active:scale-95 hover:opacity-80"
                      style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", color: "#ec4899" }}>
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* 배경 선택 */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-white/60">🖼️ 배경 선택</span>
                <div className="grid grid-cols-3 gap-2">
                  {ROOM_BG_OPTIONS.map(bg => {
                    const locked = bg.premium && !canUsePremiumBg;
                    const isActive = selectedBg.id === bg.id;
                    return (
                      <button key={bg.id} type="button"
                        onClick={() => { if (!locked) setSelectedBg(bg as RoomBg); }}
                        className="relative h-14 rounded-xl overflow-hidden flex items-end p-1.5 transition-all"
                        style={{
                          ...("image" in bg && bg.image
                            ? { backgroundImage: `url('${bg.image}')`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "rgba(4,4,10,0.6)", backgroundBlendMode: "luminosity" }
                            : { background: (bg as { gradient?: string }).gradient ?? "#070707" }),
                          outline: isActive ? "2px solid #00E5FF" : "none",
                          outlineOffset: 2,
                          opacity: locked ? 0.5 : 1,
                          cursor: locked ? "not-allowed" : "pointer",
                        }}>
                        <span className="text-[9px] font-bold text-white drop-shadow-lg leading-tight">{bg.label}</span>
                        {locked && (
                          <span className="absolute inset-0 flex items-center justify-center text-lg">🔒</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!canUsePremiumBg && (
                  <p className="text-[10px] text-white/30">🔒 프리미엄 배경은 유료 멤버(마스터키) 전용입니다</p>
                )}
              </div>

              {/* 마이크 ON/OFF 퀵 토글 (호스트 전용) */}
              {isHost && joined && (
                <button type="button" onClick={() => { toggleMic(); setSettingsOpen(false); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: localAudioOn ? "rgba(0,229,255,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${localAudioOn ? "rgba(0,229,255,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: localAudioOn ? "#00E5FF" : "#ef4444",
                  }}>
                  <Icon icon={localAudioOn ? "solar:microphone-bold" : "solar:microphone-slash-bold"} className="inline w-4 h-4 mr-1.5" />
                  마이크 {localAudioOn ? "끄기" : "켜기"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 호스트 권한 안내 모달 ── */}
      {hostInfoOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={e => { if (e.target === e.currentTarget) setHostInfoOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "rgba(8,8,20,0.99)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 40px rgba(0,229,255,0.06)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <span className="text-sm font-bold text-white">👑 호스트 전용 기능</span>
              <button type="button" title="닫기" onClick={() => setHostInfoOpen(false)}
                className="text-white/30 hover:text-white/60 transition-colors">
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-white/60 text-sm leading-relaxed">
                이 기능은 <span className="text-[#00E5FF] font-bold">유료 아이템을 구매한 회원</span>에게만 제공되는 호스트 전용 기능입니다.
              </p>
              <div className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.15)" }}>
                <p className="text-[11px] font-bold text-[#00E5FF] tracking-wider">호스트가 되려면</p>
                <ul className="text-xs text-white/50 flex flex-col gap-1.5">
                  <li>• 쇼핑몰에서 아이템을 1회 이상 구매</li>
                  <li>• 구매 후 다시 입장하면 호스트로 자동 전환</li>
                  <li>• 노래방, 영상 제어, 대기열 관리 등 사용 가능</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setHostInfoOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  닫기
                </button>
                <button type="button" onClick={() => { setHostInfoOpen(false); window.open("/shop", "_blank"); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                  style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }}>
                  쇼핑몰 가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 방송 종료 오버레이 ── */}
      {broadcastEnded && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}>
          <div className="flex flex-col items-center gap-5 text-center px-8">
            <span className="text-6xl">📺</span>
            <div>
              <h2 className="text-white font-black text-2xl">방송이 종료되었습니다</h2>
              <p className="text-white/40 text-sm mt-2">시청해 주셔서 감사합니다! 잠시 후 홈으로 이동합니다.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF" }}>
              홈으로 돌아가기
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
  );
}
