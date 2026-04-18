import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/supabaseServer";

export interface FnbItem {
  id: string;
  name: string;
  description: string | null;
  price_coins: number;
  category: "drinks" | "food" | "premium";
  image_url: string | null;
  delivery_minutes: number;
}

const MOCK_MENU: FnbItem[] = [
  { id: "m1", name: "Dom Pérignon L.", description: "최고급 샴페인, 파티의 품격을 높이세요", price_coins: 4500, category: "premium", image_url: null, delivery_minutes: 15 },
  { id: "m2", name: "Signature Cocktails", description: "시그니처 칵테일 세트 (3종)", price_coins: 1200, category: "drinks", image_url: null, delivery_minutes: 10 },
  { id: "m3", name: "Hennessy XO", description: "프리미엄 코냑", price_coins: 3800, category: "premium", image_url: null, delivery_minutes: 15 },
  { id: "m4", name: "스파클링 워터 세트", description: "페리에 6병 세트", price_coins: 450, category: "drinks", image_url: null, delivery_minutes: 10 },
  { id: "m5", name: "파티 스낵 플래터", description: "치즈, 크래커, 과일 모둠", price_coins: 850, category: "food", image_url: null, delivery_minutes: 20 },
  { id: "m6", name: "프리미엄 위스키", description: "발렌타인 17년", price_coins: 2800, category: "premium", image_url: null, delivery_minutes: 15 },
];

function groupByCategory(items: FnbItem[]) {
  return items.reduce<Record<string, FnbItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export async function GET() {
  const supabase = getSupabaseServer();

  if (!supabase) {
    return NextResponse.json({ menu: groupByCategory(MOCK_MENU), isMock: true });
  }

  const { data, error } = await supabase
    .from("fnb_items")
    .select("id, name, description, price_coins, category, image_url, delivery_minutes")
    .eq("is_available", true)
    .order("category")
    .order("price_coins");

  if (error || !data?.length) {
    return NextResponse.json({ menu: groupByCategory(MOCK_MENU), isMock: true });
  }

  return NextResponse.json({ menu: groupByCategory(data as FnbItem[]), isMock: false });
}
