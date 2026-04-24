import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/admin";
import { ensureBroadcastRoom, createBroadcastToken } from "@/lib/daily";

const BROADCAST_ROOM_NAME = "the-colosseum";
const BROADCAST_ROOM_URL  = "https://loxygene.daily.co/the-colosseum";

export async function POST(req: NextRequest) {
  const session = await auth();

  // 닉네임은 비로그인 게스트도 전달할 수 있도록 body에서 선택적으로 수령
  const body = await req.json().catch(() => ({}));
  const nickname: string = body.nickname ?? session?.user?.name ?? "게스트";
  const userId: string   = session?.user?.id ?? `anon-${Date.now()}`;
  const userEmail: string = session?.user?.email ?? "";

  const isHost = isSuperAdmin(userEmail);

  // DAILY_API_KEY 미설정 시 mock 응답 (개발 환경)
  if (!process.env.DAILY_API_KEY) {
    return NextResponse.json({
      roomUrl: BROADCAST_ROOM_URL,
      token: null,
      role: isHost ? "host" : "guest",
      isMock: true,
    });
  }

  try {
    // 고정 방 존재 확인 / 최초 1회 생성 (이후에는 GET만 통과)
    await ensureBroadcastRoom(BROADCAST_ROOM_NAME);

    // 역할별 토큰 발급
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
