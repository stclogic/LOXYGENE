// Browser-only helpers — safe to call from "use client" components.
// All reads fall back gracefully when localStorage is unavailable (e.g. SSR).

const PREFIX = "loxygene-";

function ls(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getUserId(): string {
  const store = ls();
  if (!store) return "user-ssr";
  let userId = store.getItem(`${PREFIX}user-id`);
  if (!userId) {
    userId = "user-" + Math.random().toString(36).substr(2, 9);
    store.setItem(`${PREFIX}user-id`, userId);
  }
  return userId;
}

export function getUserNickname(): string {
  const store = ls();
  if (!store) return "게스트";
  return (
    store.getItem(`${PREFIX}nickname`) ||
    "게스트_" + Math.random().toString(36).substr(2, 4).toUpperCase()
  );
}

export function setUserNickname(nickname: string): void {
  ls()?.setItem(`${PREFIX}nickname`, nickname);
}

export function hasNickname(): boolean {
  const store = ls();
  if (!store) return false;
  return store.getItem(`${PREFIX}nickname`) !== null;
}

export function getUserMembership(): "free" | "vip" | "black" {
  const store = ls();
  if (!store) return "free";
  return (store.getItem(`${PREFIX}membership`) as "free" | "vip" | "black") || "free";
}

export function setUserMembership(tier: "free" | "vip" | "black"): void {
  ls()?.setItem(`${PREFIX}membership`, tier);
}

/** Suggest a random Korean-style nickname */
export function randomNickname(): string {
  const adj = ["별빛", "달빛", "봄날", "가을", "여름", "노래", "하늘", "바람", "꿈속", "새벽"];
  const noun = ["가수", "왕자", "소나타", "선율", "별", "꿈", "바람", "여행자", "목소리", "무대"];
  return adj[Math.floor(Math.random() * adj.length)] + noun[Math.floor(Math.random() * noun.length)];
}
