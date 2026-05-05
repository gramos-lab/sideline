import type { SupabaseClient } from '@supabase/supabase-js';
import { templates } from './templates';

export type SafetyOutcome =
  | { ok: true; mode: 'approved' | 'pending' }
  | { ok: false; reason: string };

export interface QueueArgs {
  to_phone: string;
  trainer_id?: string | null;
  club_id?: string | null;
  body: string;
  kind: 'initial' | 'reminder' | 'cascade' | 'confirmed' | 'standdown' | 'custom';
  related_assignment_id?: string | null;
  related_callout_id?: string | null;
}

export async function queueOutbound(
  db: SupabaseClient,
  args: QueueArgs,
): Promise<SafetyOutcome> {
  // 1) agent kill switch
  const { data: settings } = await db
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (!settings) return { ok: false, reason: 'no settings row' };
  if (!settings.agent_enabled) {
    console.warn('[safety] agent disabled, dropping', args);
    return { ok: false, reason: 'agent disabled' };
  }

  // 3) rate limit (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourCount } = await db
    .from('outbound_messages')
    .select('id', { count: 'exact', head: true })
    .gte('sent_at', oneHourAgo);
  if ((hourCount ?? 0) >= settings.max_outbound_per_hour) {
    console.warn('[safety] rate limit hit');
    return { ok: false, reason: 'rate limit' };
  }

  // 4) loop detection
  const tenAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count: phoneCount } = await db
    .from('outbound_messages')
    .select('id', { count: 'exact', head: true })
    .eq('to_phone', args.to_phone)
    .gte('sent_at', tenAgo);
  if ((phoneCount ?? 0) >= settings.loop_threshold) {
    if (settings.escalation_phone) {
      await db.from('outbound_messages').insert({
        club_id: args.club_id ?? null,
        to_phone: settings.escalation_phone,
        body: templates.loopAlert(args.to_phone),
        kind: 'custom',
        status: 'approved',
      });
    }
    return { ok: false, reason: 'loop detected' };
  }

  // 2) approval mode
  const status = settings.approval_mode ? 'pending' : 'approved';

  await db.from('outbound_messages').insert({
    club_id: args.club_id ?? null,
    to_phone: args.to_phone,
    trainer_id: args.trainer_id ?? null,
    body: args.body,
    kind: args.kind,
    status,
    related_assignment_id: args.related_assignment_id ?? null,
    related_callout_id: args.related_callout_id ?? null,
  });

  return { ok: true, mode: status === 'approved' ? 'approved' : 'pending' };
}
