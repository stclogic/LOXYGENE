// Next.js route-level loading UI for /rooms/colosseum/*

export default function ColosseumLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070707] gap-8">
      {/* Logo */}
      <p
        className="text-[#00E5FF] font-black text-2xl tracking-[0.4em] uppercase"
        style={{ textShadow: "0 0 20px rgba(0,229,255,0.5)" }}
      >
        L&apos;OXYGÈNE
      </p>

      {/* Pulse rings */}
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ border: "2px solid rgba(0,229,255,0.4)", animationDuration: "1.2s" }}
        />
        <div
          className="absolute inset-2 rounded-full animate-ping"
          style={{ border: "1px solid rgba(0,229,255,0.2)", animationDuration: "1.8s", animationDelay: "0.4s" }}
        />
      </div>

      <p className="text-white/50 text-sm">방 목록을 불러오는 중...</p>

      {/* Scan line */}
      <div
        className="w-40 h-px rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="h-full w-1/2"
          style={{
            background: "linear-gradient(to right, transparent, #00E5FF, transparent)",
            animation: "sl 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes sl { 0%,100%{transform:translateX(-100%)} 50%{transform:translateX(200%)} }
      `}</style>
    </div>
  );
}
