import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";
import { z } from "zod";

const schema = z.object({
  roomId:    z.string().min(1),
  newHostId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { roomId, newHostId } = parsed.data;
  const userId = session.user.id as string;
  const supabase = getSupabaseServer();

  if (!supabase) {
    return NextResponse.json({ success: true, isMock: true });
  }

  // Verify requester is current host (or super admin)
  const { data: requester } = await supabase
    .from("room_participants")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .is("left_at", null)
    .single();

  const isSuperAdmin = session.user.isSuperAdmin === true;
  if (!isSuperAdmin && requester?.role !== "host") {
    return NextResponse.json({ error: "Only the current host can transfer host" }, { status: 403 });
  }

  // Demote current host → participant
  await supabase
    .from("room_participants")
    .update({ role: "participant" })
    .eq("room_id", roomId)
    .eq("user_id", userId);

  // Promote new host
  await supabase
    .from("room_participants")
    .update({ role: "host" })
    .eq("room_id", roomId)
    .eq("user_id", newHostId);

  return NextResponse.json({ success: true });
}
