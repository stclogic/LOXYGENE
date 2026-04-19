"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

const AVATARS = [
  { id: "cyan", color: "#00E5FF", label: "시안" },
  { id: "pink", color: "#FF007F", label: "핑크" },
  { id: "violet", color: "#7C3AED", label: "바이올렛" },
  { id: "amber", color: "#F59E0B", label: "앰버" },
  { id: "emerald", color: "#10B981", label: "에메랄드" },
  { id: "rose", color: "#F43F5E", label: "로즈" },
];

function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const label = ["", "약함", "보통", "강함", "매우 강함"][score];
  const colors = ["", "#ef4444", "#f59e0b", "#00E5FF", "#10b981"];

  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i <= score ? colors[score] : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <span className="text-[10px]" style={{ color: colors[score] }}>{label}</span>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("cyan");

  // Step 3
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (nickname.length < 2 || nickname.length > 16) {
      setError("닉네임은 2~16자여야 합니다.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreeTerms || !agreePrivacy) {
      setError("필수 약관에 동의해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname, avatar, agreeMarketing }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }
      // Auto sign-in after register
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl text-sm text-white outline-none placeholder:text-white/20 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #FF007F 0%, transparent 70%)", filter: "blur(80px)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-black tracking-[0.2em]"
            style={{ color: "#00E5FF", textShadow: "0 0 20px rgba(0,229,255,0.5)" }}
          >
            L&apos;OXYGÈNE
          </h1>
          <p className="text-white/30 text-xs mt-2 tracking-widest">하이엔드 가상 소셜 라운지</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={{
                  background: s <= step ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${s <= step ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.12)"}`,
                  color: s <= step ? "#00E5FF" : "rgba(255,255,255,0.3)",
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className="flex-1 h-px transition-all"
                  style={{ background: s < step ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.08)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 flex flex-col gap-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Step 1 — 기본 정보 */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="flex flex-col gap-4">
              <h2 className="text-white font-bold text-lg">기본 정보</h2>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 8자"
                  required
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <PasswordStrength password={password} />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.08))",
                  border: "1px solid rgba(0,229,255,0.4)",
                  color: "#00E5FF",
                }}
              >
                다음
              </button>
            </form>
          )}

          {/* Step 2 — 프로필 설정 */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="flex flex-col gap-4">
              <h2 className="text-white font-bold text-lg">프로필 설정</h2>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">닉네임 (2~16자)</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="나만의 닉네임"
                  required
                  minLength={2}
                  maxLength={16}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-3 block">아바타 선택</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      aria-label={a.label}
                      onClick={() => setAvatar(a.id)}
                      className="w-10 h-10 rounded-full transition-all hover:scale-110"
                      style={{
                        background: a.color,
                        border: avatar === a.id ? `3px solid white` : "3px solid transparent",
                        opacity: avatar === a.id ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>
              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  이전
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.08))",
                    border: "1px solid rgba(0,229,255,0.4)",
                    color: "#00E5FF",
                  }}
                >
                  다음
                </button>
              </div>
            </form>
          )}

          {/* Step 3 — 약관 동의 */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-white font-bold text-lg">약관 동의</h2>
              <div className="flex flex-col gap-3">
                {/* All agree */}
                <label
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                  style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.15)" }}
                >
                  <input
                    type="checkbox"
                    checked={agreeAll}
                    onChange={(e) => handleAgreeAll(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                  <span className="text-sm font-semibold text-white">전체 동의</span>
                </label>

                <div
                  className="flex flex-col gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        if (!e.target.checked) setAgreeAll(false);
                      }}
                      className="w-4 h-4 accent-cyan-400"
                    />
                    <span className="text-xs text-white/70">
                      <span className="text-[#00E5FF]">[필수]</span> 서비스 이용약관
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => {
                        setAgreePrivacy(e.target.checked);
                        if (!e.target.checked) setAgreeAll(false);
                      }}
                      className="w-4 h-4 accent-cyan-400"
                    />
                    <span className="text-xs text-white/70">
                      <span className="text-[#00E5FF]">[필수]</span> 개인정보 처리방침
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeMarketing}
                      onChange={(e) => {
                        setAgreeMarketing(e.target.checked);
                        if (!e.target.checked) setAgreeAll(false);
                      }}
                      className="w-4 h-4 accent-cyan-400"
                    />
                    <span className="text-xs text-white/70">
                      <span className="text-white/40">[선택]</span> 마케팅 수신 동의
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.08))",
                    border: "1px solid rgba(0,229,255,0.4)",
                    color: "#00E5FF",
                  }}
                >
                  {loading ? "가입 중..." : "가입 완료"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-white/30">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="text-[#00E5FF] hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707]" />}>
      <RegisterForm />
    </Suspense>
  );
}
