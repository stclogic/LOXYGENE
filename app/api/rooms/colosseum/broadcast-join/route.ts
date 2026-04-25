import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";
import { ensureBroadcastRoom, createBroadcastToken } from "@/lib/daily";

const BROADCAST_ROOM_NAME = "the-colosseum";
const BROADCAST_ROOM_URL  = "https://zigglelink.daily.co/the-colosseum";

async function hasPurchaseHistory(userId: string): Promise<boolean> {
  const supabase = getSupabaseServer();
  if (!supabase) return false;
  const { count } = await supabase
    .from("item_transactions")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", userId);
  return (count ?? 0) > 0;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  const body = await req.json().catch(() => ({}));
  const nickname: string  = body.nickname ?? session?.user?.name ?? "게스트";
  const userId: string    = session?.user?.id ?? `anon-${Date.now()}`;
  const userEmail: string = session?.user?.email ?? "";

  // 슈퍼어드민 또는 유료 구매 이력 보유자 → 호스트
  const isAdmin = isSuperAdmin(userEmail);
  const hasPurchase = session?.user?.id ? await hasPurchaseHistory(userId) : false;
  const isHost = isAdmin || hasPurchase;

  if (!process.env.DAILY_API_KEY) {
    return NextResponse.json({
      roomUrl: BROADCAST_ROOM_URL,
      token: null,
      role: isHost ? "host" : "guest",
      isMock: true,
    });
  }

  try {
    await ensureBroadcastRoom(BROADCAST_ROOM_NAME);

    const { token } = await createBroadcastToken(
      BROADCAST_ROOM_NAME,
      userId,
      nickname,
      isHost,
    );

    return NextResponse.json({
      roomUrl: BROADCAST_ROOM_URL,
      token,
      role: isHost ? "host" : "guest",
    });
  } catch (err) {
    console.error("broadcast-join error:", err);
    return NextResponse.json({ error: "Daily.co 연결 실패" }, { status: 500 });
  }
}
