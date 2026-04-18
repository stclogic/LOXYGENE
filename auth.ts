/**
 * NextAuth v5 (Auth.js) configuration
 *
 * OAuth callback URLs to register in provider dashboards:
 * - Google OAuth  → https://loxygene.netlify.app/api/auth/callback/google
 * - Kakao OAuth   → https://loxygene.netlify.app/api/auth/callback/kakao
 *
 * Local development:
 * - Google OAuth  → http://localhost:3000/api/auth/callback/google
 * - Kakao OAuth   → http://localhost:3000/api/auth/callback/kakao
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { compare } from "bcryptjs";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";

// Production base URL
export const BASE_URL =
  process.env.NEXTAUTH_URL ?? "https://loxygene.netlify.app";

// Credentials schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  providers: [
    // ── Email / Password ──────────────────────────────────────────────────────
    Credentials({
      id: "credentials",
      name: "이메일",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const db = getSupabaseServer();
        if (!db) {
          // Dev mode: accept demo credentials
          if (
            parsed.data.email === "demo@loxygene.com" &&
            parsed.data.password === "demo1234"
          ) {
            return {
              id: "demo-user",
              email: "demo@loxygene.com",
              name: "데모유저",
              nickname: "데모유저",
              role: "user",
              coins: 12400,
              avatar_url: undefined,
            };
          }
          return null;
        }

        const { data: user, error } = await db
          .from("users")
          .select("*")
          .eq("email", parsed.data.email)
          .single();

        if (error || !user || !user.password_hash) return null;

        const passwordMatch = await compare(
          parsed.data.password,
          user.password_hash
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.avatar_url,
          nickname: user.nickname,
          role: user.role ?? "user",
          coins: user.coins ?? 0,
          avatar_url: user.avatar_url ?? undefined,
        };
      },
    }),

    // ── Google OAuth ──────────────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    // ── Kakao OAuth ───────────────────────────────────────────────────────────
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID ?? "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  callbacks: {
    // ── JWT: store custom fields in token ────────────────────────────────────
    async jwt({ token, user, account }) {
      // Initial sign-in: populate token from user object
      if (user) {
        token.id = user.id;
        token.nickname = (user as { nickname?: string }).nickname ?? user.name ?? "게스트";
        token.role = (user as { role?: string }).role ?? "user";
        token.coins = (user as { coins?: number }).coins ?? 0;
        token.avatar_url =
          (user as { avatar_url?: string }).avatar_url ?? user.image ?? undefined;
      }

      // OAuth sign-in: upsert user into Supabase users table
      if (account && (account.provider === "google" || account.provider === "kakao") && user?.email) {
        const db = getSupabaseServer();
        if (db) {
          // Check if user exists
          const { data: existing } = await db
            .from("users")
            .select("id, nickname, role, coins, avatar_url")
            .eq("email", user.email)
            .single();

          if (!existing) {
            // Create new user
            const nickname =
              user.name?.replace(/\s+/g, "") ?? user.email.split("@")[0];
            const { data: created } = await db
              .from("users")
              .insert({
                email: user.email,
                nickname,
                provider: account.provider,
                provider_id: account.providerAccountId,
                avatar_url: user.image ?? null,
                role: "user",
                coins: 0,
              })
              .select("id, nickname, role, coins, avatar_url")
              .single();

            if (created) {
              token.id = created.id;
              token.nickname = created.nickname;
              token.role = created.role ?? "user";
              token.coins = created.coins ?? 0;
              token.avatar_url = created.avatar_url ?? undefined;
            }
          } else {
            token.id = existing.id;
            token.nickname = existing.nickname;
            token.role = existing.role ?? "user";
            token.coins = existing.coins ?? 0;
            token.avatar_url = existing.avatar_url ?? undefined;
          }
        }
      }

      return token;
    },

    // ── Session: expose custom fields to client ───────────────────────────────
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id ?? token.sub ?? "") as string;
        session.user.nickname = (token.nickname ?? session.user.name ?? "게스트") as string;
        session.user.role = (token.role ?? "user") as string;
        session.user.coins = (token.coins ?? 0) as number;
        session.user.avatar_url = token.avatar_url as string | undefined;
      }
      return session;
    },
  },
});
