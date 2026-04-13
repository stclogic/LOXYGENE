"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Leaderboard } from "@/components/room/Leaderboard";
import { PIPGrid } from "@/components/room/PIPGrid";
import { BottomActionBar } from "@/components/room/BottomActionBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRoomStore } from "@/lib/store/roomStore";
import Link from "next/link";
import { QuickCallModal } from "@/components/entertainers/QuickCallModal";

const SONG_TITLE = "안동역에서";
const ARTIST_NAME = "진성";
const YOUTUBE_ID = "L26jSx5TZns";
const SONG_END_TIME = 160;

const MOCK_QUEUE = [
  { id: "q1", nickname: "가을바람", songTitle: "사랑했지만 (김광석)", position: 1 },
  { id: "q2", nickname: "봄날의꿈", songTitle: "첫눈처럼 너에게 가겠다", position: 2 },
  { id: "q3", nickname: "여름밤", songTitle: "너에게 난, 나에게 넌", position: 3 },
  { id: "q4", nickname: "하늘별", songTitle: "그녀가 처음 울던 날", position: 4 },
];

const lyrics = [
  { time: 0,      text: "♪ 간주 ♪",               isInterlude: true  },
  { time: 15.20,  text: "바람에 날려버린",           isInterlude: false },
  { time: 18.50,  text: "허무한 맹세였나",           isInterlude: false },
  { time: 23.10,  text: "첫눈이 내리는 날",          isInterlude: false },
  { time: 26.40,  text: "안동역 앞에서",             isInterlude: false },
  { time: 30.80,  text: "만나자고 약속한 사람",       isInterlude: false },
  { time: 38.20,  text: "새벽부터 오는 눈이",         isInterlude: false },
  { time: 42.00,  text: "무릎까지 덮는데",           isInterlude: false },
  { time: 46.50,  text: "안 오는 건지 못 오는 건지",  isInterlude: false },
  { time: 50.30,  text: "오지 않는 사람아",          isInterlude: false },
  { time: 54.10,  text: "안타까운 내 마음만",         isInterlude: false },
  { time: 58.20,  text: "녹고 녹는다",              isInterlude: false },
  { time: 63.50,  text: "기적 소리 끊어진 밤에",      isInterlude: false },
  { time: 70.00,  text: "♪ 간주 ♪",               isInterlude: true  },
  { time: 88.10,  text: "어차피 지워야 할",          isInterlude: false },
  { time: 91.50,  text: "사랑은 꿈이었나",           isInterlude: false },
  { time: 96.10,  text: "첫눈이 내리는 날",          isInterlude: false },
  { time: 99.40,  text: "안동역 앞에서",             isInterlude: false },
  { time: 103.80, text: "만나자고 약속한 사람",       isInterlude: false },
  { time: 111.20, text: "새벽부터 오는 눈이",         isInterlude: false },
  { time: 115.00, text: "무릎까지 덮는데",           isInterlude: false },
  { time: 119.50, text: "안 오는 건지 못 오는 건지",  isInterlude: false },
  { time: 123.30, text: "대답 없는 사람아",          isInterlude: false },
  { time: 127.10, text: "기다리는 내 마음만",         isInterlude: false },
  { time: 131.20, text: "녹고 녹는다",              isInterlude: false },
  { time: 136.50, text: "밤이 깊은 안동역에서",       isInterlude: false },
  { time: 142.50, text: "기다리는 내 마음만",         isInterlude: false },
  { time: 146.50, text: "녹고 녹는다",              isInterlude: false },
  { time: 152.00, text: "밤이 깊은 안동역에서",       isInterlude: false },
  { time: 160.00, text: "♪ ♪ ♪",                isInterlude: true  },
];

function getLyricIndex(elapsed: number): number {
  let idx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (elapsed >= lyrics[i].time) idx = i;
  }
  return idx;
}

export default function ColosseumRoom001Page() {
  const [showQueue, setShowQueue] = useState(true);
  const [lastGift, setLastGift] = useState<string | null>(null);
  const [directorOpen, setDirectorOpen] = useState(false);

  // Playback state
  const [started, setStarted] = useState(false);
  const [songEnded, setSongEnded] = useState(false);
  const [showSongInfo, setShowSongInfo] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Lyrics state
  const [lyricIndex, setLyricIndex] = useState(0);
  const [lyricVisible, setLyricVisible] = useState(true);

  // High-resolution elapsed timer (seconds, float via Date.now())
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLyricIndexRef = useRef(0);

  const gifts = useRoomStore((s) => s.gifts);

  // Gift toast
  useEffect(() => {
    if (gifts.length > 0) {
      const latest = gifts[gifts.length - 1];
      setLastGift(latest.type === "bouquet" ? "💐 꽃다발 전송!" : "🍾 샴페인 전송!");
      const t = setTimeout(() => setLastGift(null), 2000);
      return () => clearTimeout(t);
    }
  }, [gifts]);

  // 100ms tick — update elapsed and sync lyrics
  const tick = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    elapsedRef.current = elapsed;

    // Song end
    if (elapsed >= SONG_END_TIME) {
      if (timerRef.current) clearInterval(timerRef.current);
      setSongEnded(true);
      return;
    }

    const newIndex = getLyricIndex(elapsed);
    if (newIndex !== prevLyricIndexRef.current) {
      setLyricVisible(false);
      setTimeout(() => {
        setLyricIndex(newIndex);
        prevLyricIndexRef.current = newIndex;
        setLyricVisible(true);
      }, 150);
    }
  }, []);

  useEffect(() => {
    if (!started) return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(tick, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, tick]);

  const handlePlay = () => {
    setStarted(true);
    setShowSongInfo(true);
    setTimeout(() => setShowSongInfo(false), 3000);
  };

  const handleRestart = () => {
    setSongEnded(false);
    setLyricIndex(0);
    setLyricVisible(true);
    setStarRating(0);
    setHoveredStar(0);
    prevLyricIndexRef.current = 0;
    elapsedRef.current = 0;
    // Re-trigger started to remount iframe
    setStarted(false);
    setTimeout(() => handlePlay(), 50);
  };

  const currentLyric = lyrics[lyricIndex];
  const nextLyric = lyrics[lyricIndex + 1] ?? null;

  return (
    <div className="flex flex-col bg-[#070707] min-h-screen lg:h-screen lg:overflow-hidden relative overflow-x-hidden">

      {/* Home button */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00E5FF] bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#00E5FF]/50 transition-all"
      >
        ← L&apos;OXYGÈNE
      </Link>

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

        {/* Left column */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 lg:overflow-hidden">

          {/* Video + lyric overlay wrapper */}
          <div className="lg:flex-1 lg:min-h-0 flex flex-col">

            {/* Video player */}
            <div className="relative rounded-t-xl overflow-hidden bg-black flex-shrink-0"
              style={{ aspectRatio: "16/9" }}>

              {/* YouTube iframe */}
              {started && !songEnded && (
                <iframe
                  key="yt-iframe"
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
                  title={`${SONG_TITLE} - ${ARTIST_NAME}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              )}

              {/* Thumbnail before play */}
              {!started && (
                <div className="absolute inset-0 bg-[#070707]"
                  style={{ backgroundImage: `url(https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }}>
                  <div className="absolute inset-0" style={{ background: "rgba(7,7,7,0.55)" }} />
                </div>
              )}

              {/* Song ended — dark overlay behind end screen */}
              {songEnded && (
                <div className="absolute inset-0 bg-[#070707]/95" />
              )}

              {/* Song info overlay — fades out after 3s */}
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

              {/* Play button overlay */}
              {!started && (
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 group"
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95"
                    style={{
                      background: "rgba(255,0,127,0.1)",
                      border: "2px solid rgba(255,0,127,0.5)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 0 30px rgba(255,0,127,0.3), inset 0 0 20px rgba(255,0,127,0.05)",
                    }}>
                    <Icon icon="solar:play-circle-linear" className="w-10 h-10 text-[#FF007F]" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,127,0.8))" }} />
                  </div>
                  <div className="px-4 py-2 rounded-full text-center"
                    style={{ background: "rgba(7,7,7,0.7)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                    <p className="text-white/90 text-sm font-semibold">▶ {SONG_TITLE} - {ARTIST_NAME}</p>
                    <p className="text-white/40 text-[11px] mt-0.5">(가라오케)</p>
                  </div>
                </button>
              )}

              {/* Song end screen */}
              {songEnded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6">
                  <p className="text-3xl">🎤</p>
                  <div className="text-center">
                    <p className="text-white font-black text-lg">수고하셨습니다!</p>
                    <p className="text-white/50 text-sm mt-1">{SONG_TITLE} - {ARTIST_NAME}</p>
                  </div>

                  {/* Star rating */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setStarRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Icon
                          icon={star <= (hoveredStar || starRating) ? "solar:star-bold" : "solar:star-linear"}
                          className="w-7 h-7"
                          style={{ color: star <= (hoveredStar || starRating) ? "#C9A84C" : "rgba(255,255,255,0.25)" }}
                        />
                      </button>
                    ))}
                  </div>
                  {starRating > 0 && (
                    <p className="text-white/40 text-xs -mt-2">
                      {["", "아쉬워요", "괜찮아요", "좋아요", "대박이에요!", "퍼펙트! 🎉"][starRating]}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-1">
                    <Link
                      href="/rooms/colosseum"
                      className="px-5 py-2.5 rounded-lg text-sm font-medium text-white/60 transition-all hover:text-white/90"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      다음 곡
                    </Link>
                    <button
                      onClick={handleRestart}
                      className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95"
                      style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", boxShadow: "0 0 12px rgba(0,229,255,0.2)" }}
                    >
                      다시 부르기
                    </button>
                  </div>
                </div>
              )}

              {/* Gradient overlay bottom of video */}
              {started && !songEnded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
                  style={{ background: "linear-gradient(to top, rgba(7,7,7,1), transparent)" }} />
              )}
            </div>

            {/* Lyrics bar — attached flush below video */}
            <div className="w-full px-6 py-4 rounded-b-xl flex flex-col items-center gap-1"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {!started ? (
                <p className="text-white/30 text-sm italic">재생 버튼을 눌러 시작하세요</p>
              ) : songEnded ? (
                <p className="text-white/30 text-sm italic">♪ 끝 ♪</p>
              ) : (
                <>
                  {/* Current lyric */}
                  <p
                    className="text-2xl font-bold text-center transition-opacity duration-300"
                    style={{
                      opacity: lyricVisible ? 1 : 0,
                      color: currentLyric.isInterlude ? "rgba(255,255,255,0.3)" : "#00E5FF",
                      fontStyle: currentLyric.isInterlude ? "italic" : "normal",
                      fontSize: currentLyric.isInterlude ? "1rem" : "1.5rem",
                      textShadow: currentLyric.isInterlude ? "none" : "0 0 16px rgba(0,229,255,0.5)",
                    }}
                  >
                    {currentLyric.text}
                  </p>

                  {/* Next lyric */}
                  {nextLyric && (
                    <p
                      className="text-sm text-center mt-1 transition-opacity duration-300"
                      style={{
                        opacity: lyricVisible ? 0.5 : 0,
                        color: "rgba(255,255,255,0.4)",
                        fontStyle: nextLyric.isInterlude ? "italic" : "normal",
                      }}
                    >
                      {nextLyric.text}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* PIP Grid */}
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <Icon icon="solar:users-group-two-rounded-bold" className="text-white/30 w-4 h-4" />
              <span className="text-white/30 text-xs">참여자</span>
            </div>
            <PIPGrid />
          </div>

          {/* Action bar — desktop only (in flow) */}
          <div className="hidden lg:block">
            <BottomActionBar />
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3 w-full lg:w-56 lg:flex-shrink-0 lg:overflow-y-auto hide-scrollbar">
          <Leaderboard />

          {showQueue && (
            <GlassCard className="p-4 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="solar:microphone-bold" className="text-[#00E5FF] w-4 h-4" />
                <h3 className="text-white font-bold text-sm tracking-wider">대기열</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(0,229,255,0.1)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}>
                  {MOCK_QUEUE.length}명
                </span>
              </div>
              <div className="space-y-2.5 overflow-y-auto">
                {MOCK_QUEUE.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                    style={{
                      background: entry.position === 1 ? "rgba(0,229,255,0.06)" : "rgba(255,255,255,0.02)",
                      border: entry.position === 1 ? "1px solid rgba(0,229,255,0.15)" : "1px solid rgba(255,255,255,0.03)",
                    }}>
                    <span className="text-xs font-black w-5 text-center flex-shrink-0 mt-0.5"
                      style={{ color: entry.position === 1 ? "#00E5FF" : "rgba(255,255,255,0.3)" }}>
                      {entry.position}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white/80 text-xs font-semibold truncate">{entry.nickname}</p>
                      <p className="text-white/40 text-[11px] truncate mt-0.5">{entry.songTitle}</p>
                    </div>
                    {entry.position === 1 && (
                      <Icon icon="solar:microphone-bold" className="text-[#00E5FF] w-3.5 h-3.5 flex-shrink-0 mt-0.5 animate-neon-pulse" />
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
