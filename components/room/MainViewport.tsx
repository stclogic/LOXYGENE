"use client";

import { Icon } from "@iconify/react";

interface MainViewportProps {
  singerName: string;
  songTitle: string;
  artistName: string;
}

export function MainViewport({ singerName, songTitle, artistName }: MainViewportProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
      {/* Mock video background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#070710] to-[#0d0a14]">
        {/* Animated glow effects */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,229,255,0.3) 0%, transparent 70%)",
              filter: "blur(40px)",
              animation: "float-blob 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,0,127,0.3) 0%, transparent 70%)",
              filter: "blur(40px)",
              animation: "float-blob 8s ease-in-out infinite reverse",
            }}
          />
        </div>

        {/* Center singer placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,229,255,0.1)",
                border: "2px solid rgba(0,229,255,0.4)",
                boxShadow: "0 0 30px rgba(0,229,255,0.3)",
              }}
            >
              <Icon icon="solar:user-bold" className="text-[#00E5FF] w-12 h-12" />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm">현재 노래 중</p>
              <p
                className="text-white font-bold text-xl"
                style={{ textShadow: "0 0 20px rgba(0,229,255,0.5)" }}
              >
                {singerName}
              </p>
            </div>
          </div>
        </div>

        {/* LIVE badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-red-600/80 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold tracking-widest">LIVE</span>
          </div>
        </div>

        {/* View count */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <Icon icon="solar:eye-bold" className="text-white/60 w-4 h-4" />
          <span className="text-white/70 text-sm">1,247</span>
        </div>
      </div>

      {/* Song info overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4"
        style={{ background: "linear-gradient(to top, rgba(7,7,7,0.95), transparent)" }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[#00E5FF] text-xs font-semibold tracking-widest uppercase mb-1">
              Now Playing
            </p>
            <h2
              className="text-white font-bold text-2xl leading-tight"
              style={{ textShadow: "0 0 20px rgba(0,229,255,0.4)" }}
            >
              {songTitle}
            </h2>
            <p className="text-white/60 text-sm mt-0.5">{artistName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:music-note-bold" className="text-[#00E5FF] w-5 h-5 animate-neon-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
