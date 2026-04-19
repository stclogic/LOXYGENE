import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateOrderId,
  krwToCredits,
  calculateVAT,
} from '@/lib/supabase/distributionEngine';

export async function POST(req: NextRequest) {
  const {
    userId,
    amountKRW,
    pgProvider,
    pgTransactionId,
    idempotencyKey,
  } = await req.json();

  // Validate inputs
  if (!userId || !amountKRW || amountKRW < 1000) {
    return NextResponse.json(
      { error: '최소 충전 금액은 1,000원입니다' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Mock mode
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
    const credits = krwToCredits(amountKRW);
    return NextResponse.json({
      success: true,
      isMock: true,
      orderId: generateOrderId(),
      creditsAdded: credits,
      newBalance: 24500 + credits,
      message: `${credits.toLocaleString()} O₂ 크레딧이 충전되었습니다`,
    });
  }

  const supabase = createClient(
    supabaseUrl,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
  );

  // Idempotency check — prevent double charging
  const { data: existingOrder } = await supabase
    .from('charge_orders')
    .select('id, status, amount_credits')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (existingOrder) {
    if (existingOrder.status === 'completed') {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        message: '이미 처리된 결제입니다',
      });
    }
  }

  const orderId = generateOrderId();
  const vatAmount = calculateVAT(amountKRW);
  const netAmount = amountKRW - vatAmount;
  const credits = krwToCredits(netAmount);

  // ACID Transaction via Supabase RPC
  const { data, error } = await supabase.rpc('process_charge', {
    p_user_id: userId,
    p_order_id: orderId,
    p_amount_krw: amountKRW,
    p_amount_credits: credits,
    p_vat_amount: vatAmount,
    p_pg_provider: pgProvider || 'mock',
    p_pg_transaction_id: pgTransactionId || '',
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error('Charge error:', error);
    return NextResponse.json(
      { error: '충전 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId,
    creditsAdded: credits,
    newBalance: data.new_balance,
    message: `${credits.toLocaleString()} O₂ 크레딧이 충전되었습니다`,
  });
}
