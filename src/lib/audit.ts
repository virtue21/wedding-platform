import { createClient as createServiceClient } from '@supabase/supabase-js'

type AuditEntry = {
  actorType: 'couple' | 'guest' | 'superadmin' | 'system'
  actorId?: string | null
  action: string
  weddingId?: string | null
  detail?: Record<string, unknown>
}

/**
 * Write an audit log entry. Fire-and-forget: failures are logged
 * to the console but never thrown, so audit logging can never
 * break the action it records.
 */
export async function logAudit(entry: AuditEntry) {
  try {
    // Untyped client: audit_logs isn't in the generated Database types yet.
    const sb = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await sb.from('audit_logs').insert({
      actor_type: entry.actorType,
      actor_id: entry.actorId ?? null,
      action: entry.action,
      wedding_id: entry.weddingId ?? null,
      detail: entry.detail ?? null,
    })
    if (error) console.error('[audit] insert failed:', error.message)
  } catch (err) {
    console.error('[audit] failed:', err)
  }
}
