"use client";

import { Icon } from "@iconify/react";
import { GlassCard } from "@/components/ui/GlassCard";

const TOP_USERS = [
  { rank: 1, nickname: "별빛가수", bouquets: 1240, crown: true },
  { rank: 2, nickname: "노래왕자", bouquets: 870 },
  { rank: 3, nickname: "달빛선율", bouquets: 650 },
];

const rankColors: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

export function Leaderboard() {
  return (
    <GlassCard className="p-4 w-56">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="solar:crown-bold" className="text-[#FF007F] w-5 h-5" />
        <h3 className="text-white font-bold text-sm tracking-wider">명예의 전당</h3>
      </div>
      <div className="space-y-3">
        {TOP_USERS.map((user) => (
          <div key={user.rank} className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{
                background: `rgba(${user.rank === 1 ? "255,215,0" : user.rank === 2 ? "192,192,192" : "205,127,50"},0.15)`,
                border: `1px solid ${rankColors[user.rank]}40`,
                color: rankColors[user.rank],
              }}
            >
              {user.rank}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {user.crown && (
                  <Icon
                    icon="solar:crown-bold"
                    className="text-yellow-400 w-3.5 h-3.5 flex-shrink-0"
                    style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.8))" }}
                  />
                )}
                <span className="text-white text-sm font-medium truncate">{user.nickname}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Icon icon="solar:flower-bold" className="text-[#FF007F] w-3.5 h-3.5" />
              <span className="text-[#FF007F] text-xs font-bold">{user.bouquets.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-white/30 text-xs text-center">꽃다발을 보내 순위를 올리세요!</p>
      </div>
    </GlassCard>
  );
}
