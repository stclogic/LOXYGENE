import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";

const MOCK_ORDERS = [
  { id: "o1", item_name: "Dom Pérignon L.", quantity: 1, total_coins: 4500, status: "delivered", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "o2", item_name: "Signature Cocktails", quantity: 2, total_coins: 2400, status: "delivering", created_at: new Date(Date.now() - 900000).toISOString() },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const supabase = getSupabaseServer();

  if (!supabase) {
    return NextResponse.json({ orders: MOCK_ORDERS, isMock: true });
  }

  const { data, error } = await supabase
    .from("fnb_orders")
    .select("id, item_name, quantity, total_coins, status, created_at, delivered_at, room_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ orders: MOCK_ORDERS, isMock: true });
  }

  return NextResponse.json({ orders: data ?? [], isMock: false });
}
