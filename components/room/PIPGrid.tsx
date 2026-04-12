"use client";

import { Icon } from "@iconify/react";

const MOCK_PARTICIPANTS = [
  { id: "1", nickname: "별빛가수", isSpeaking: true, isSinging: true },
  { id: "2", nickname: "노래왕자", isSpeaking: false, isSinging: false },
  { id: "3", nickname: "달빛선율", isSpeaking: true, isSinging: false },
  { id: "4", nickname: "가을바람", isSpeaking: false, isSinging: false },
  { id: "5", nickname: "봄날의꿈", isSpeaking: false, isSinging: false },
  { id: "6", nickname: "여름밤", isSpeaking: false, isSinging: false },
];

export function PIPGrid() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {MOCK_PARTICIPANTS.map((user) => (
        <div key={user.id} className="flex-shrink-0 flex flex-col items-center gap-1.5">
          <div
            className="relative w-20 h-20 rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0d0d1a, #0a0a14)",
              border: user.isSpeaking
                ? "2px solid #00E5FF"
                : "2px solid rgba(255,255,255,0.05)",
              boxShadow: user.isSpeaking
                ? "0 0 12px rgba(0,229,255,0.5), 0 0 24px rgba(0,229,255,0.2)"
                : "none",
              transition: "all 0.3s ease",
            }}
          >
            {/* Video placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon
                icon="solar:user-bold"
                className="w-8 h-8"
                style={{ color: user.isSpeaking ? "#00E5FF" : "rgba(255,255,255,0.3)" }}
              />
            </div>

            {/* Singing indicator */}
            {user.isSinging && (
              <div className="absolute top-1 right-1">
                <Icon
                  icon="solar:microphone-bold"
                  className="w-3.5 h-3.5 text-[#FF007F]"
                  style={{ filter: "drop-shadow(0 0 4px rgba(255,0,127,0.8))" }}
                />
              </div>
            )}

            {/* Speaking wave animation */}
            {user.isSpeaking && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5">
                {[3, 5, 3, 6, 4].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-[#00E5FF]"
                    style={{
                      height: `${h}px`,
                      animation: `pulse-neon ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <span className="text-white/60 text-xs truncate max-w-[80px] text-center">
            {user.nickname}
          </span>
        </div>
      ))}
    </div>
  );
}
