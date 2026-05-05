import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { parseQuoWebhook, verifyQuoSignature } from '@/lib/quo';
import { classifyIntent } from '@/lib/claude';
import { startCascade, resolveCascadeWithYes } from '@/lib/cascade';
import { templates } from '@/lib/templates';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-quo-signature');
  const ok = await verifyQuoSignature(raw, signature);
  if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let inbound;
  try {
    inbound = parseQuoWebhook(payload);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  const db = adminClient();

  // find trainer by phone
  const { data: trainer } = await db
    .from('trainers')
    .select('*')
    .eq('phone', inbound.fromPhone)
    .maybeSingle();

  // log inbound
  const { data: logged } = await db
    .from('inbound_messages')
    .insert({
      from_phone: inbound.fromPhone,
      trainer_id: trainer?.id ?? null,
      club_id: trainer?.club_id ?? null,
      body: inbound.body,
      received_at: inbound.receivedAt.toISOString(),
    })
    .select('*')
    .single();

  // Unknown sender — never auto-respond, escalate
  if (!trainer) {
    const { data: settings } = await db.from('system_settings').select('*').eq('id', 1).single();
    if (settings?.escalation_phone) {
      await db.from('outbound_messages').insert({
        to_phone: settings.escalation_phone,
        body: templates.unknownSenderEscalation(inbound.fromPhone, inbound.body),
        kind: 'custom',
        status: 'approved',
      });
    }
    return NextResponse.json({ ok: true, intent: 'unknown_sender' });
  }

  // recent outbound to trainer
  const { data: recentOutbound } = await db
    .from('outbound_messages')
    .select('*')
    .eq('trainer_id', trainer.id)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // upcoming assignments
  const { data: upcoming } = await db
    .from('assignments')
    .select('*, sessions(*)')
    .eq('trainer_id', trainer.id)
    .in('status', ['notified', 'initial_yes', 'confirmed']);

  const cls = await classifyIntent(inbound.body, {
    trainer,
    recentOutbound: recentOutbound ?? null,
    upcomingAssignments: upcoming ?? [],
  });

  await db
    .from('inbound_messages')
    .update({ intent: cls.intent, parsed_data: cls.parsed, handled: true, handled_by: 'agent' })
    .eq('id', logged?.id);

  // Confirmation YES
  if (cls.intent === 'confirmation') {
    // figure out which assignment to flip — look at recent notified/initial_yes assignments
    const { data: pending } = await db
      .from('assignments')
      .select('*, sessions(*)')
      .eq('trainer_id', trainer.id)
      .in('status', ['notified', 'initial_yes'])
      .order('sessions(date)', { ascending: true });

    if (pending && pending.length > 0) {
      // If the most recent outbound was for a cascade, resolve it
      if (recentOutbound?.kind === 'cascade' && recentOutbound.related_callout_id) {
        await resolveCascadeWithYes(db, {
          callout_id: recentOutbound.related_callout_id,
          trainer_id: trainer.id,
        });
      } else if (recentOutbound?.kind === 'reminder') {
        // mark all relevant initial_yes -> confirmed
        await db
          .from('assignments')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('id', pending[0].id);
      } else {
        // initial yes
        await db
          .from('assignments')
          .update({ status: 'initial_yes', initial_yes_at: new Date().toISOString() })
          .eq('id', pending[0].id);
      }
    }
  }

  // Callout / NO
  if (cls.intent === 'callout') {
    // find next assignment they're on the hook for
    const { data: pending } = await db
      .from('assignments')
      .select('*, sessions(*)')
      .eq('trainer_id', trainer.id)
      .in('status', ['notified', 'initial_yes', 'confirmed'])
      .order('sessions(date)', { ascending: true })
      .limit(1);
    if (pending && pending.length > 0) {
      await startCascade(db, {
        assignment_id: pending[0].id,
        source: 'quo',
        reason: typeof cls.parsed.reason === 'string' ? cls.parsed.reason : null,
      });
    }
  }

  return NextResponse.json({ ok: true, intent: cls.intent, confidence: cls.confidence });
}
