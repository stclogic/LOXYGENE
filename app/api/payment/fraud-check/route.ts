import { NextRequest, NextResponse } from 'next/server';

interface FraudCheckResult {
  isRisky: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  action: 'allow' | 'flag' | 'block';
}

export async function POST(req: NextRequest) {
  const { userId, action, amount, metadata } = await req.json();

  const reasons: string[] = [];
  let riskScore = 0;

  // Rule 1: Large single transaction
  if (amount > 100000) {
    reasons.push('고액 단건 거래');
    riskScore += 30;
  }

  // Rule 2: Rapid repeated transactions
  if (metadata?.transactionsInLastMinute > 5) {
    reasons.push('단시간 반복 거래');
    riskScore += 40;
  }

  // Rule 3: New account large transaction
  if (metadata?.accountAgeHours < 24 && amount > 10000) {
    reasons.push('신규 계정 고액 거래');
    riskScore += 25;
  }

  // Rule 4: Self-gifting detection
  if (metadata?.senderId === metadata?.receiverId) {
    reasons.push('자기 자신에게 선물 시도');
    riskScore += 100;
  }

  // Rule 5: Multiple IPs
  if (metadata?.uniqueIPsToday > 3) {
    reasons.push('다중 IP 접속');
    riskScore += 35;
  }

  const riskLevel =
    riskScore >= 100 ? 'critical' :
    riskScore >= 70  ? 'high' :
    riskScore >= 40  ? 'medium' : 'low';

  const actionResult =
    riskScore >= 100 ? 'block' :
    riskScore >= 70  ? 'flag' : 'allow';

  const result: FraudCheckResult = {
    isRisky: riskScore >= 40,
    riskLevel,
    reasons,
    action: actionResult,
  };

  // Log if risky
  if (result.isRisky) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl !== 'your_supabase_url_here') {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from('fraud_logs').insert({
        user_id: userId,
        event_type: action,
        description: reasons.join(', '),
        risk_level: riskLevel,
      });
    }
  }

  return NextResponse.json(result);
}
