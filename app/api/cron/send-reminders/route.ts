import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { queueOutbound } from '@/lib/safety';
import { templates } from '@/lib/templates';
import { firstName } from '@/lib/utils';

export const runtime = 'nodejs';

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = adminClient();

  const { data: settings } = await db.from('system_settings').select('*').eq('id', 1).single();
  const hoursBefore = settings?.reminder_hours_before ?? 24;

  // window: sessions starting between (hoursBefore - 2) and (hoursBefore + 2) hours from now
  const lower = new Date(Date.now() + (hoursBefore - 2) * 3600 * 1000);
  const upper = new Date(Date.now() + (hoursBefore + 2) * 3600 * 1000);

  const { data: candidates } = await db
    .from('assignments')
    .select('id, status, reminder_sent_at, session_id, trainer_id, sessions(*), trainers(*), clubs:sessions(clubs(*))')
    .eq('status', 'initial_yes')
    .is('reminder_sent_at', null);

  let queued = 0;
  for (const a of candidates ?? []) {
    const sess = a.sessions as unknown as { date: string; start_time: string; end_time: string; program_name: string; location: string; club_id: string } | null;
    if (!sess) continue;
    const startISO = new Date(`${sess.date}T${sess.start_time}`);
    if (startISO < lower || startISO > upper) continue;

    const trainer = a.trainers as unknown as { id: string; full_name: string; phone: string };
    const { data: club } = await db
      .from('clubs')
      .select('name')
      .eq('id', sess.club_id)
      .single();

    const time = formatTime(sess.start_time);
    const body = templates.reminder(
      firstName(trainer.full_name),
      { day: 'Tomorrow', time, program: sess.program_name, location: sess.location },
      club?.name ?? 'Sideline',
    );

    await queueOutbound(db, {
      to_phone: trainer.phone,
      trainer_id: trainer.id,
      club_id: sess.club_id,
      body,
      kind: 'reminder',
      related_assignment_id: a.id,
    });

    await db
      .from('assignments')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', a.id);

    queued++;
  }

  return NextResponse.json({ ok: true, queued });
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  let h = Number(hStr);
  const m = Number(mStr);
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${m.toString().padStart(2, '0')}${ampm}`;
}
