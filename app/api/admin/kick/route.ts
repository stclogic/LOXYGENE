import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";
import { logAdminAction } from "@/lib/adminLog";
import { z } from "zod";

const schema = z.object({
  roomId:   z.string().min(1),
  userId:   z.string().min(1),
  nickname: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { roomId, userId, nickname } = parsed.data;
  const supabase = getSupabaseServer();

  if (!supabase) {
    return NextResponse.json({ success: true, isMock: true });
  }

  await supabase
    .from("room_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", userId);

  await logAdminAction({
    adminId:     session.user.id,
    actionType:  "kick",
    targetType:  "user",
    targetId:    userId,
    description: `Kicked user${nickname ? ` (${nickname})` : ""} from room ${roomId}`,
    metadata:    { roomId, nickname: nickname ?? null },
  });

  return NextResponse.json({ success: true });
}
