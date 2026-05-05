import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { queueOutbound } from '@/lib/safety';
import { templates } from '@/lib/templates';
import { firstName } from '@/lib/utils';

export const runtime = 'nodejs';

interface Body {
  club_id: string;
  week_start: string; // ISO date Monday
}

export async function POST(req: Request) {
  const { club_id, week_start } = (await req.json()) as Body;
  if (!club_id || !week_start) {
    return NextResponse.json({ error: 'club_id and week_start required' }, { status: 400 });
  }

  const db = adminClient();
  const weekEnd = new Date(week_start + 'T00:00:00');
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = weekEnd.toISOString().slice(0, 10);

  const { data: club } = await db.from('clubs').select('*').eq('id', club_id).single();
  if (!club) return NextResponse.json({ error: 'club not found' }, { status: 404 });

  const { data: assignments } = await db
    .from('assignments')
    .select('id, trainer_id, sessions!inner(*), trainers!inner(*)')
    .eq('status', 'unassigned')
    .eq('sessions.club_id', club_id)
    .gte('sessions.date', week_start)
    .lte('sessions.date', weekEndIso);

  // group by trainer
  const byTrainer = new Map<string, { trainer: { id: string; full_name: string; phone: string }; rows: { day: string; time: string; program: string; location: string }[]; assignment_ids: string[] }>();
  for (const a of assignments ?? []) {
    const sess = a.sessions as unknown as { date: string; start_time: string; program_name: string; location: string };
    const t = a.trainers as unknown as { id: string; full_name: string; phone: string };
    const day = new Date(sess.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    const time = formatTime(sess.start_time);
    const line = { day, time, program: sess.program_name, location: sess.location };

    const entry = byTrainer.get(t.id) ?? { trainer: t, rows: [], assignment_ids: [] };
    entry.rows.push(line);
    entry.assignment_ids.push(a.id);
    byTrainer.set(t.id, entry);
  }

  let queued = 0;
  for (const { trainer, rows, assignment_ids } of byTrainer.values()) {
    const body = templates.initial(firstName(trainer.full_name), rows, club.name);
    const out = await queueOutbound(db, {
      to_phone: trainer.phone,
      trainer_id: trainer.id,
      club_id,
      body,
      kind: 'initial',
    });
    if (out.ok) {
      await db
        .from('assignments')
        .update({ status: 'notified', notified_at: new Date().toISOString() })
        .in('id', assignment_ids);
      queued++;
    }
  }

  return NextResponse.json({ ok: true, queued, trainers: byTrainer.size });
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  let h = Number(hStr);
  const m = Number(mStr);
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${m.toString().padStart(2, '0')}${ampm}`;
}
