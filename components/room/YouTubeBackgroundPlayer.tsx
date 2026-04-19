"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

// ── Minimal YT IFrame API types ──────────────────────────────────────────────
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(vol: number): void;
  unMute(): void;
  mute(): void;
  destroy(): void;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
    onStateChange?: (e: { data: number; target: YTPlayer }) => void;
  };
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
  PlayerState: { ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ── Module-level singleton so multiple mounts don't re-inject the script ────
const readyCallbacks: Array<() => void> = [];
let apiLoaded = false;

function ensureYTApi(onReady: () => void) {
  if (apiLoaded && window.YT?.Player) {
    onReady();
    return;
  }
  readyCallbacks.push(onReady);
  if (document.getElementById("yt-iframe-api")) return;
  const script = document.createElement("script");
  script.id = "yt-iframe-api";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
  window.onYouTubeIframeAPIReady = () => {
    apiLoaded = true;
    readyCallbacks.splice(0).forEach(cb => cb());
  };
}

// ── Component ────────────────────────────────────────────────────────────────
interface Props {
  videoId: string;
  /** Max volume (0–100) the player fades up to. Default: 40 */
  maxVolume?: number;
}

export function YouTubeBackgroundPlayer({ videoId, maxVolume = 40 }: Props) {
  const [bgmOn, setBgmOn] = useState(true);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let destroyed = false;

    const initPlayer = () => {
      if (destroyed || !containerRef.current || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: videoId, // required for loop=1 to work
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: ({ target }) => {
            if (destroyed) return;
            setReady(true);
            target.playVideo();

            // Fade in from muted → maxVolume over ~1s
            let vol = 0;
            fadeTimer.current = setInterval(() => {
              vol = Math.min(vol + 4, maxVolume);
              target.setVolume(vol);
              if (vol >= maxVolume) {
                target.unMute();
                clearInterval(fadeTimer.current!);
                fadeTimer.current = null;
              }
            }, 80);
          },
          onStateChange: ({ data, target }) => {
            // Fallback loop: replay if player somehow ends (belt + suspenders)
            if (data === window.YT!.PlayerState.ENDED) {
              target.playVideo();
            }
          },
        },
      });
    };

    ensureYTApi(initPlayer);

    return () => {
      destroyed = true;
      if (fadeTimer.current) clearInterval(fadeTimer.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (bgmOn) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
    setBgmOn(v => !v);
  };

  return (
    <>
      {/* Hidden player — rendered off-screen, 1×1 px */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* BGM toggle pill */}
      <button
        type="button"
        onClick={toggle}
        aria-label={bgmOn ? "BGM 끄기" : "BGM 켜기"}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
        style={{
          background: bgmOn
            ? "rgba(0,229,255,0.1)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${bgmOn ? "rgba(0,229,255,0.3)" : "rgba(255,255,255,0.1)"}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <Icon
          icon={bgmOn ? "solar:music-note-2-bold" : "solar:music-note-slash-bold"}
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: bgmOn ? "#00E5FF" : "rgba(255,255,255,0.3)" }}
        />
        <span
          className="text-[10px] font-semibold tracking-wider"
          style={{ color: bgmOn ? "#00E5FF" : "rgba(255,255,255,0.3)" }}
        >
          BGM
        </span>

        {/* Animated equaliser bars when playing + ready */}
        {bgmOn && ready && (
          <>
            <style>{`
              @keyframes bgmBarA { 0%,100%{height:30%} 50%{height:90%} }
              @keyframes bgmBarB { 0%,100%{height:70%} 50%{height:30%} }
              @keyframes bgmBarC { 0%,100%{height:50%} 50%{height:100%} }
            `}</style>
            <span className="flex gap-px items-end h-3 flex-shrink-0" aria-hidden>
              {(["bgmBarA","bgmBarB","bgmBarC"] as const).map((anim, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{
                    background: "#00E5FF",
                    animation: `${anim} ${0.5 + i * 0.15}s ease-in-out infinite`,
                    alignSelf: "flex-end",
                    minHeight: "20%",
                  }}
                />
              ))}
            </span>
          </>
        )}
      </button>
    </>
  );
}
