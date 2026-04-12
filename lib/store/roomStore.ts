import { create } from "zustand";
import type { Room, RoomUser, QueueEntry, Gift } from "@/lib/types/room";

interface RoomState {
  currentRoom: Room | null;
  users: RoomUser[];
  queue: QueueEntry[];
  gifts: Gift[];
  isMicOn: boolean;
  isCameraOn: boolean;
  currentLyricIndex: number;
  isInQueue: boolean;
  queuePosition: number | null;

  setCurrentRoom: (room: Room | null) => void;
  setUsers: (users: RoomUser[]) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  joinQueue: () => void;
  leaveQueue: () => void;
  setCurrentLyricIndex: (index: number) => void;
  sendGift: (gift: Omit<Gift, "id" | "timestamp">) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  users: [],
  queue: [],
  gifts: [],
  isMicOn: false,
  isCameraOn: false,
  currentLyricIndex: 0,
  isInQueue: false,
  queuePosition: null,

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setUsers: (users) => set({ users }),
  toggleMic: () => set((s) => ({ isMicOn: !s.isMicOn })),
  toggleCamera: () => set((s) => ({ isCameraOn: !s.isCameraOn })),
  joinQueue: () =>
    set((s) => ({
      isInQueue: true,
      queuePosition: s.queue.length + 1,
    })),
  leaveQueue: () => set({ isInQueue: false, queuePosition: null }),
  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
  sendGift: (gift) =>
    set((s) => ({
      gifts: [
        ...s.gifts,
        { ...gift, id: Math.random().toString(36).slice(2), timestamp: Date.now() },
      ],
    })),
}));
