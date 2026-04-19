import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateDistribution,
  generateOrderId,
  ITEM_PRICES,
} from '@/lib/supabase/distributionEngine';

export async function POST(req: NextRequest) {
  const {
    senderId,
    receiverId,
    directorId,
    roomId,
    itemType,
    itemAmount,
    idempotencyKey,
  } = await req.json();

  // Validate
  if (!senderId || !receiverId || !roomId || !itemType) {
    return NextResponse.json(
      { error: '필수 정보가 누락되었습니다' },
      { status: 400 }
    );
  }

  const pricePerItem = ITEM_PRICES[itemType as keyof typeof ITEM_PRICES];
  if (!pricePerItem) {
    return NextResponse.json(
      { error: '알 수 없는 아이템입니다' },
      { status: 400 }
    );
  }

  const totalCredits = pricePerItem * (itemAmount || 1);
  const distribution = calculateDistribution(totalCredits, !!directorId);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Mock mode response
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
    return NextResponse.json({
      success: true,
      isMock: true,
      orderId: generateOrderId(),
      totalCredits,
      distribution,
      message: `${itemType} 선물 완료!`,
    });
  }

  const supabase = createClient(
    supabaseUrl,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
  );

  // Idempotency check
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (existing) {
    return NextResponse.json({ success: true, isDuplicate: true });
  }

  // ACID Transaction via Supabase RPC
  const { data, error } = await supabase.rpc('process_gift_transaction', {
    p_sender_id: senderId,
    p_receiver_id: receiverId,
    p_director_id: directorId || null,
    p_room_id: roomId,
    p_item_type: itemType,
    p_item_amount: itemAmount || 1,
    p_total_credits: totalCredits,
    p_platform_cut: distribution.platformCut,
    p_director_cut: distribution.directorCut,
    p_host_cut: distribution.hostCut,
    p_order_id: generateOrderId(),
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    if (error.message.includes('insufficient_balance')) {
      return NextResponse.json(
        { error: 'O₂ 크레딧이 부족합니다' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '선물 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId: data.order_id,
    totalCredits,
    distribution,
    senderNewBalance: data.sender_new_balance,
    message: '선물이 전달되었습니다',
  });
}
