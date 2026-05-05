import type { SupabaseClient } from '@supabase/supabase-js';
import { findEligibleBackups } from './eligibility';
import { queueOutbound } from './safety';
import { templates, type SessionLine } from './templates';
import { firstName } from './utils';

interface DbSession {
  id: string;
  club_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_groups: string[];
  program_name: string;
  required_cert_level: string | null;
  session_type: string;
}

interface DbAssignment {
  id: string;
  session_id: string;
  trainer_id: string;
  status: string;
}

function sessionLine(s: DbSession): SessionLine {
  const day = new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 || 12;
    return m === 0 ? `${hh}${ampm}` : `${hh}:${m.toString().padStart(2, '0')}${ampm}`;
  };
  return {
    day,
    time: fmt(s.start_time),
    program: s.program_name,
    location: s.location,
  };
}

export async function startCascade(
  db: SupabaseClient,
  args: { assignment_id: string; source: 'quo' | 'base44' | 'manual'; reason?: string | null },
): Promise<{ callout_id: string; cascade_id: string }> {
  // mark callout
  const { data: assignment } = await db
    .from('assignments')
    .select('*, sessions(*), trainers(*)')
    .eq('id', args.assignment_id)
    .single();
  if (!assignment) throw new Error('assignment not found');

  const session = assignment.sessions as DbSession;

  await db
    .from('assignments')
    .update({ status: 'callout' })
    .eq('id', args.assignment_id);

  const { data: callout, error: coErr } = await db
    .from('callouts')
    .insert({
      assignment_id: args.assignment_id,
      source: args.source,
      reason: args.reason ?? null,
    })
    .select('*')
    .single();
  if (coErr) throw coErr;

  const { data: cascade, error: csErr } = await db
    .from('cascade_state')
    .insert({ callout_id: callout.id, current_wave: 1, last_wave_sent_at: new Date().toISOString() })
    .select('*')
    .single();
  if (csErr) throw csErr;

  await sendNextWave(db, cascade.id);

  return { callout_id: callout.id, cascade_id: cascade.id };
}

export async function sendNextWave(
  db: SupabaseClient,
  cascade_id: string,
): Promise<{ sent: number; status: 'active' | 'escalated' }> {
  const { data: cascade } = await db
    .from('cascade_state')
    .select('*, callouts!inner(*, assignments!inner(*, sessions(*), trainers(*)))')
    .eq('id', cascade_id)
    .single();

  if (!cascade) throw new Error('cascade not found');
  if (cascade.status !== 'active') return { sent: 0, status: cascade.status };

  const callout = cascade.callouts;
  const assignment = callout.assignments;
  const session = assignment.sessions as DbSession;

  const { data: settings } = await db.from('system_settings').select('*').eq('id', 1).single();
  if (!settings) throw new Error('no settings');

  if (cascade.current_wave > settings.max_waves) {
    await db
      .from('cascade_state')
      .update({ status: 'escalated', updated_at: new Date().toISOString() })
      .eq('id', cascade_id);
    if (settings.escalation_phone) {
      await db.from('outbound_messages').insert({
        club_id: session.club_id,
        to_phone: settings.escalation_phone,
        body: `Sideline: cascade exhausted for ${session.program_name} ${session.date} ${session.start_time}. No backup found.`,
        kind: 'custom',
        status: 'approved',
        related_callout_id: callout.id,
      });
    }
    return { sent: 0, status: 'escalated' };
  }

  // who's been attempted already?
  const { data: attempted } = await db
    .from('coverage_attempts')
    .select('trainer_id')
    .eq('callout_id', callout.id);
  const attemptedIds = (attempted ?? []).map((a) => a.trainer_id);

  const eligible = await findEligibleBackups(
    db,
    session as unknown as Parameters<typeof findEligibleBackups>[1],
    [assignment.trainer_id, ...attemptedIds],
  );
  const wave = eligible.slice(0, settings.wave_size);

  for (const e of wave) {
    const fname = firstName(e.trainer.full_name);
    const club = await getClubName(db, session.club_id);
    const body = templates.cascadeAsk(fname, sessionLine(session), club);

    await db.from('coverage_attempts').insert({
      callout_id: callout.id,
      trainer_id: e.trainer.id,
      wave: cascade.current_wave,
    });

    await queueOutbound(db, {
      to_phone: e.trainer.phone,
      trainer_id: e.trainer.id,
      club_id: session.club_id,
      body,
      kind: 'cascade',
      related_callout_id: callout.id,
    });
  }

  await db
    .from('cascade_state')
    .update({
      last_wave_sent_at: new Date().toISOString(),
      current_wave: cascade.current_wave + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cascade_id);

  return { sent: wave.length, status: 'active' };
}

export async function resolveCascadeWithYes(
  db: SupabaseClient,
  args: { callout_id: string; trainer_id: string },
): Promise<void> {
  const { data: callout } = await db
    .from('callouts')
    .select('*, assignments!inner(*, sessions(*))')
    .eq('id', args.callout_id)
    .single();
  if (!callout) throw new Error('callout not found');
  if (callout.resolved) return;

  const assignment = callout.assignments;
  const session = assignment.sessions as DbSession;

  // create new confirmed assignment
  const { data: newAssign, error } = await db
    .from('assignments')
    .insert({
      session_id: assignment.session_id,
      trainer_id: args.trainer_id,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;

  // mark old as covered
  await db
    .from('assignments')
    .update({ status: 'covered' })
    .eq('id', assignment.id);

  await db
    .from('callouts')
    .update({ resolved: true, resolved_assignment_id: newAssign.id })
    .eq('id', args.callout_id);

  await db
    .from('cascade_state')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('callout_id', args.callout_id);

  // confirmation text to backup
  const { data: backup } = await db.from('trainers').select('*').eq('id', args.trainer_id).single();
  if (backup) {
    const club = await getClubName(db, session.club_id);
    await queueOutbound(db, {
      to_phone: backup.phone,
      trainer_id: backup.id,
      club_id: session.club_id,
      body: templates.cascadeConfirmed(firstName(backup.full_name), sessionLine(session), club),
      kind: 'confirmed',
      related_assignment_id: newAssign.id,
    });
  }

  // stand-down to other attempted trainers
  const { data: attempts } = await db
    .from('coverage_attempts')
    .select('trainer_id, response')
    .eq('callout_id', args.callout_id);

  for (const a of attempts ?? []) {
    if (a.trainer_id === args.trainer_id) continue;
    if (a.response === 'yes') continue;
    const { data: t } = await db.from('trainers').select('*').eq('id', a.trainer_id).single();
    if (!t) continue;
    const club = await getClubName(db, session.club_id);
    await queueOutbound(db, {
      to_phone: t.phone,
      trainer_id: t.id,
      club_id: session.club_id,
      body: templates.cascadeStandDown(firstName(t.full_name), club),
      kind: 'standdown',
      related_callout_id: args.callout_id,
    });
  }
}

async function getClubName(db: SupabaseClient, club_id: string): Promise<string> {
  const { data } = await db.from('clubs').select('name').eq('id', club_id).single();
  return data?.name ?? 'Sideline';
}
