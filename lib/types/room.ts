export type RoomTag = string;

export interface RoomUser {
  id: string;
  nickname: string;
  avatarUrl?: string;
  bouquets: number;
  isSpeaking?: boolean;
  isHost?: boolean;
  isSinging?: boolean;
}

export interface Room {
  id: string;
  title: string;
  hostName: string;
  singerCount: number;
  viewerCount: number;
  topGiftAmount: number;
  tags: RoomTag[];
  isPasswordProtected: boolean;
  maxParticipants: number;
  currentSong?: string;
  currentSinger?: string;
}

export interface QueueEntry {
  userId: string;
  nickname: string;
  songTitle: string;
  position: number;
}

export interface LyricWord {
  word: string;
  startTime: number;
  endTime: number;
}

export interface LyricLine {
  line: string;
  words: LyricWord[];
  startTime: number;
}

export type GiftType = "bouquet" | "champagne" | "crown";

export interface Gift {
  id: string;
  type: GiftType;
  fromUser: string;
  toUser: string;
  timestamp: number;
}
