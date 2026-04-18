import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";

const bodySchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
  roomId: z.string().optional(),
  deliveryAddress: z.string().optional(),
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

  const { itemId, quantity, roomId, deliveryAddress } = parsed.data;
  const userId = session.user.id as string;
  const supabase = getSupabaseServer();

  // Mock fallback
  if (!supabase) {
    return NextResponse.json({
      orderId: `order-${Date.now()}`,
      status: "confirmed",
      estimatedMinutes: 15,
      newBalance: 24500,
      isMock: true,
    });
  }

  // Fetch item price
  const { data: item, error: itemErr } = await supabase
    .from("fnb_items")
    .select("id, name, price_coins, delivery_minutes, is_available")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (!item.is_available) {
    return NextResponse.json({ error: "Item not available" }, { status: 409 });
  }

  const total_coins = (item.price_coins as number) * quantity;

  // Fetch user coin balance
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("coins")
    .eq("id", userId)
    .single();

  if (userErr || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const currentCoins = user.coins as number;
  if (currentCoins < total_coins) {
    return NextResponse.json(
      { error: "insufficient_coins", currentCoins, required: total_coins },
      { status: 402 }
    );
  }

  // Deduct coins
  const newBalance = currentCoins - total_coins;
  const { error: deductErr } = await supabase
    .from("users")
    .update({ coins: newBalance })
    .eq("id", userId);

  if (deductErr) {
    return NextResponse.json({ error: "Failed to deduct coins" }, { status: 500 });
  }

  // Insert order
  const { data: order, error: orderErr } = await supabase
    .from("fnb_orders")
    .insert({
      user_id: userId,
      room_id: roomId ?? null,
      item_id: itemId,
      item_name: item.name,
      quantity,
      total_coins,
      status: "confirmed",
      delivery_address: deliveryAddress ?? null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    // Coins were deducted — refund on order failure
    await supabase.from("users").update({ coins: currentCoins }).eq("id", userId);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    status: "confirmed",
    estimatedMinutes: item.delivery_minutes as number,
    newBalance,
  });
}
