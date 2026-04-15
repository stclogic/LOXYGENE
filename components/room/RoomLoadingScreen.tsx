// Static loading screen — no browser APIs, safe for SSR.

export default function RoomLoadingScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-[#070707] gap-8"
      style={{ background: "#070707" }}
    >
      {/* Logo */}
      <div className="text-center">
        <p
          className="text-[#00E5FF] font-black text-2xl tracking-[0.4em] uppercase"
          style={{ textShadow: "0 0 20px rgba(0,229,255,0.5)" }}
        >
          L&apos;OXYGÈNE
        </p>
      </div>

      {/* Pulse rings */}
      <div className="relative w-20 h-20">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: "2px solid rgba(0,229,255,0.4)",
            animationDuration: "1.2s",
          }}
        />
        <div
          className="absolute inset-2 rounded-full animate-ping"
          style={{
            border: "1px solid rgba(0,229,255,0.2)",
            animationDuration: "1.6s",
            animationDelay: "0.3s",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,229,255,0.3) 0%, transparent 70%)",
            }}
          />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-white/70 text-sm font-medium">룸에 연결 중...</p>
        <p className="text-white/25 text-xs mt-1">잠시만 기다려주세요</p>
      </div>

      {/* Scan line */}
      <div
        className="w-48 h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="h-full w-1/2 rounded-full"
          style={{
            background: "linear-gradient(to right, transparent, #00E5FF, transparent)",
            animation: "scan-line 1.5s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes scan-line {
          0%, 100% { transform: translateX(-100%); }
          50%       { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
