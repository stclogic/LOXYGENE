import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.sessionId || !body?.name || !body?.email) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Supabase 미설정 시 mock 응답 (개발 환경)
  if (!supabase) {
    return NextResponse.json({ success: true, mock: true });
  }

  // 중복 신청 확인
  const { data: existing } = await supabase
    .from("vvip_applications")
    .select("id, status")
    .eq("session_id", body.sessionId)
    .order("applied_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ success: true, id: existing.id, status: existing.status });
  }

  const { data, error } = await supabase
    .from("vvip_applications")
    .insert({
      session_id: body.sessionId,
      name:       body.name,
      email:      body.email,
      phone:      body.phone    ?? "",
      bio:        body.bio      ?? "",
      referral:   body.referral ?? "",
      scale:      body.scale    ?? "small",
      status:     "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("vvip apply error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
