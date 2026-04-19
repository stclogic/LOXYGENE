import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다."),
  nickname: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다.").max(16, "닉네임은 최대 16자입니다."),
  avatar: z.string().optional(),
  agreeMarketing: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password, nickname, avatar, agreeMarketing } = parsed.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // No DB — return success so registration isn't broken in dev
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: true, mock: true });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check duplicate email
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  // Hash password
  const bcrypt = await import("bcryptjs");
  const password_hash = await bcrypt.hash(password, 12);

  // Insert user
  const { error: insertError } = await supabase.from("users").insert({
    email,
    password_hash,
    nickname,
    avatar_color: avatar ?? "cyan",
    agree_marketing: agreeMarketing ?? false,
    role: "user",
    coins: 0,
  });

  if (insertError) {
    console.error("Register insert error:", insertError);
    return NextResponse.json({ error: "가입 처리 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
