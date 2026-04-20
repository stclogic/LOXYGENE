import { createClient } from '@supabase/supabase-js'

export async function logAdminAction({
  adminId,
  actionType,
  targetType,
  targetId,
  description,
  metadata,
}: {
  adminId: string
  actionType: string
  targetType?: string
  targetId?: string
  description?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) return
    const supabase = createClient(url, key)
    await supabase.from('admin_action_logs').insert({
      admin_id:    adminId,
      action_type: actionType,
      target_type: targetType ?? null,
      target_id:   targetId   ?? null,
      description: description ?? null,
      metadata:    metadata    ?? {},
    })
  } catch (err) {
    console.error('Failed to log admin action:', err)
  }
}
