import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface RoomRow {
  id: string;
  title: string;
  host_nickname: string;
  room_type: string;
  participant_count?: number;
  max_participants: number;
  ticket_price: number;
  current_song?: string | null;
  tags?: string[];
  is_active: boolean;
  is_live?: boolean;
}

const MOCK_ROOMS: RoomRow[] = [
  {
    id: "room-001",
    title: "🎤 트로트 황금시대",
    host_nickname: "노래왕김씨",
    room_type: "colosseum",
    participant_count: 12,
    max_participants: 50,
    ticket_price: 0,
    current_song: "안동역에서 - 진성",
    tags: ["#트로트", "#발라드"],
    is_active: true,
    is_live: true,
  },
  {
    id: "room-002",
    title: "🎵 90년대 팝송 파티",
    host_nickname: "팝스타유나",
    room_type: "colosseum",
    participant_count: 8,
    max_participants: 30,
    ticket_price: 100,
    current_song: "My Heart Will Go On - Celine Dion",
    tags: ["#팝", "#90년대"],
    is_active: true,
    is_live: true,
  },
  {
    id: "room-003",
    title: "🔥 BTS 커버 배틀",
    host_nickname: "방탄소년단팬",
    room_type: "colosseum",
    participant_count: 24,
    max_participants: 50,
    ticket_price: 200,
    current_song: "봄날 - BTS",
    tags: ["#kpop", "#BTS"],
    is_active: true,
    is_live: true,
  },
];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || url === "your_supabase_url_here") return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "colosseum";
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ rooms: MOCK_ROOMS, isMock: true });
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("room_type", type)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return NextResponse.json({ rooms: MOCK_ROOMS, isMock: true });
  }

  return NextResponse.json({ rooms: data, isMock: false });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RoomRow>;
  const roomId = "room-" + Date.now();
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ roomId, isMock: true });
  }

  const { data, error } = await supabase
    .from("rooms")
    .insert({ id: roomId, ...body })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ roomId, isMock: true });
  }

  return NextResponse.json({ roomId: (data as RoomRow).id, isMock: false });
}
