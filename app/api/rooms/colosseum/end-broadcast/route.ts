import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/admin";

const DAILY_API_URL = process.env.DAILY_API_URL || "https://api.daily.co/v1";
const DAILY_API_KEY = process.env.DAILY_API_KEY ?? "";
const ROOM_NAME = "the-colosseum";

export async function POST() {
  const session = await auth();
  const userEmail = session?.user?.email ?? "";

  if (!isSuperAdmin(userEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!DAILY_API_KEY) {
    return NextResponse.json({ success: true, mock: true });
  }

  try {
    // Daily.co 방 삭제 — 다음 입장 시 ensureBroadcastRoom이 새로 생성
    const res = await fetch(`${DAILY_API_URL}/rooms/${ROOM_NAME}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });

    if (!res.ok && res.status !== 404) {
      return NextResponse.json({ error: "방 삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("end-broadcast error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
