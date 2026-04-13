"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageType = "chat" | "gift_bouquet" | "gift_champagne" | "system";

export interface ChatMessage {
  id: string;
  roomId: string;
  type: MessageType;
  nickname: string;
  text: string;
  timestamp: string; // ISO string
  userId?: string;
}

export interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  sendMessage: (
    roomId: string,
    text: string,
    type?: MessageType,
    nickname?: string
  ) => Promise<void>;
  subscribeToChat: (roomId: string) => void;
  unsubscribeFromChat: () => void;
  isConnected: boolean;
}

// ── Mock fallback store (used when Supabase is not configured) ─────────────────

const MOCK_SEED: ChatMessage[] = [
  { id: "m0", roomId: "room-001", type: "system",       nickname: "system",  text: "방에 입장했습니다 🎤",       timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: "m1", roomId: "room-001", type: "chat",         nickname: "김민준",  text: "안녕하세요~~",               timestamp: new Date(Date.now() - 90000).toISOString()  },
  { id: "m2", roomId: "room-001", type: "chat",         nickname: "이지현",  text: "오늘 노래 기대돼요!",         timestamp: new Date(Date.now() - 60000).toISOString()  },
  { id: "m3", roomId: "room-001", type: "gift_bouquet", nickname: "박서준",  text: "박서준님이 꽃다발을 선물했습니다! 🌸", timestamp: new Date(Date.now() - 30000).toISOString() },
];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRealtimeChat(
  initialRoomId?: string
): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_SEED);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string>(initialRoomId ?? "");

  const addMessage = (msg: ChatMessage) =>
    setMessages(prev => [...prev, msg]);

  // ── Subscribe ────────────────────────────────────────────────────────────
  const subscribeToChat = useCallback((roomId: string) => {
    roomIdRef.current = roomId;

    if (!isSupabaseConfigured) {
      // Mock mode: already seeded, just mark as "connected"
      setIsConnected(true);
      return;
    }

    // Unsubscribe from any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const msg: ChatMessage = {
            id: String(row.id ?? Date.now()),
            roomId: String(row.room_id ?? roomId),
            type: (row.type as MessageType) ?? "chat",
            nickname: String(row.nickname ?? ""),
            text: String(row.text ?? ""),
            timestamp: String(row.created_at ?? new Date().toISOString()),
            userId: row.user_id ? String(row.user_id) : undefined,
          };
          addMessage(msg);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
  }, []);

  // ── Unsubscribe ──────────────────────────────────────────────────────────
  const unsubscribeFromChat = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (
      roomId: string,
      text: string,
      type: MessageType = "chat",
      nickname = "나"
    ) => {
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        roomId,
        type,
        nickname,
        text,
        timestamp: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        // Mock mode: add locally
        addMessage(optimistic);
        return;
      }

      // Optimistic insert
      addMessage(optimistic);

      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        type,
        nickname,
        text,
        created_at: optimistic.timestamp,
      });

      if (error) {
        console.error("[useRealtimeChat] sendMessage error:", error.message);
      }
    },
    []
  );

  // ── Auto-subscribe if initialRoomId provided ──────────────────────────────
  useEffect(() => {
    if (initialRoomId) subscribeToChat(initialRoomId);
    return () => unsubscribeFromChat();
  }, [initialRoomId, subscribeToChat, unsubscribeFromChat]);

  return {
    messages,
    sendMessage,
    subscribeToChat,
    unsubscribeFromChat,
    isConnected,
  };
}
