import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";
import { logAdminAction } from "@/lib/adminLog";
import { z } from "zod";

const schema = z.object({ roomId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { roomId } = parsed.data;
  const supabase = getSupabaseServer();

  if (!supabase) {
    return NextResponse.json({ success: true, isMock: true });
  }

  await supabase.from("rooms").update({ is_active: false }).eq("id", roomId);

  await logAdminAction({
    adminId:     session.user.id,
    actionType:  "force_close",
    targetType:  "room",
    targetId:    roomId,
    description: `Force-closed room ${roomId}`,
  });

  return NextResponse.json({ success: true });
}
