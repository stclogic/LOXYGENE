"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  time: string;
  isOwn: boolean;
}

const SEED_MESSAGES: ChatMessage[] = [
  { id: "s1", name: "별빛가수",  text: "와 오늘 분위기 최고다!",     time: "21:04", isOwn: false },
  { id: "s2", name: "달빛연인",  text: "🎵 노래 신청합니다~",        time: "21:05", isOwn: false },
  { id: "s3", name: "구름위",    text: "파티 너무 좋아요 💙",        time: "21:06", isOwn: false },
];

export function useRoomChat(roomId: string, nickname: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    // Realtime is optional — if Supabase not configured, chat still works locally
    if (!url || !key) return;

    const supabase = createClient(url, key);
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on("broadcast", { event: "msg" }, ({ payload }) => {
        setMessages(prev => [
          ...prev,
          {
            id:    payload.id   as string,
            name:  payload.name as string,
            text:  payload.text as string,
            time:  payload.time as string,
            isOwn: (payload.name as string) === nickname,
          },
        ]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const msg: ChatMessage = {
      id:    `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name:  nickname,
      text:  trimmed,
      time:  new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
    };

    // Optimistic local update — always instant regardless of Supabase
    setMessages(prev => [...prev, msg]);

    // Broadcast to other participants if channel is live
    try {
      await channelRef.current?.send({
        type:    "broadcast",
        event:   "msg",
        payload: { id: msg.id, name: msg.name, text: msg.text, time: msg.time },
      });
    } catch { /* non-blocking */ }
  };

  return { messages, sendMessage };
}
