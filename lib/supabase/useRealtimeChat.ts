"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getUserId, getUserNickname } from "@/lib/utils/userSession";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageType = "chat" | "gift_bouquet" | "gift_champagne" | "system";

export interface ChatMessage {
  id: string;
  roomId: string;
  type: MessageType;
  nickname: string;
  text: string;
  timestamp: string;
  userId?: string;
}

export interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string, type?: MessageType) => Promise<void>;
  addExternalMessage: (text: string, nickname: string, type?: MessageType) => void;
  subscribeToChat: (roomId: string) => void;
  unsubscribeFromChat: () => void;
  isConnected: boolean;
}

// ── Hook — Supabase Broadcast 방식 (DB publication 불필요) ────────────────────

export function useRealtimeChat(
  initialRoomId?: string
): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string>(initialRoomId ?? "");

  const addMessage = useCallback((msg: ChatMessage) =>
    setMessages(prev => [...prev, msg]), []);

  // ── Subscribe via Broadcast ──────────────────────────────────────────────
  const subscribeToChat = useCallback((roomId: string) => {
    roomIdRef.current = roomId;

    // 기존 채널 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (!isSupabaseConfigured) {
      setIsConnected(true);
      return;
    }

    const channel = supabase
      .channel(`broadcast:chat:${roomId}`)
      .on(
        "broadcast",
        { event: "message" },
        ({ payload }) => {
          if (payload && payload.id) addMessage(payload as ChatMessage);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
  }, [addMessage]);

  // ── Unsubscribe ──────────────────────────────────────────────────────────
  const unsubscribeFromChat = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // ── Send via Broadcast + optional DB persist ─────────────────────────────
  const sendMessage = useCallback(
    async (content: string, type: MessageType = "chat") => {
      const roomId = roomIdRef.current;
      const nickname = getUserNickname();
      const userId = getUserId();

      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        roomId,
        type,
        nickname,
        text: content,
        timestamp: new Date().toISOString(),
        userId,
      };

      // Optimistic local add
      addMessage(msg);

      // Broadcast to all subscribers (real-time)
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "message",
          payload: msg,
        });
      }

      // Optional: persist to DB (fire-and-forget)
      if (isSupabaseConfigured) {
        void supabase.from("messages").insert({
          room_id: roomId,
          user_id: userId,
          nickname,
          content,
          type,
        });
      }
    },
    [addMessage]
  );

  // ── Auto-subscribe ───────────────────────────────────────────────────────
  useEffect(() => {
    if (initialRoomId) subscribeToChat(initialRoomId);
    return () => unsubscribeFromChat();
  }, [initialRoomId, subscribeToChat, unsubscribeFromChat]);

  // 외부(Daily app-message)에서 수신한 메시지를 발신자 닉네임으로 직접 추가
  const addExternalMessage = useCallback((text: string, nickname: string, type: MessageType = "chat") => {
    addMessage({
      id: `ext-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      roomId: roomIdRef.current,
      type,
      nickname,
      text,
      timestamp: new Date().toISOString(),
    });
  }, [addMessage]);

  return { messages, sendMessage, addExternalMessage, subscribeToChat, unsubscribeFromChat, isConnected };
}
