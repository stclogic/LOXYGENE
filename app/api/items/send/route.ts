import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import { z } from 'zod'

const ITEM_COSTS: Record<string, number> = {
  bouquet:    100,
  champagne:  200,
  clap:        50,
  heart:       30,
}

// Revenue split ratios
const SPLIT = { platform: 0.30, director: 0.20, host: 0.50 }

const schema = z.object({
  itemType: z.enum(['bouquet', 'champagne', 'clap', 'heart']),
  roomId:   z.string().min(1),
  hostId:   z.string().min(1),
  directorId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값 오류', details: parsed.error.flatten() }, { status: 400 })
    }

    const { itemType, roomId, hostId, directorId } = parsed.data
    const cost = ITEM_COSTS[itemType]
    const senderId = session.user.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    // Mock success when Supabase not configured
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: true,
        isMock: true,
        itemType,
        cost,
        split: {
          platform: Math.floor(cost * SPLIT.platform),
          director: Math.floor(cost * SPLIT.director),
          host:     cost - Math.floor(cost * SPLIT.platform) - Math.floor(cost * SPLIT.director),
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Check sender balance
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', senderId)
      .single()

    if (walletErr || !wallet) {
      return NextResponse.json({ error: '지갑 정보를 찾을 수 없어요' }, { status: 404 })
    }
    if (wallet.balance < cost) {
      return NextResponse.json({ error: '크레딧이 부족해요', required: cost, current: wallet.balance }, { status: 402 })
    }

    // 2. Calculate split amounts (host absorbs rounding remainder)
    const platformAmt = Math.floor(cost * SPLIT.platform)
    const directorAmt = directorId ? Math.floor(cost * SPLIT.director) : 0
    const hostAmt     = cost - platformAmt - directorAmt

    // 3. Execute: deduct sender + credit recipients in parallel
    const ops: PromiseLike<unknown>[] = [
      // Deduct sender
      supabase.rpc('adjust_wallet', { p_user_id: senderId,     p_delta: -cost }),
      // Credit host
      supabase.rpc('adjust_wallet', { p_user_id: hostId,       p_delta: hostAmt }),
      // Credit platform (system wallet)
      supabase.rpc('adjust_wallet', { p_user_id: 'PLATFORM',   p_delta: platformAmt }),
    ]
    if (directorId) {
      ops.push(supabase.rpc('adjust_wallet', { p_user_id: directorId, p_delta: directorAmt }))
    }

    const results = await Promise.all(ops)
    const firstError = results.find((r: unknown) => (r as { error: unknown }).error)
    if (firstError) {
      console.error('Wallet adjustment error:', (firstError as { error: unknown }).error)
      return NextResponse.json({ error: '정산 중 오류가 발생했어요' }, { status: 500 })
    }

    // 4. Record transaction
    await supabase.from('item_transactions').insert({
      sender_id:    senderId,
      room_id:      roomId,
      host_id:      hostId,
      director_id:  directorId ?? null,
      item_type:    itemType,
      cost,
      platform_cut: platformAmt,
      director_cut: directorAmt,
      host_cut:     hostAmt,
    })

    return NextResponse.json({
      success: true,
      itemType,
      cost,
      split: { platform: platformAmt, director: directorAmt, host: hostAmt },
    })
  } catch (err) {
    console.error('items/send error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
