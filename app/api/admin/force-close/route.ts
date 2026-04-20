import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";
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

  await supabase.from("admin_action_logs").insert({
    admin_id: session.user.id,
    action: "force_close",
    target_room_id: roomId,
    metadata: {},
  });

  return NextResponse.json({ success: true });
}
