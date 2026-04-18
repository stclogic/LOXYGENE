import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";
import { createDailyToken } from "@/lib/daily";

const bodySchema = z.object({
  roomId: z.string().min(1),
  password: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { roomId, password } = parsed.data;
  const userId = session.user.id as string;
  const userName = (session.user.name ?? session.user.email ?? "게스트") as string;
  const supabase = getSupabaseServer();

  // Fallback: no Supabase — return mock token
  if (!supabase) {
    return NextResponse.json({ roomId, type: "colosseum", role: "participant", dailyToken: null, dailyRoomUrl: null, isMock: true });
  }

  // Fetch room
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("id, room_type, is_active, max_participants, password_hash, daily_room_name, daily_room_url")
    .eq("id", roomId)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (!room.is_active) {
    return NextResponse.json({ error: "Room is no longer active" }, { status: 410 });
  }

  // Check participant count
  const { count } = await supabase
    .from("room_participants")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId)
    .is("left_at", null);

  if ((count ?? 0) >= room.max_participants) {
    return NextResponse.json({ error: "Room is full" }, { status: 409 });
  }

  // Password check
  if (room.password_hash && !password) {
    return NextResponse.json({ error: "Password required" }, { status: 403 });
  }
  if (room.password_hash && password) {
    const ok = await bcrypt.compare(password, room.password_hash as string);
    if (!ok) return NextResponse.json({ error: "Invalid password" }, { status: 403 });
  }

  // Check existing participant row (host was pre-inserted)
  const { data: existing } = await supabase
    .from("room_participants")
    .select("id, role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();

  const role: string = existing?.role ?? "participant";

  if (existing) {
    // Restore if previously left
    await supabase
      .from("room_participants")
      .update({ left_at: null })
      .eq("room_id", roomId)
      .eq("user_id", userId);
  } else {
    await supabase.from("room_participants").insert({
      room_id: roomId,
      user_id: userId,
      role: "participant",
    });
  }

  // Create Daily token
  let dailyToken: string | null = null;
  const dailyRoomUrl = room.daily_room_url as string | null;
  const dailyRoomName = room.daily_room_name as string | null;

  if (dailyRoomName) {
    try {
      const tokenData = await createDailyToken(dailyRoomName, userId, userName, role === "host");
      dailyToken = tokenData.token;
    } catch {
      // Daily.co not configured
    }
  }

  return NextResponse.json({ roomId, type: room.room_type, role, dailyToken, dailyRoomUrl });
}
