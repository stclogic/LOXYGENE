import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";
import { createDailyRoom } from "@/lib/daily";

const bodySchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(["colosseum", "variety", "talkshow", "dj"]),
  maxParticipants: z.number().int().min(2).max(50).default(50),
  password: z.string().optional(),
  isPrivate: z.boolean().default(false),
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

  const { title, type, maxParticipants, password, isPrivate } = parsed.data;
  const hostId = session.user.id as string;
  const supabase = getSupabaseServer();

  // Fallback: no Supabase
  if (!supabase) {
    const mockId = `room-${Date.now()}`;
    return NextResponse.json({ roomId: mockId, type, dailyRoomUrl: null, isMock: true });
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  // Insert room
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({
      title,
      room_type: type,
      host_id: hostId,
      max_participants: maxParticipants,
      password_hash: passwordHash,
      is_private: isPrivate,
      is_active: true,
    })
    .select("id")
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }

  const roomId = room.id as string;

  // Insert host as participant
  await supabase.from("room_participants").insert({
    room_id: roomId,
    user_id: hostId,
    role: "host",
  });

  // Create Daily.co room
  let dailyRoomUrl: string | null = null;
  let dailyRoomName: string | null = null;
  try {
    const daily = await createDailyRoom(roomId, maxParticipants);
    dailyRoomUrl = daily.url;
    dailyRoomName = daily.name;
    await supabase
      .from("rooms")
      .update({ daily_room_url: dailyRoomUrl, daily_room_name: dailyRoomName })
      .eq("id", roomId);
  } catch {
    // Daily.co not configured — room still created, just no video
  }

  return NextResponse.json({ roomId, type, dailyRoomUrl });
}
