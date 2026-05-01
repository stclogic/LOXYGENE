import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
  }

  const { youtube_url } = await req.json()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: true, mock: true })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verify the caller is the host of this room
  const { data: room } = await supabase
    .from('rooms')
    .select('host_id')
    .eq('id', roomId)
    .single()

  if (!room || room.host_id !== session.user.id) {
    return NextResponse.json({ error: '호스트만 영상을 변경할 수 있어요' }, { status: 403 })
  }

  const { error } = await supabase
    .from('rooms')
    .update({ youtube_url: youtube_url ?? null })
    .eq('id', roomId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
