import {
  ActiveCascade,
  Assignment,
  AssignmentSlot,
  Club,
  CoverageAttempt,
  InboxItem,
  Session,
  SessionWithAssignment,
  Trainer,
} from './types';
import { addDays, startOfWeek, toISODate } from './utils';

const now = new Date();
const weekStart = startOfWeek(now);

const clubs: Club[] = [
  { id: 'club-nal', name: 'RSG NAL', slug: 'rsg-nal', color: '#1E40AF', short: 'NAL', active: true },
  { id: 'club-msc', name: 'Manhasset SC', slug: 'msc', color: '#0F766E', short: 'MSC', active: true },
];

function mkTrainer(p: Partial<Trainer> & { id: string; club_id: string; full_name: string; phone: string; tier: number; cert: string; ageGroups: string[]; hours: number; reliability: number }): Trainer {
  return {
    id: p.id,
    club_id: p.club_id,
    full_name: p.full_name,
    first_name: p.full_name.split(' ')[0],
    phone: p.phone,
    cert_level: p.cert,
    age_groups: p.ageGroups,
    priority_tier: p.tier,
    min_hours_week: 0,
    max_hours_week: 22,
    active: true,
    reliability: p.reliability / 100,
    hours_this_week: p.hours,
  };
}

const nalTrainers: Trainer[] = [
  mkTrainer({ id: 't1', club_id: 'club-nal', full_name: 'Maria Alvarez',  phone: '+15550101001', tier: 1, cert: 'USSF C', ageGroups: ['U10','U11','U12'], hours: 8,  reliability: 96 }),
  mkTrainer({ id: 't2', club_id: 'club-nal', full_name: 'Carlos Rivera',  phone: '+15550101002', tier: 1, cert: 'USSF C', ageGroups: ['U10','U11'],       hours: 6,  reliability: 92 }),
  mkTrainer({ id: 't3', club_id: 'club-nal', full_name: 'Tina Park',      phone: '+15550101003', tier: 2, cert: 'USSF D', ageGroups: ['U10','U11','U12'], hours: 4,  reliability: 88 }),
  mkTrainer({ id: 't4', club_id: 'club-nal', full_name: 'Sam Whitman',    phone: '+15550101004', tier: 1, cert: 'USSF C', ageGroups: ['U11','U12'],       hours: 10, reliability: 94 }),
  mkTrainer({ id: 't5', club_id: 'club-nal', full_name: 'Jordan Lee',     phone: '+15550101005', tier: 2, cert: 'USSF D', ageGroups: ['U10'],             hours: 2,  reliability: 90 }),
  mkTrainer({ id: 't6', club_id: 'club-nal', full_name: 'Devon Walsh',    phone: '+15550101006', tier: 3, cert: 'USSF E', ageGroups: ['U10','U11'],       hours: 0,  reliability: 81 }),
  mkTrainer({ id: 't7', club_id: 'club-nal', full_name: 'Priya Shah',     phone: '+15550101007', tier: 2, cert: 'USSF D', ageGroups: ['U12'],             hours: 5,  reliability: 89 }),
];

const mscTrainers: Trainer[] = [
  mkTrainer({ id: 'm1', club_id: 'club-msc', full_name: 'Andre Bell',     phone: '+15550102001', tier: 1, cert: 'USSF C', ageGroups: ['U10','U11','U12'], hours: 7, reliability: 95 }),
  mkTrainer({ id: 'm2', club_id: 'club-msc', full_name: 'Lia Romano',     phone: '+15550102002', tier: 1, cert: 'USSF C', ageGroups: ['U11','U12'],       hours: 9, reliability: 97 }),
  mkTrainer({ id: 'm3', club_id: 'club-msc', full_name: 'Henry Cho',      phone: '+15550102003', tier: 2, cert: 'USSF D', ageGroups: ['U10','U11'],       hours: 4, reliability: 86 }),
];

interface SessionSeed {
  id: string;
  dayOffset: number; // 0..6 from Monday
  start: string;
  end: string;
  program: string;
  location: string;
  ages: string[];
  type: Session['session_type'];
}

function mkSession(s: SessionSeed, club_id: string): Session {
  return {
    id: s.id,
    club_id,
    date: toISODate(addDays(weekStart, s.dayOffset)),
    start_time: s.start,
    end_time: s.end,
    location: s.location,
    age_groups: s.ages,
    program_name: s.program,
    session_type: s.type,
    required_cert_level: null,
    notes: null,
  };
}

const nalSeeds: SessionSeed[] = [
  { id: 's1',  dayOffset: 0, start: '16:00', end: '17:30', program: 'U10 Intramural', location: 'Memorial', ages: ['U10'], type: 'intramural' },
  { id: 's2',  dayOffset: 0, start: '17:30', end: '19:00', program: 'U11 Practice',   location: 'Memorial', ages: ['U11'], type: 'practice' },
  { id: 's3',  dayOffset: 0, start: '19:00', end: '20:30', program: 'U12 Practice',   location: 'Whitney',  ages: ['U12'], type: 'practice' },
  { id: 's4',  dayOffset: 1, start: '16:30', end: '18:00', program: 'U10 Intramural', location: 'Memorial', ages: ['U10'], type: 'intramural' },
  { id: 's5',  dayOffset: 1, start: '18:00', end: '19:30', program: 'U11 Practice',   location: 'Whitney',  ages: ['U11'], type: 'practice' },
  { id: 's6',  dayOffset: 1, start: '19:30', end: '21:00', program: 'U12 Tryout',     location: 'Whitney',  ages: ['U12'], type: 'tryout' },
  { id: 's7',  dayOffset: 2, start: '17:00', end: '18:30', program: 'U10 Practice',   location: 'Memorial', ages: ['U10'], type: 'practice' },
  { id: 's8',  dayOffset: 2, start: '18:00', end: '19:30', program: 'U11 Practice',   location: 'Memorial', ages: ['U11'], type: 'practice' },
  { id: 's9',  dayOffset: 2, start: '19:30', end: '21:00', program: 'U12 Practice',   location: 'Whitney',  ages: ['U12'], type: 'practice' },
  { id: 's10', dayOffset: 3, start: '16:30', end: '18:00', program: 'U10 Intramural', location: 'Memorial', ages: ['U10'], type: 'intramural' },
  { id: 's11', dayOffset: 3, start: '18:00', end: '19:30', program: 'U11 Practice',   location: 'Whitney',  ages: ['U11'], type: 'practice' },
  { id: 's12', dayOffset: 3, start: '19:30', end: '21:00', program: 'U12 Practice',   location: 'Whitney',  ages: ['U12'], type: 'practice' },
  { id: 's13', dayOffset: 4, start: '17:00', end: '18:30', program: 'U10 Practice',   location: 'Memorial', ages: ['U10'], type: 'practice' },
  { id: 's14', dayOffset: 4, start: '18:30', end: '20:00', program: 'U12 Tryout',     location: 'Whitney',  ages: ['U12'], type: 'tryout' },
  { id: 's15', dayOffset: 5, start: '09:00', end: '10:30', program: 'U10 Game',       location: 'Memorial', ages: ['U10'], type: 'game' },
  { id: 's16', dayOffset: 5, start: '10:30', end: '12:00', program: 'U11 Game',       location: 'Memorial', ages: ['U11'], type: 'game' },
  { id: 's17', dayOffset: 5, start: '12:00', end: '13:30', program: 'U12 Game',       location: 'Whitney',  ages: ['U12'], type: 'game' },
  // Demo: a camp spanning U5–U12 to show multi-age + Camp type.
  { id: 's18', dayOffset: 6, start: '09:00', end: '12:00', program: 'Holiday Camp',   location: 'Memorial', ages: ['U5','U6','U7','U8','U9','U10','U11','U12'], type: 'camp' },
];

const mscSeeds: SessionSeed[] = [
  { id: 'x1', dayOffset: 1, start: '17:00', end: '18:30', program: 'U10 Intramural', location: 'Schreiber', ages: ['U10'], type: 'intramural' },
  { id: 'x2', dayOffset: 2, start: '18:00', end: '19:30', program: 'U11 Practice',   location: 'Schreiber', ages: ['U11'], type: 'practice' },
  { id: 'x3', dayOffset: 3, start: '17:00', end: '18:30', program: 'U10 Practice',   location: 'Plandome',  ages: ['U10'], type: 'practice' },
  { id: 'x4', dayOffset: 5, start: '09:00', end: '10:30', program: 'U12 Game',       location: 'Schreiber', ages: ['U12'], type: 'game' },
  { id: 'x5', dayOffset: 4, start: '17:30', end: '19:00', program: 'Goalkeeper Clinic', location: 'Schreiber', ages: ['U10','U11','U12'], type: 'clinic' },
];

interface AssignmentSeed {
  session_id: string;
  trainer_id: string | null;
  status: Assignment['status'];
  prior_trainer_id?: string;
  confirmed_at_human?: string;
}

const nalAssignSeeds: AssignmentSeed[] = [
  // Session s1 has TWO trainers — demo of multi-trainer assignment.
  { session_id: 's1',  trainer_id: 't1', status: 'confirmed',   confirmed_at_human: 'Sun 7:51pm' },
  { session_id: 's1',  trainer_id: 't3', status: 'initial_yes' },
  { session_id: 's2',  trainer_id: 't2', status: 'confirmed',   confirmed_at_human: 'Sun 8:02pm' },
  { session_id: 's3',  trainer_id: 't4', status: 'initial_yes' },
  { session_id: 's4',  trainer_id: 't1', status: 'confirmed',   confirmed_at_human: 'Mon 9:14am' },
  { session_id: 's5',  trainer_id: 't3', status: 'notified' },
  { session_id: 's6',  trainer_id: null, status: 'unassigned' },
  { session_id: 's7',  trainer_id: 't5', status: 'confirmed',   confirmed_at_human: 'Tue 6:30pm' },
  { session_id: 's8',  trainer_id: 't4', status: 'callout',     prior_trainer_id: 't4' },
  { session_id: 's9',  trainer_id: 't2', status: 'initial_yes' },
  { session_id: 's10', trainer_id: 't1', status: 'notified' },
  { session_id: 's11', trainer_id: null, status: 'unfilled' },
  { session_id: 's12', trainer_id: 't7', status: 'initial_yes' },
  { session_id: 's13', trainer_id: 't3', status: 'notified' },
  { session_id: 's14', trainer_id: null, status: 'unassigned' },
  { session_id: 's15', trainer_id: 't1', status: 'confirmed',   confirmed_at_human: 'Fri 4:12pm' },
  { session_id: 's16', trainer_id: 't2', status: 'confirmed',   confirmed_at_human: 'Fri 4:18pm' },
  { session_id: 's17', trainer_id: 't4', status: 'initial_yes' },
];

const mscAssignSeeds: AssignmentSeed[] = [
  { session_id: 'x1', trainer_id: 'm1', status: 'confirmed', confirmed_at_human: 'Mon 11:02am' },
  { session_id: 'x2', trainer_id: 'm2', status: 'initial_yes' },
  { session_id: 'x3', trainer_id: null, status: 'unassigned' },
  { session_id: 'x4', trainer_id: 'm2', status: 'notified' },
];

function buildAssignment(seed: AssignmentSeed, idx: number): Assignment {
  return {
    id: `a-${seed.session_id}-${idx}`,
    session_id: seed.session_id,
    trainer_id: seed.trainer_id,
    status: seed.status,
    prior_trainer_id: seed.prior_trainer_id ?? null,
    assigned_at: now.toISOString(),
    notified_at: seed.status !== 'unassigned' ? now.toISOString() : null,
    initial_yes_at: ['initial_yes', 'confirmed'].includes(seed.status) ? now.toISOString() : null,
    confirmed_at: seed.status === 'confirmed' ? now.toISOString() : null,
  };
}

// store the human-readable confirmedAt on the row for display
type ConfirmTime = Map<string, string>;
const nalConfirmTimes: ConfirmTime = new Map();
const mscConfirmTimes: ConfirmTime = new Map();
nalAssignSeeds.forEach((a) => a.confirmed_at_human && nalConfirmTimes.set(a.session_id, a.confirmed_at_human));
mscAssignSeeds.forEach((a) => a.confirmed_at_human && mscConfirmTimes.set(a.session_id, a.confirmed_at_human));

const nalSessions = nalSeeds.map((s) => mkSession(s, 'club-nal'));
const mscSessions = mscSeeds.map((s) => mkSession(s, 'club-msc'));
const nalAssignments = nalAssignSeeds.map((s, i) => buildAssignment(s, i));
const mscAssignments = mscAssignSeeds.map((s, i) => buildAssignment(s, i));

const nalCascadeAttempts: CoverageAttempt[] = [
  { trainer_id: 't2', wave: 1, response: 'no',      responded_at: '8 min ago' },
  { trainer_id: 't1', wave: 1, response: 'timeout', responded_at: null },
  { trainer_id: 't3', wave: 1, response: 'no',      responded_at: '6 min ago' },
  { trainer_id: 't5', wave: 2, response: null,      responded_at: null },
  { trainer_id: 't7', wave: 2, response: null,      responded_at: null },
  { trainer_id: 't6', wave: 2, response: null,      responded_at: null },
];

const cascades: ActiveCascade[] = [
  {
    cascade: {
      id: 'cs-1',
      callout_id: 'co-1',
      current_wave: 2,
      last_wave_sent_at: new Date(Date.now() - 1000 * 60 * 1.7).toISOString(),
      status: 'active',
      updated_at: now.toISOString(),
    },
    callout: {
      id: 'co-1',
      assignment_id: 'a-s8',
      reported_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      source: 'quo',
      reason: 'stuck at work',
      resolved: false,
    },
    session: nalSessions[7], // s8
    original_trainer: nalTrainers[3], // Sam (t4)
    attempted_trainers: nalCascadeAttempts
      .map((a) => nalTrainers.find((t) => t.id === a.trainer_id)!)
      .filter(Boolean),
    attempts: nalCascadeAttempts,
    max_waves: 3,
    wave_size: 3,
    reason: 'stuck at work',
    reported_at_human: '12 min ago',
    next_wave_at: new Date(Date.now() + 1000 * 134).toISOString(),
  },
];

const nalInbox: InboxItem[] = [
  {
    id: 'i1',
    trainer: nalTrainers[2],
    from_phone: nalTrainers[2].phone,
    body: "what's the address for whitney?",
    received_at: '18 min ago',
    intent: 'question',
  },
  {
    id: 'i2',
    trainer: nalTrainers[4],
    from_phone: nalTrainers[4].phone,
    body: 'running 10 min late tomorrow',
    received_at: '42 min ago',
    intent: 'availability',
  },
];

const mscInbox: InboxItem[] = [
  {
    id: 'i3',
    trainer: mscTrainers[2],
    from_phone: mscTrainers[2].phone,
    body: 'can I pick up extra hours this week?',
    received_at: '1 hr ago',
    intent: 'availability',
  },
];

export interface FixtureBundle {
  clubs: Club[];
  trainers: Trainer[];
  sessions: SessionWithAssignment[];
  cascades: ActiveCascade[];
  inbox: InboxItem[];
  pendingApprovals: number;
  confirmedAtBySession: Map<string, string>;
}

export const ALL_CLUBS_SLUG = '__all';

export function getAllClubsBundle(userClubs: Club[] = []): FixtureBundle {
  const allClubs: Club[] = [...clubs, ...userClubs];
  const bundles = clubs.map((c) => getFixtureBundle(c.slug));
  const sessions = bundles.flatMap((b) => b.sessions).sort((a, b) => {
    if (a.session.date !== b.session.date) return a.session.date.localeCompare(b.session.date);
    return a.session.start_time.localeCompare(b.session.start_time);
  });
  const trainers = bundles.flatMap((b) => b.trainers);
  const cascades = bundles.flatMap((b) => b.cascades);
  const inbox = bundles.flatMap((b) => b.inbox);
  const pendingApprovals = bundles.reduce((s, b) => s + b.pendingApprovals, 0);
  const confirmedAtBySession = new Map<string, string>();
  for (const b of bundles) {
    for (const [k, v] of b.confirmedAtBySession) confirmedAtBySession.set(k, v);
  }
  return {
    clubs: allClubs,
    trainers,
    sessions,
    cascades,
    inbox,
    pendingApprovals,
    confirmedAtBySession,
  };
}

export function getFixtureBundle(clubSlug: string): FixtureBundle {
  const club = clubs.find((c) => c.slug === clubSlug) ?? clubs[0];
  const trainers = club.id === 'club-nal' ? nalTrainers : mscTrainers;
  const sessions = club.id === 'club-nal' ? nalSessions : mscSessions;
  const assignments = club.id === 'club-nal' ? nalAssignments : mscAssignments;
  const trainerById = new Map(trainers.map((t) => [t.id, t]));

  const sessionsWithAssign: SessionWithAssignment[] = sessions
    .map((s) => {
      const slots: AssignmentSlot[] = assignments
        .filter((a) => a.session_id === s.id)
        .map((assignment) => {
          const trainer = assignment.trainer_id
            ? trainerById.get(assignment.trainer_id) ?? null
            : null;
          const prior = assignment.prior_trainer_id
            ? trainerById.get(assignment.prior_trainer_id) ?? null
            : null;
          return { assignment, trainer, prior_trainer: prior };
        });
      return { session: s, assignments: slots };
    })
    .sort((a, b) => {
      if (a.session.date !== b.session.date) return a.session.date.localeCompare(b.session.date);
      return a.session.start_time.localeCompare(b.session.start_time);
    });

  return {
    clubs,
    trainers,
    sessions: sessionsWithAssign,
    cascades: club.id === 'club-nal' ? cascades : [],
    inbox: club.id === 'club-nal' ? nalInbox : mscInbox,
    pendingApprovals: club.id === 'club-nal' ? 4 : 1,
    confirmedAtBySession: club.id === 'club-nal' ? nalConfirmTimes : mscConfirmTimes,
  };
}

export const FIXTURE_CLUBS = clubs;
