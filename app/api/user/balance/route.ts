import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ coins: 24500, isMock: true });
  }

  const { data, error } = await supabase
    .from("users")
    .select("coins")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ coins: 0 });
  }

  return NextResponse.json({ coins: data.coins as number });
}
