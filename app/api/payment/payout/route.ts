import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  creditsToKRW,
  calculateWithholdingTax,
} from '@/lib/supabase/distributionEngine';

export async function POST(req: NextRequest) {
  const {
    userId,
    nickname,
    amountCredits,
    bankName,
    accountNumber,
    accountHolder,
  } = await req.json();

  if (!userId || !amountCredits || amountCredits < 10000) {
    return NextResponse.json(
      { error: '최소 출금 금액은 10,000 크레딧입니다' },
      { status: 400 }
    );
  }

  const amountKRW = creditsToKRW(amountCredits);
  const withholdingTax = calculateWithholdingTax(amountKRW);
  const finalAmountKRW = amountKRW - withholdingTax;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
    return NextResponse.json({
      success: true,
      isMock: true,
      summary: {
        requestedCredits: amountCredits,
        amountKRW,
        withholdingTax,
        finalAmountKRW,
        estimatedDate: 'T+1 영업일',
      },
      message: '출금 신청이 접수되었습니다',
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, trust_score, is_frozen')
    .eq('user_id', userId)
    .single();

  if (!wallet) {
    return NextResponse.json(
      { error: '지갑 정보를 찾을 수 없습니다' },
      { status: 404 }
    );
  }

  if (wallet.is_frozen) {
    return NextResponse.json(
      { error: '계정이 동결되었습니다. 고객센터에 문의하세요' },
      { status: 403 }
    );
  }

  if (wallet.balance < amountCredits) {
    return NextResponse.json(
      { error: 'O₂ 크레딧이 부족합니다' },
      { status: 400 }
    );
  }

  // Auto-approve for high trust score users (trust_score >= 80)
  const autoApprove = wallet.trust_score >= 80 && amountKRW <= 100000;
  const status = autoApprove ? 'auto_approved' : 'pending';

  const { data, error } = await supabase
    .from('payout_requests')
    .insert({
      user_id: userId,
      nickname,
      amount_credits: amountCredits,
      amount_krw: amountKRW,
      bank_name: bankName,
      account_number: accountNumber,
      account_holder: accountHolder,
      tax_withheld: withholdingTax,
      final_amount_krw: finalAmountKRW,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: '출금 신청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    requestId: data.id,
    status,
    summary: {
      requestedCredits: amountCredits,
      amountKRW,
      withholdingTax,
      finalAmountKRW,
      estimatedDate: autoApprove ? '오늘 중 처리' : 'T+1 영업일',
    },
    message: autoApprove
      ? '자동 승인되었습니다. 오늘 중 입금됩니다'
      : '출금 신청이 접수되었습니다. T+1 영업일 내 처리됩니다',
  });
}
