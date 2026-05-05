import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { startCascade } from '@/lib/cascade';

export const runtime = 'nodejs';

interface Base44Payload {
  trainer_phone?: string;
  trainer_id?: string;
  reason?: string;
  session_id?: string;
  // anything else — we accept and log
  [k: string]: unknown;
}

export async function POST(req: Request) {
  const expected = process.env.BASE44_WEBHOOK_SECRET;
  const auth = req.headers.get('authorization');
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: Base44Payload = {};
  try {
    payload = (await req.json()) as Base44Payload;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const db = adminClient();

  // Always log the raw payload to inbound_messages for traceability
  await db.from('inbound_messages').insert({
    from_phone: payload.trainer_phone ?? 'base44',
    body: JSON.stringify(payload).slice(0, 2000),
    intent: 'callout',
    parsed_data: payload as Record<string, unknown>,
    handled: false,
  });

  // Resolve trainer
  let trainerId = payload.trainer_id ?? null;
  if (!trainerId && payload.trainer_phone) {
    const { data: t } = await db
      .from('trainers')
      .select('id')
      .eq('phone', payload.trainer_phone)
      .maybeSingle();
    trainerId = t?.id ?? null;
  }

  if (!trainerId) {
    return NextResponse.json({ ok: true, note: 'no trainer matched, logged only' });
  }

  // Find the assignment to call out — explicit session_id wins, else nearest upcoming
  let assignmentId: string | null = null;
  if (payload.session_id) {
    const { data: a } = await db
      .from('assignments')
      .select('id')
      .eq('trainer_id', trainerId)
      .eq('session_id', payload.session_id)
      .maybeSingle();
    assignmentId = a?.id ?? null;
  }

  if (!assignmentId) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: nearest } = await db
      .from('assignments')
      .select('id, sessions!inner(date, start_time)')
      .eq('trainer_id', trainerId)
      .in('status', ['notified', 'initial_yes', 'confirmed'])
      .gte('sessions.date', today)
      .order('sessions(date)', { ascending: true })
      .limit(1)
      .maybeSingle();
    assignmentId = nearest?.id ?? null;
  }

  if (!assignmentId) {
    return NextResponse.json({ ok: true, note: 'no upcoming assignment for trainer' });
  }

  const result = await startCascade(db, {
    assignment_id: assignmentId,
    source: 'base44',
    reason: payload.reason ?? null,
  });

  return NextResponse.json({ ok: true, ...result });
}
