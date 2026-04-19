import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(50),
  type: z.enum(['colosseum', 'variety', 'talkshow', 'dj']),
  maxParticipants: z.number().min(2).max(50).default(50),
  password: z.string().optional(),
  isPrivate: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    console.log('Create room - session:', session?.user?.id)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Create room - body:', body)

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값을 확인해주세요', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, type, maxParticipants, isPrivate } = parsed.data

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      const mockId = `room-${Date.now()}`
      return NextResponse.json({ success: true, roomId: mockId, type, isMock: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        host_id: session.user.id,
        title,
        type,
        max_participants: maxParticipants,
        is_private: isPrivate,
        status: 'waiting',
      })
      .select()
      .single()

    if (roomError) {
      console.error('Room insert error:', roomError)
      return NextResponse.json({ error: roomError.message }, { status: 500 })
    }

    console.log('Room created:', room.id)

    // Add host as participant
    const { error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: session.user.id,
        role: 'host',
        mic_enabled: true,
        camera_enabled: true,
      })

    if (participantError) {
      console.error('Participant insert error:', participantError)
    }

    // Try Daily.co room creation (non-blocking)
    try {
      if (process.env.DAILY_API_KEY) {
        const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            name: room.id,
            privacy: 'public',
            properties: {
              max_participants: maxParticipants,
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
            },
          }),
        })
        const dailyData = await dailyRes.json()
        console.log('Daily room:', dailyData.url)

        if (dailyData.url) {
          await supabase
            .from('rooms')
            .update({
              daily_room_name: dailyData.name,
              daily_room_url: dailyData.url,
            })
            .eq('id', room.id)
        }
      }
    } catch (dailyErr) {
      console.error('Daily.co error (non-blocking):', dailyErr)
    }

    return NextResponse.json({
      success: true,
      roomId: room.id,
      type: room.type,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
