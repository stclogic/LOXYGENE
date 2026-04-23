import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ status: null, isMember: false });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    // Supabase 미설정: mock (localStorage 폴백용)
    return NextResponse.json({ status: null, isMember: false, mock: true });
  }

  const { data, error } = await supabase
    .from("vvip_applications")
    .select("id, status")
    .eq("session_id", sessionId)
    .order("applied_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: null, isMember: false });
  }

  return NextResponse.json({
    status:   data.status,
    isMember: data.status === "approved",
    id:       data.id,
  });
}
