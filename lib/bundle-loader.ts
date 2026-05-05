import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ActiveCascade,
  AssignmentSlot,
  Club,
  CoverageAttempt,
  InboxItem,
  SessionWithAssignment,
  Trainer,
} from './types';

// JSON-serializable variant of FixtureBundle (Map → object).
export interface SerializableBundle {
  clubs: Club[];
  trainers: Trainer[];
  sessions: SessionWithAssignment[];
  cascades: ActiveCascade[];
  inbox: InboxItem[];
  pendingApprovals: number;
  confirmedAtBySession: Record<string, string>;
}

const ACTIVE_STATUSES = new Set(['notified', 'initial_yes', 'confirmed', 'covered']);

interface DbClub {
  id: string;
  name: string;
  slug: string;
  color: string;
  short: string | null;
  active: boolean;
}
interface DbTrainer {
  id: string;
  club_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  cert_level: string | null;
  age_groups: string[] | null;
  priority_tier: number;
  min_hours_week: number;
  max_hours_week: number;
  active: boolean;
  notes: string | null;
}
interface DbSession {
  id: string;
  club_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_groups: string[];
  program_name: string;
  session_type: 'practice' | 'intramural' | 'tryout' | 'game' | 'camp' | 'clinic';
  required_cert_level: string | null;
  notes: string | null;
}
interface DbAssignment {
  id: string;
  session_id: string;
  trainer_id: string | null;
  status:
    | 'unassigned'
    | 'notified'
    | 'initial_yes'
    | 'confirmed'
    | 'callout'
    | 'covered'
    | 'unfilled';
  assigned_at: string | null;
  notified_at: string | null;
  initial_yes_at: string | null;
  confirmed_at: string | null;
  reminder_sent_at: string | null;
}
interface DbCallout {
  id: string;
  assignment_id: string;
  reported_at: string;
  source: 'quo' | 'base44' | 'manual';
  reason: string | null;
  resolved: boolean;
  resolved_assignment_id: string | null;
}
interface DbCascadeState {
  id: string;
  callout_id: string;
  current_wave: number;
  last_wave_sent_at: string | null;
  status: 'active' | 'resolved' | 'escalated' | 'cancelled';
  updated_at: string;
}
interface DbCoverageAttempt {
  id: string;
  callout_id: string;
  trainer_id: string;
  wave: number;
  sent_at: string | null;
  responded_at: string | null;
  response: 'yes' | 'no' | 'timeout' | null;
}
interface DbInbound {
  id: string;
  club_id: string | null;
  from_phone: string;
  trainer_id: string | null;
  body: string;
  received_at: string;
  intent: string | null;
  handled: boolean;
}
interface DbSystemSettings {
  wave_size: number;
  wave_wait_minutes: number;
  max_waves: number;
}

export async function buildClubBundle(
  db: SupabaseClient,
  clubId: string,
  allClubs: Club[],
): Promise<SerializableBundle> {
  const [
    { data: trainersRaw },
    { data: sessionsRaw },
    { data: settingsRaw },
  ] = await Promise.all([
    db.from('trainers').select('*').eq('club_id', clubId).eq('active', true).order('full_name'),
    db.from('sessions').select('*').eq('club_id', clubId).order('date').order('start_time'),
    db.from('system_settings').select('*').eq('id', 1).single(),
  ]);

  const trainers = (trainersRaw ?? []) as DbTrainer[];
  const sessions = (sessionsRaw ?? []) as DbSession[];
  const settings = settingsRaw as DbSystemSettings | null;

  const sessionIds = sessions.map((s) => s.id);
  const { data: assignmentsRaw } = sessionIds.length
    ? await db.from('assignments').select('*').in('session_id', sessionIds)
    : { data: [] as DbAssignment[] };
  const assignments = (assignmentsRaw ?? []) as DbAssignment[];

  const assignmentIds = assignments.map((a) => a.id);
  const { data: calloutsRaw } = assignmentIds.length
    ? await db
        .from('callouts')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('resolved', false)
    : { data: [] as DbCallout[] };
  const callouts = (calloutsRaw ?? []) as DbCallout[];

  const calloutIds = callouts.map((c) => c.id);
  const [{ data: cascadeStatesRaw }, { data: attemptsRaw }] = await Promise.all([
    calloutIds.length
      ? db.from('cascade_state').select('*').in('callout_id', calloutIds).eq('status', 'active')
      : Promise.resolve({ data: [] as DbCascadeState[] }),
    calloutIds.length
      ? db.from('coverage_attempts').select('*').in('callout_id', calloutIds).order('wave')
      : Promise.resolve({ data: [] as DbCoverageAttempt[] }),
  ]);
  const cascadeStates = (cascadeStatesRaw ?? []) as DbCascadeState[];
  const attempts = (attemptsRaw ?? []) as DbCoverageAttempt[];

  const [{ data: inboxRaw }, { count: pendingApprovalsCount }] = await Promise.all([
    db
      .from('inbound_messages')
      .select('*')
      .eq('club_id', clubId)
      .eq('handled', false)
      .order('received_at', { ascending: false })
      .limit(20),
    db
      .from('outbound_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('club_id', clubId),
  ]);
  const inboxRows = (inboxRaw ?? []) as DbInbound[];
  const pendingApprovals = pendingApprovalsCount ?? 0;

  const trainerById = new Map(trainers.map((t) => [t.id, t]));
  const hoursByTrainer = computeHoursByTrainer(assignments, sessions);

  const enrich = (t: DbTrainer): Trainer => ({
    id: t.id,
    club_id: t.club_id,
    full_name: t.full_name,
    first_name: t.full_name.split(' ')[0],
    phone: t.phone,
    email: t.email,
    cert_level: t.cert_level,
    age_groups: t.age_groups ?? [],
    priority_tier: t.priority_tier,
    min_hours_week: t.min_hours_week,
    max_hours_week: t.max_hours_week,
    active: t.active,
    notes: t.notes,
    reliability: 0.9,
    hours_this_week: hoursByTrainer.get(t.id) ?? 0,
  });

  const sessionsWithSlots: SessionWithAssignment[] = sessions.map((s) => {
    const slots: AssignmentSlot[] = assignments
      .filter((a) => a.session_id === s.id)
      .map((a) => {
        const dbT = a.trainer_id ? trainerById.get(a.trainer_id) ?? null : null;
        const trainer = dbT ? enrich(dbT) : null;
        const inCallout = a.status === 'callout';
        return {
          assignment: {
            id: a.id,
            session_id: a.session_id,
            trainer_id: a.trainer_id,
            status: a.status,
            assigned_at: a.assigned_at ?? undefined,
            notified_at: a.notified_at,
            initial_yes_at: a.initial_yes_at,
            confirmed_at: a.confirmed_at,
            reminder_sent_at: a.reminder_sent_at,
            prior_trainer_id: null,
          },
          trainer,
          prior_trainer: inCallout ? trainer : null,
        };
      });
    return { session: { ...s }, assignments: slots };
  });

  const enrichedCascades: ActiveCascade[] = cascadeStates
    .map((cs): ActiveCascade | null => {
      const callout = callouts.find((co) => co.id === cs.callout_id);
      if (!callout) return null;
      const assignment = assignments.find((a) => a.id === callout.assignment_id);
      if (!assignment) return null;
      const session = sessions.find((s) => s.id === assignment.session_id);
      if (!session) return null;
      const originalDb = assignment.trainer_id
        ? trainerById.get(assignment.trainer_id) ?? null
        : null;
      const myAttempts = attempts.filter((a) => a.callout_id === callout.id);
      const attemptedTrainers = myAttempts
        .map((a) => trainerById.get(a.trainer_id))
        .filter((t): t is DbTrainer => Boolean(t))
        .map(enrich);

      const lastSent = cs.last_wave_sent_at ? new Date(cs.last_wave_sent_at) : null;
      const waitMin = settings?.wave_wait_minutes ?? 4;
      const nextWave =
        lastSent && cs.status === 'active'
          ? new Date(lastSent.getTime() + waitMin * 60 * 1000).toISOString()
          : null;

      const cleanAttempts: CoverageAttempt[] = myAttempts.map((a) => ({
        trainer_id: a.trainer_id,
        wave: a.wave,
        response: a.response,
        responded_at: a.responded_at,
      }));

      return {
        cascade: {
          id: cs.id,
          callout_id: cs.callout_id,
          current_wave: cs.current_wave,
          last_wave_sent_at: cs.last_wave_sent_at,
          status: cs.status,
          updated_at: cs.updated_at,
        },
        callout: {
          id: callout.id,
          assignment_id: callout.assignment_id,
          reported_at: callout.reported_at,
          source: callout.source,
          reason: callout.reason,
          resolved: callout.resolved,
          resolved_assignment_id: callout.resolved_assignment_id,
        },
        session,
        original_trainer: originalDb ? enrich(originalDb) : null,
        attempted_trainers: attemptedTrainers,
        attempts: cleanAttempts,
        max_waves: settings?.max_waves ?? 3,
        wave_size: settings?.wave_size ?? 3,
        reason: callout.reason,
        reported_at_human: humanAgo(callout.reported_at),
        next_wave_at: nextWave,
      };
    })
    .filter((x): x is ActiveCascade => Boolean(x));

  const inboxItems: InboxItem[] = inboxRows.map((i) => {
    const t = i.trainer_id ? trainerById.get(i.trainer_id) ?? null : null;
    return {
      id: i.id,
      trainer: t ? enrich(t) : null,
      from_phone: i.from_phone,
      body: i.body,
      received_at: humanAgo(i.received_at),
      intent: (i.intent ?? undefined) as InboxItem['intent'],
    };
  });

  const confirmedAtBySession: Record<string, string> = {};
  for (const a of assignments) {
    if (a.status === 'confirmed' && a.confirmed_at) {
      confirmedAtBySession[a.session_id] = humanShort(new Date(a.confirmed_at));
    }
  }

  return {
    clubs: allClubs,
    trainers: trainers.map(enrich),
    sessions: sessionsWithSlots,
    cascades: enrichedCascades,
    inbox: inboxItems,
    pendingApprovals,
    confirmedAtBySession,
  };
}

export async function buildAllClubsBundle(
  db: SupabaseClient,
  allClubs: Club[],
): Promise<SerializableBundle> {
  const bundles = await Promise.all(allClubs.map((c) => buildClubBundle(db, c.id, allClubs)));
  return {
    clubs: allClubs,
    trainers: bundles.flatMap((b) => b.trainers),
    sessions: bundles
      .flatMap((b) => b.sessions)
      .sort((a, b) => {
        if (a.session.date !== b.session.date) return a.session.date.localeCompare(b.session.date);
        return a.session.start_time.localeCompare(b.session.start_time);
      }),
    cascades: bundles.flatMap((b) => b.cascades),
    inbox: bundles.flatMap((b) => b.inbox),
    pendingApprovals: bundles.reduce((s, b) => s + b.pendingApprovals, 0),
    confirmedAtBySession: bundles.reduce<Record<string, string>>(
      (acc, b) => Object.assign(acc, b.confirmedAtBySession),
      {},
    ),
  };
}

function computeHoursByTrainer(
  assignments: DbAssignment[],
  sessions: DbSession[],
): Map<string, number> {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + (dow === 0 ? -6 : 1 - dow));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const lo = monday.toISOString().slice(0, 10);
  const hi = sunday.toISOString().slice(0, 10);

  const out = new Map<string, number>();
  for (const a of assignments) {
    if (!a.trainer_id) continue;
    if (!ACTIVE_STATUSES.has(a.status)) continue;
    const s = sessionById.get(a.session_id);
    if (!s) continue;
    if (s.date < lo || s.date > hi) continue;
    const dur = durationHours(s.start_time, s.end_time);
    out.set(a.trainer_id, (out.get(a.trainer_id) ?? 0) + dur);
  }
  return out;
}

function durationHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function humanAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function humanShort(d: Date): string {
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh = ((h + 11) % 12) + 1;
  return `${day} ${hh}:${m.toString().padStart(2, '0')}${ampm}`;
}
