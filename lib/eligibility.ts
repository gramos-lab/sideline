import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session, Trainer } from './types';

export interface EligibilityScore {
  trainer: Trainer;
  hours_this_week: number;
  last_responded_at: string | null;
}

const CERT_LEVELS = ['', 'USSF E', 'USSF D', 'USSF C', 'USSF B', 'USSF A'];

function certOk(required: string | null | undefined, have: string | null | undefined): boolean {
  if (!required) return true;
  const r = CERT_LEVELS.indexOf(required);
  const h = CERT_LEVELS.indexOf(have ?? '');
  if (r === -1) return true;
  return h >= r;
}

export async function findEligibleBackups(
  db: SupabaseClient,
  session: Session,
  excludeTrainerIds: string[] = [],
): Promise<EligibilityScore[]> {
  const { data: trainers, error } = await db
    .from('trainers')
    .select('*')
    .eq('club_id', session.club_id)
    .eq('active', true);
  if (error) throw error;

  const sessionDate = new Date(session.date + 'T00:00:00');
  const dow = sessionDate.getDay();

  // Recurring availability
  const { data: avail } = await db
    .from('availability_recurring')
    .select('*')
    .eq('day_of_week', dow);

  // Exceptions for that date
  const { data: exceptions } = await db
    .from('availability_exceptions')
    .select('*')
    .eq('date', session.date);

  const availByTrainer = new Map<string, { start_time: string; end_time: string }[]>();
  (avail ?? []).forEach((a) => {
    if (!availByTrainer.has(a.trainer_id)) availByTrainer.set(a.trainer_id, []);
    availByTrainer.get(a.trainer_id)!.push({ start_time: a.start_time, end_time: a.end_time });
  });

  const exceptionByTrainer = new Map<string, { available: boolean; start_time?: string | null; end_time?: string | null }>();
  (exceptions ?? []).forEach((e) => {
    exceptionByTrainer.set(e.trainer_id, e);
  });

  const weekStart = new Date(sessionDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartIso = weekStart.toISOString().slice(0, 10);

  // Hours this week
  const { data: weekAssignments } = await db
    .from('assignments')
    .select('trainer_id, status, sessions!inner(start_time, end_time, date, club_id)')
    .gte('sessions.date', weekStartIso)
    .in('status', ['notified', 'initial_yes', 'confirmed', 'covered']);

  const hoursByTrainer = new Map<string, number>();
  (weekAssignments ?? []).forEach((a: { trainer_id: string; sessions: { start_time: string; end_time: string }[] | { start_time: string; end_time: string } }) => {
    const sess = Array.isArray(a.sessions) ? a.sessions[0] : a.sessions;
    if (!sess) return;
    const dur = durationHours(sess.start_time, sess.end_time);
    hoursByTrainer.set(a.trainer_id, (hoursByTrainer.get(a.trainer_id) ?? 0) + dur);
  });

  const out: EligibilityScore[] = [];
  for (const t of trainers ?? []) {
    if (excludeTrainerIds.includes(t.id)) continue;

    // age group + cert: trainer is eligible if they cover ANY of the session's ages
    const ageOk = (session.age_groups ?? []).some((a) => (t.age_groups ?? []).includes(a));
    if (!ageOk) continue;
    if (!certOk(session.required_cert_level, t.cert_level)) continue;

    // availability
    const exception = exceptionByTrainer.get(t.id);
    if (exception) {
      if (!exception.available) continue;
      if (
        exception.start_time &&
        exception.end_time &&
        !timeOverlaps(
          exception.start_time,
          exception.end_time,
          session.start_time,
          session.end_time,
        )
      ) {
        continue;
      }
    } else {
      const slots = availByTrainer.get(t.id) ?? [];
      const fits = slots.some((s) =>
        timeOverlaps(s.start_time, s.end_time, session.start_time, session.end_time),
      );
      if (!fits) continue;
    }

    // hours cap
    const hours = hoursByTrainer.get(t.id) ?? 0;
    if (hours >= (t.max_hours_week ?? 40)) continue;

    out.push({ trainer: t as Trainer, hours_this_week: hours, last_responded_at: null });
  }

  // sort: priority asc, hours asc, name asc as stable
  out.sort((a, b) => {
    const tier = a.trainer.priority_tier - b.trainer.priority_tier;
    if (tier !== 0) return tier;
    if (a.hours_this_week !== b.hours_this_week)
      return a.hours_this_week - b.hours_this_week;
    return a.trainer.full_name.localeCompare(b.trainer.full_name);
  });

  return out;
}

function durationHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bStart && aEnd >= bEnd;
}
