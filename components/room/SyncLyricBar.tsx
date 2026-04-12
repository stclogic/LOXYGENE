"use client";

import { useEffect, useState } from "react";

const MOCK_LYRICS = [
  { words: ["사랑해", "그대를", "이 세상", "끝까지"], currentWord: 0 },
  { words: ["함께라면", "두렵지", "않아", "어디든"], currentWord: 0 },
  { words: ["그대", "손을", "잡고", "걸어가고", "싶어"], currentWord: 0 },
  { words: ["영원히", "함께해", "줄래요", "나와"], currentWord: 0 },
];

export function SyncLyricBar() {
  const [lineIndex, setLineIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const wordTimer = setInterval(() => {
      setWordIndex((prev) => {
        const currentLine = MOCK_LYRICS[lineIndex];
        if (prev >= currentLine.words.length - 1) {
          setLineIndex((l) => (l + 1) % MOCK_LYRICS.length);
          return 0;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(wordTimer);
  }, [lineIndex]);

  const currentLine = MOCK_LYRICS[lineIndex];

  return (
    <div
      className="w-full py-3 px-6 flex items-center justify-center gap-3 rounded-xl"
      style={{
        background: "rgba(0,229,255,0.03)",
        border: "1px solid rgba(0,229,255,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {currentLine.words.map((word, i) => (
          <span
            key={i}
            className="text-lg font-semibold transition-all duration-300"
            style={
              i === wordIndex
                ? {
                    color: "#00E5FF",
                    textShadow: "0 0 12px #00E5FF, 0 0 24px rgba(0,229,255,0.5)",
                    transform: "scale(1.1)",
                    display: "inline-block",
                  }
                : i < wordIndex
                ? { color: "rgba(255,255,255,0.35)" }
                : { color: "rgba(255,255,255,0.65)" }
            }
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
