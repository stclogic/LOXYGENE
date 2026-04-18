import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nickname: string;
      role: string;
      coins: number;
      avatar_url?: string;
    } & DefaultSession["user"];
  }

  interface User {
    nickname?: string;
    role?: string;
    coins?: number;
    avatar_url?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    nickname?: string;
    role?: string;
    coins?: number;
    avatar_url?: string;
  }
}
