"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParam ? "로그인 오류: 이메일 또는 비밀번호를 확인해주세요" : ""
  );

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push(callbackUrl);
    }
  };

  const handleOAuth = (provider: "google" | "kakao") => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #FF007F 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-[0.2em]"
            style={{ color: "#00E5FF", textShadow: "0 0 20px rgba(0,229,255,0.5)" }}>
            L&apos;OXYGÈNE
          </h1>
          <p className="text-white/30 text-xs mt-2 tracking-widest">하이엔드 가상 소셜 라운지</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 flex flex-col gap-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
          <h2 className="text-white font-bold text-lg">로그인</h2>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-2.5">
            <button type="button" onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
              <Icon icon="flat-color-icons:google" className="w-5 h-5" />
              Google로 계속하기
            </button>
            <button type="button" onClick={() => handleOAuth("kakao")}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(254,229,0,0.12)", border: "1px solid rgba(254,229,0,0.25)", color: "#FEE500" }}>
              <Icon icon="simple-icons:kakao" className="w-5 h-5" />
              카카오로 계속하기
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-[11px] text-white/25">또는</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Email / PW form */}
          <form onSubmit={handleCredentials} className="flex flex-col gap-3">
            <div>
              <label htmlFor="email" className="text-xs text-white/50 mb-1.5 block">이메일</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none placeholder:text-white/20 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs text-white/50 mb-1.5 block">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none placeholder:text-white/20 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </p>
            )}

            <Link href="/auth/forgot-password"
              className="text-[11px] text-right transition-colors"
              style={{ color: "rgba(0,229,255,0.6)" }}>
              비밀번호를 잊으셨나요?
            </Link>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.08))", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", boxShadow: "0 0 20px rgba(0,229,255,0.1)" }}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="text-center text-xs text-white/30">
            계정이 없으신가요?{" "}
            <Link href="/auth/register" className="text-[#00E5FF] hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707]" />}>
      <LoginForm />
    </Suspense>
  );
}
