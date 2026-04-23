"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { PartyRoomShell } from "@/components/room/PartyRoomShell";
import { useDailyCall } from "@/hooks/useDailyCall";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { hasNickname, setUserNickname, randomNickname, getUserNickname } from "@/lib/utils/userSession";

const ACCENT = "#D4AF37";

const MOCK_VIP_GUESTS = [
  { id: "v1", nickname: "호스트", isHost: true,  isMuted: false },
  { id: "v2", nickname: "VIP 1",  isHost: false, isMuted: false },
  { id: "v3", nickname: "VIP 2",  isHost: false, isMuted: true  },
];

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? (url.match(/^[a-zA-Z0-9_-]{11}$/) ? url : null);
}

function KaraokePanelContent({
  onVideoChange,
  onLyricsChange,
}: {
  onVideoChange: (id: string | null) => void;
  onLyricsChange: (lines: string[]) => void;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [lyricsText, setLyricsText] = useState("");
  const [lyricsMode, setLyricsMode] = useState<"view" | "edit">("view");

  const handleLoad = () => {
    const id = extractYouTubeId(urlInput.trim());
    if (id) { setActiveId(id); onVideoChange(id); setError(false); }
    else setError(true);
  };
  const handleClear = () => {
    setActiveId(null); setUrlInput(""); setError(false); onVideoChange(null);
  };
  const handleLyricsChange = (text: string) => {
    setLyricsText(text);
    onLyricsChange(text.split("\n").filter(l => l.trim()));
  };
  const lyricsLines = lyricsText.split("\n").filter(l => l.trim());

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-[10px] tracking-widest font-medium mb-2" style={{ color: "rgba(212,175,55,0.5)" }}>유튜브 영상</p>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setError(false); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleLoad(); }}
            placeholder="YouTube URL 또는 영상 ID"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20"
            style={{ background: "rgba(212,175,55,0.04)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(212,175,55,0.18)"}` }}
          />
          {activeId ? (
            <button type="button" onClick={handleClear} className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>중지</button>
          ) : (
            <button type="button" onClick={handleLoad} className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", color: ACCENT }}>재생</button>
          )}
        </div>
        {error && <p className="text-[10px] text-red-400 mt-1">올바른 YouTube URL을 입력해주세요.</p>}
        {activeId && (
          <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg"
            style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse block flex-shrink-0" style={{ background: ACCENT }} />
            <span className="text-[10px] truncate" style={{ color: ACCENT }}>재생 중 · 무대 화면을 확인하세요</span>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] tracking-widest font-medium" style={{ color: "rgba(212,175,55,0.5)" }}>가사</p>
          <button type="button" onClick={() => setLyricsMode(m => m === "edit" ? "view" : "edit")}
            className="text-[10px] px-2 py-0.5 rounded transition-all"
            style={{ background: lyricsMode === "edit" ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${lyricsMode === "edit" ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.1)"}`, color: lyricsMode === "edit" ? ACCENT : "rgba(255,255,255,0.4)" }}>
            {lyricsMode === "edit" ? "완료" : "가사 입력"}
          </button>
        </div>
        {lyricsMode === "edit" ? (
          <textarea value={lyricsText} onChange={e => handleLyricsChange(e.target.value)}
            placeholder={"가사를 붙여넣거나 직접 입력하세요.\n한 줄씩 입력하면 화면에 표시됩니다."}
            rows={8} className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none placeholder-white/20 resize-none"
            style={{ background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.2)", lineHeight: 1.7 }} />
        ) : lyricsLines.length > 0 ? (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {lyricsLines.map((line, i) => (
              <p key={i} className="text-sm leading-relaxed px-1" style={{ color: "rgba(255,255,255,0.75)" }}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-xs px-1" style={{ color: "rgba(255,255,255,0.2)" }}>가사 입력 버튼을 눌러 가사를 추가하면 무대 하단에 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}

function generateOTP() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part(4)}-${part(4)}`;
}

function VIPPanelContent({
  otp,
  onRegenerateOtp,
}: {
  otp: string;
  onRegenerateOtp: () => void;
}) {
  const [otpCopied, setOtpCopied] = useState(false);

  const copyOtp = () => {
    navigator.clipboard.writeText(otp).catch(() => {});
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Access code */}
      <div>
        <p className="text-[10px] tracking-widest font-medium mb-2" style={{ color: "rgba(212,175,55,0.45)" }}>
          현재 입장 코드
        </p>
        <div className="flex flex-col gap-2 p-3 rounded-xl"
          style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.18)" }}>
          <span className="font-mono text-lg font-bold tracking-[0.3em]" style={{ color: ACCENT }}>{otp}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRegenerateOtp}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "rgba(212,175,55,0.7)" }}
            >
              코드 갱신
            </button>
            <button
              type="button"
              onClick={copyOtp}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
              style={{
                background: otpCopied ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.15)",
                color: otpCopied ? ACCENT : "rgba(212,175,55,0.5)",
              }}
            >
              {otpCopied ? "복사됨 ✓" : "복사"}
            </button>
          </div>
        </div>
      </div>

      {/* VIP guest list */}
      <div>
        <p className="text-[10px] tracking-widest font-medium mb-2" style={{ color: "rgba(212,175,55,0.45)" }}>
          VIP 게스트 ({MOCK_VIP_GUESTS.length})
        </p>
        <div className="flex flex-col gap-1.5">
          {MOCK_VIP_GUESTS.map(g => (
            <div
              key={g.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl"
              style={{
                background: g.isHost ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                border: g.isHost ? "1px solid rgba(212,175,55,0.18)" : "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span className="text-lg">{g.isHost ? "👑" : "👤"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-semibold truncate">{g.nickname}</p>
                <p className="text-[10px]" style={{ color: "rgba(212,175,55,0.5)" }}>
                  {g.isHost ? "호스트" : "VIP 게스트"}
                </p>
              </div>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: g.isMuted ? "rgba(239,68,68,0.8)" : "rgba(212,175,55,0.8)" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Revenue widget */}
      <div className="rounded-xl p-3"
        style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)" }}>
        <p className="text-[10px] tracking-widest mb-1" style={{ color: "rgba(212,175,55,0.4)" }}>오늘 수익</p>
        <p className="font-black text-base" style={{ color: ACCENT }}>2,450,000 O₂</p>
      </div>
    </div>
  );
}

export default function BlackRoomPage({ params }: { params: { roomId: string } }) {
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [currentNickname, setCurrentNickname] = useState("VIP 게스트");
  const [dailyToken, setDailyToken] = useState("");
  const [dailyRoomUrl, setDailyRoomUrl] = useState("");
  const [role, setRole] = useState<string>("participant");
  const [otp, setOtp] = useState("7X9K-M2PQ");
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [karaokeVideoId, setKaraokeVideoId] = useState<string | null>(null);
  const [karaokeLyrics, setKaraokeLyrics] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = useIsAdmin();
  const { participants: dailyParticipants, toggleMic, toggleCamera } = useDailyCall(dailyRoomUrl, dailyToken);

  useEffect(() => {
    if (!hasNickname()) {
      setNicknameModalOpen(true);
    } else {
      setCurrentNickname(getUserNickname());
    }
  }, []);

  useEffect(() => {
    fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: params.roomId }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return;
        if (data.dailyToken) setDailyToken(data.dailyToken);
        if (data.dailyRoomUrl) setDailyRoomUrl(data.dailyRoomUrl);
        if (data.role) setRole(data.role);
      })
      .catch(console.error);
  }, [params.roomId]);

  useEffect(() => {
    if (nicknameModalOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [nicknameModalOpen]);

  const handleNicknameSubmit = () => {
    const name = nicknameInput.trim();
    if (!name) return;
    setUserNickname(name);
    setCurrentNickname(name);
    setNicknameModalOpen(false);
  };

  return (
    <>
      <PartyRoomShell
        roomName="L'OXYGÈNE BLACK"
        roomSubtitle={`룸 ${params.roomId}`}
        backHref="/rooms/black"
        accentColor={ACCENT}
        participantCount={Object.keys(dailyParticipants).length || 8}
        panelTitle="🎤 노래방"
        panelContent={
          <KaraokePanelContent
            onVideoChange={id => setKaraokeVideoId(id)}
            onLyricsChange={lines => setKaraokeLyrics(lines)}
          />
        }
        karaokeVideoId={karaokeVideoId ?? undefined}
        karaokeLyrics={karaokeLyrics}
        dailyParticipants={dailyParticipants}
        roomId={params.roomId}
        nickname={currentNickname}
        isSuperAdmin={isSuperAdmin}
        role={role}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
      />

      {/* VIP 컨트롤 버튼 */}
      <button
        type="button"
        onClick={() => setVipModalOpen(true)}
        className="fixed top-16 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", backdropFilter: "blur(12px)" }}
      >
        <span className="text-sm">👑</span>
        <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(212,175,55,0.7)" }}>VIP 컨트롤</span>
      </button>

      {/* VIP 컨트롤 모달 */}
      {vipModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={e => { if (e.target === e.currentTarget) setVipModalOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "rgba(4,3,2,0.99)", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 0 60px rgba(212,175,55,0.08)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
              <span className="text-sm font-bold tracking-widest" style={{ color: ACCENT }}>👑 VIP 컨트롤</span>
              <button type="button" title="닫기" onClick={() => setVipModalOpen(false)} className="text-white/30 hover:text-white/60">
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>
            <VIPPanelContent otp={otp} onRegenerateOtp={() => setOtp(generateOTP())} />
          </div>
        </div>
      )}

      {/* Nickname modal */}
      {nicknameModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: "rgba(4,3,2,0.99)", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 0 40px rgba(212,175,55,0.06)" }}
          >
            <div className="text-center">
              <span className="text-3xl">👑</span>
              <h2 className="text-white font-black text-lg mt-2">VIP 입장을 환영합니다</h2>
              <p className="text-white/35 text-sm mt-1">룸에서 사용할 닉네임을 입력해주세요</p>
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleNicknameSubmit(); }}
                placeholder="예: 블랙VIP"
                maxLength={20}
                className="w-full bg-white/5 text-white text-sm px-4 py-3 rounded-xl outline-none placeholder-white/20"
                style={{ border: "1px solid rgba(212,175,55,0.3)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)")}
              />
              <button
                type="button"
                onClick={() => setNicknameInput(randomNickname())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none hover:scale-110 transition-transform"
                title="랜덤 닉네임"
              >
                🎲
              </button>
            </div>
            <button
              type="button"
              onClick={handleNicknameSubmit}
              disabled={!nicknameInput.trim()}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: ACCENT }}
            >
              입장하기 👑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
