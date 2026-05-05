'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApprovalBanner } from '@/components/ApprovalBanner';
import { PageHeader } from '@/components/PageHeader';
import { WeekNavigator } from '@/components/WeekNavigator';
import { Toolbar, type ViewMode } from '@/components/Toolbar';
import { SummaryStrip } from '@/components/SummaryStrip';
import { GridCalendar } from '@/components/GridCalendar';
import { ListView } from '@/components/ListView';
import { CascadeCard } from '@/components/CascadeCard';
import { InboxCard } from '@/components/InboxCard';
import { SessionDetail } from '@/components/SessionDetail';
import { Section } from '@/components/Section';
import { EmptyState } from '@/components/EmptyState';
import { Toast } from '@/components/Toast';
import { TrainerPicker } from '@/components/TrainerPicker';
import { SendWeekModal } from '@/components/SendWeekModal';
import { SettingsModal } from '@/components/SettingsModal';
import {
  AddSessionModal,
  type SessionFormValues,
} from '@/components/AddSessionModal';
import { AddTrainerModal, type TrainerFormValues } from '@/components/AddTrainerModal';
import { AddClubModal, type ClubFormValues } from '@/components/AddClubModal';
import {
  ALL_CLUBS_SLUG,
  FIXTURE_CLUBS,
  getAllClubsBundle,
  getFixtureBundle,
  type FixtureBundle,
} from '@/lib/dev-fixtures';
import { loadBundleFromApi, type DataSource } from '@/lib/data-loader';
import type {
  Assignment,
  AssignmentSlot,
  Club,
  Session,
  SessionWithAssignment,
  SystemSettings,
  Trainer,
} from '@/lib/types';
import { addDays, startOfWeek, toISODate } from '@/lib/utils';

const DEFAULT_SETTINGS: SystemSettings = {
  agent_enabled: true,
  approval_mode: true,
  wave_size: 3,
  wave_wait_minutes: 4,
  max_waves: 3,
  reminder_hours_before: 24,
  max_outbound_per_hour: 50,
  loop_threshold: 3,
  escalation_phone: '+15550109999',
};

const USER_CLUBS_KEY = 'sideline.userClubs';
const CLUB_OVERRIDES_KEY = 'sideline.clubOverrides';

function loadUserClubs(): Club[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USER_CLUBS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Club[];
  } catch {
    return [];
  }
}

function loadClubOverrides(): Record<string, Partial<Club>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CLUB_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Partial<Club>>;
  } catch {
    return {};
  }
}

function saveClubOverrides(o: Record<string, Partial<Club>>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CLUB_OVERRIDES_KEY, JSON.stringify(o));
}

function applyOverrides(clubs: Club[], overrides: Record<string, Partial<Club>>): Club[] {
  return clubs.map((c) => {
    const o = overrides[c.slug];
    return o ? { ...c, ...o } : c;
  });
}

function emptyBundleFor(club: Club, allClubs: Club[]): FixtureBundle {
  return {
    clubs: allClubs,
    trainers: [],
    sessions: [],
    cascades: [],
    inbox: [],
    pendingApprovals: 0,
    confirmedAtBySession: new Map(),
  };
}

export default function Page() {
  const [clubSlug, setClubSlug] = useState<string>('rsg-nal');
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [view, setView] = useState<ViewMode>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [pickerCtx, setPickerCtx] = useState<
    | { sessionId: string; mode: 'add' }
    | { sessionId: string; mode: 'replace'; slotIndex: number }
    | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSendWeek, setShowSendWeek] = useState(false);

  const [showAddSession, setShowAddSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [editingTrainerId, setEditingTrainerId] = useState<string | null>(null);
  const [showAddClub, setShowAddClub] = useState(false);
  const [editingClubSlug, setEditingClubSlug] = useState<string | null>(null);
  const [clubOverrides, setClubOverrides] = useState<Record<string, Partial<Club>>>({});

  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [userClubs, setUserClubs] = useState<Club[]>([]);

  const [bundle, setBundle] = useState<FixtureBundle>(() => getFixtureBundle('rsg-nal'));
  const [pendingApprovals, setPendingApprovals] = useState(bundle.pendingApprovals);
  const [toast, setToast] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('fixtures');

  // Hydrate from URL/localStorage + try live API on first paint
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = loadUserClubs();
      const o = loadClubOverrides();
      setUserClubs(u);
      setClubOverrides(o);
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('club');
      const fromStorage = window.localStorage.getItem('sideline.club');
      const slug = fromUrl ?? fromStorage ?? 'rsg-nal';
      setClubSlug(slug);

      const allClubs = applyOverrides(mergeClubs(FIXTURE_CLUBS, u), o);
      const fallback = bundleForSlug(slug, allClubs, u, o);
      if (cancelled) return;
      setBundle(fallback);
      setPendingApprovals(fallback.pendingApprovals);
      const accent =
        slug === ALL_CLUBS_SLUG
          ? '#18181B'
          : allClubs.find((c) => c.slug === slug)?.color ?? '#1E40AF';
      document.documentElement.style.setProperty('--club-accent', accent);

      // Try live API
      const live = await loadBundleFromApi(slug);
      if (cancelled) return;
      if (live) {
        const merged: FixtureBundle = {
          ...live,
          clubs: applyOverrides(mergeClubs(live.clubs, u), o),
        };
        setBundle(merged);
        setPendingApprovals(merged.pendingApprovals);
        setDataSource('live');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function bundleForSlug(
    slug: string,
    allClubs: Club[],
    u: Club[],
    overrides: Record<string, Partial<Club>>,
  ): FixtureBundle {
    if (slug === ALL_CLUBS_SLUG) {
      const merged = getAllClubsBundle(u);
      return { ...merged, clubs: applyOverrides(merged.clubs, overrides) };
    }
    const club = allClubs.find((c) => c.slug === slug) ?? allClubs[0];
    if (isFixtureSlug(slug)) {
      const base = getFixtureBundle(slug);
      return { ...base, clubs: applyOverrides([...base.clubs, ...u], overrides) };
    }
    return emptyBundleFor(club, allClubs);
  }

  function mergeClubs(fixture: Club[], extra: Club[]): Club[] {
    const out = [...fixture];
    for (const c of extra) if (!out.some((x) => x.slug === c.slug)) out.push(c);
    return out;
  }

  function isFixtureSlug(slug: string): boolean {
    return FIXTURE_CLUBS.some((c) => c.slug === slug);
  }

  function selectClub(slug: string) {
    setClubSlug(slug);
    setExpandedId(null);
    const allClubs = applyOverrides(mergeClubs(FIXTURE_CLUBS, userClubs), clubOverrides);
    const next = bundleForSlug(slug, allClubs, userClubs, clubOverrides);
    setBundle(next);
    setPendingApprovals(next.pendingApprovals);
    const url = new URL(window.location.href);
    url.searchParams.set('club', slug);
    window.history.replaceState({}, '', url.toString());
    window.localStorage.setItem('sideline.club', slug);
    const accent = slug === ALL_CLUBS_SLUG ? '#18181B' : allClubs.find((c) => c.slug === slug)?.color ?? '#1E40AF';
    document.documentElement.style.setProperty('--club-accent', accent);

    if (dataSource === 'live') {
      void refreshFromApi(slug);
    }
  }

  async function refreshFromApi(slug: string = clubSlug) {
    const live = await loadBundleFromApi(slug);
    if (!live) return;
    const allClubs = applyOverrides(
      mergeClubs(live.clubs, userClubs),
      clubOverrides,
    );
    setBundle({ ...live, clubs: allClubs });
    setPendingApprovals(live.pendingApprovals);
    setDataSource('live');
  }

  const isAll = clubSlug === ALL_CLUBS_SLUG;
  const activeClub: Club =
    bundle.clubs.find((c) => c.slug === clubSlug) ??
    (isAll
      ? { id: '__all', name: 'All clubs', slug: ALL_CLUBS_SLUG, color: '#18181B', short: 'ALL', active: true }
      : bundle.clubs[0]);

  const clubsById = useMemo(() => {
    const m = new Map<string, Club>();
    for (const c of bundle.clubs) m.set(c.id, c);
    return m;
  }, [bundle.clubs]);

  const weekRows = useMemo(() => {
    const start = toISODate(weekStart);
    const end = toISODate(addDays(weekStart, 6));
    return bundle.sessions.filter((r) => r.session.date >= start && r.session.date <= end);
  }, [bundle.sessions, weekStart]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // -------- Session ops --------

  function handleAddTrainer(sessionId: string, trainer: Trainer) {
    setBundle((prev) => ({
      ...prev,
      sessions: prev.sessions.map((r) => {
        if (r.session.id !== sessionId) return r;
        if (r.assignments.some((s) => s.trainer?.id === trainer.id)) return r;
        const newAssignment: Assignment = {
          id: `a-new-${sessionId}-${Date.now()}`,
          session_id: sessionId,
          trainer_id: trainer.id,
          status: 'unassigned',
          assigned_at: new Date().toISOString(),
        };
        const newSlot: AssignmentSlot = {
          assignment: newAssignment,
          trainer,
          prior_trainer: null,
        };
        return { ...r, assignments: [...r.assignments, newSlot] };
      }),
    }));
    showToast(`Added ${trainer.full_name}. Will notify on next "Send week".`);
    setPickerCtx(null);
  }

  function handleReplaceSlotTrainer(sessionId: string, slotIndex: number, trainer: Trainer) {
    setBundle((prev) => ({
      ...prev,
      sessions: prev.sessions.map((r) => {
        if (r.session.id !== sessionId) return r;
        const next = r.assignments.map((slot, i) => {
          if (i !== slotIndex) return slot;
          const prior =
            slot.trainer && slot.trainer.id !== trainer.id ? slot.trainer : slot.prior_trainer;
          return {
            ...slot,
            trainer,
            prior_trainer: prior,
            assignment: {
              ...slot.assignment,
              trainer_id: trainer.id,
              status: 'unassigned' as const,
            },
          };
        });
        return { ...r, assignments: next };
      }),
    }));
    showToast(`Replaced with ${trainer.full_name}.`);
    setPickerCtx(null);
  }

  function handleRemoveSlot(sessionId: string, slotIndex: number) {
    setBundle((prev) => ({
      ...prev,
      sessions: prev.sessions.map((r) =>
        r.session.id === sessionId
          ? { ...r, assignments: r.assignments.filter((_, i) => i !== slotIndex) }
          : r,
      ),
    }));
    showToast('Trainer removed from session.');
  }

  function handleMarkSlotCallout(sessionId: string, slotIndex: number) {
    setBundle((prev) => ({
      ...prev,
      sessions: prev.sessions.map((r) =>
        r.session.id === sessionId
          ? {
              ...r,
              assignments: r.assignments.map((slot, i) =>
                i === slotIndex
                  ? {
                      ...slot,
                      prior_trainer: slot.trainer ?? slot.prior_trainer,
                      assignment: { ...slot.assignment, status: 'callout' },
                    }
                  : slot,
              ),
            }
          : r,
      ),
    }));
    showToast('Marked as callout — cascade will start.');
  }

  function handleMarkSessionCallout(sessionId: string) {
    setBundle((prev) => ({
      ...prev,
      sessions: prev.sessions.map((r) =>
        r.session.id === sessionId
          ? {
              ...r,
              assignments: r.assignments.map((slot) => ({
                ...slot,
                prior_trainer: slot.trainer ?? slot.prior_trainer,
                assignment: { ...slot.assignment, status: 'callout' },
              })),
            }
          : r,
      ),
    }));
    showToast('Marked all trainers on this session as callout.');
  }

  function handleCreateSession(values: SessionFormValues) {
    const newSession: Session = {
      id: `s-new-${Date.now()}`,
      club_id: activeClub.id,
      ...values,
    };
    const newRow: SessionWithAssignment = {
      session: newSession,
      assignments: [],
    };
    setBundle((prev) => ({
      ...prev,
      sessions: [...prev.sessions, newRow].sort(sessionSort),
    }));
    setShowAddSession(false);
    showToast(`Created ${newSession.program_name}.`);
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ club_id: activeClub.id, ...values }),
    })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  function handleEditSession(sessionId: string, values: SessionFormValues) {
    setBundle((prev) => ({
      ...prev,
      sessions: prev.sessions
        .map((r) =>
          r.session.id === sessionId ? { ...r, session: { ...r.session, ...values } } : r,
        )
        .sort(sessionSort),
    }));
    setEditingSessionId(null);
    showToast(`Saved ${values.program_name}.`);
    fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  function handleDeleteSession(sessionId: string) {
    setBundle((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((r) => r.session.id !== sessionId),
    }));
    setEditingSessionId(null);
    if (expandedId === sessionId) setExpandedId(null);
    showToast('Session deleted.');
    fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  // -------- Trainer ops --------

  function handleCreateTrainer(values: TrainerFormValues) {
    const newTrainer: Trainer = {
      id: `t-new-${Date.now()}`,
      club_id: activeClub.id,
      first_name: values.full_name.split(' ')[0],
      min_hours_week: 0,
      active: true,
      hours_this_week: 0,
      reliability: 0.9,
      ...values,
    };
    setBundle((prev) => ({ ...prev, trainers: [...prev.trainers, newTrainer] }));
    setShowAddTrainer(false);
    showToast(`Added ${newTrainer.full_name}.`);
    fetch('/api/trainers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ club_id: activeClub.id, ...values }),
    })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  function handleEditTrainer(trainerId: string, values: TrainerFormValues) {
    setBundle((prev) => ({
      ...prev,
      trainers: prev.trainers.map((t) =>
        t.id === trainerId
          ? { ...t, ...values, first_name: values.full_name.split(' ')[0] }
          : t,
      ),
      sessions: prev.sessions.map((r) => ({
        ...r,
        assignments: r.assignments.map((slot) =>
          slot.trainer?.id === trainerId
            ? {
                ...slot,
                trainer: {
                  ...slot.trainer,
                  ...values,
                  first_name: values.full_name.split(' ')[0],
                } as Trainer,
              }
            : slot,
        ),
      })),
    }));
    setEditingTrainerId(null);
    showToast(`Saved ${values.full_name}.`);
    fetch(`/api/trainers/${trainerId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  function handleDeactivateTrainer(trainerId: string) {
    setBundle((prev) => ({
      ...prev,
      trainers: prev.trainers.filter((t) => t.id !== trainerId),
    }));
    setEditingTrainerId(null);
    showToast('Trainer removed from active roster.');
    fetch(`/api/trainers/${trainerId}`, { method: 'DELETE' })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  // -------- Club ops --------

  function handleCreateClub(values: ClubFormValues) {
    const newClub: Club = {
      id: `c-new-${Date.now()}`,
      name: values.name,
      slug: values.slug,
      color: values.color,
      short: values.short,
      active: true,
    };
    const next = [...userClubs, newClub];
    setUserClubs(next);
    window.localStorage.setItem(USER_CLUBS_KEY, JSON.stringify(next));
    setShowAddClub(false);
    showToast(`Created ${newClub.name}.`);
    selectClub(newClub.slug);
    fetch('/api/clubs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  function handleEditClub(slug: string, values: ClubFormValues) {
    const isFixture = isFixtureSlug(slug);
    const sourceClub = bundle.clubs.find((c) => c.slug === slug);
    const slugChanged = values.slug !== slug;

    if (isFixture) {
      const overrides = {
        ...clubOverrides,
        [slug]: { name: values.name, color: values.color, short: values.short },
      };
      setClubOverrides(overrides);
      saveClubOverrides(overrides);
    } else {
      const userNext = userClubs.map((c) =>
        c.slug === slug
          ? {
              ...c,
              name: values.name,
              slug: values.slug,
              color: values.color,
              short: values.short,
            }
          : c,
      );
      setUserClubs(userNext);
      window.localStorage.setItem(USER_CLUBS_KEY, JSON.stringify(userNext));
    }

    setBundle((prev) => ({
      ...prev,
      clubs: prev.clubs.map((c) =>
        c.slug === slug
          ? { ...c, name: values.name, slug: isFixture ? c.slug : values.slug, color: values.color, short: values.short }
          : c,
      ),
    }));
    setEditingClubSlug(null);
    showToast(`Saved ${values.name}.`);

    // If the club is currently selected and the slug changed, refresh selection.
    if (clubSlug === slug && slugChanged) selectClub(values.slug);
    else if (clubSlug === slug) {
      document.documentElement.style.setProperty('--club-accent', values.color);
    }

    if (sourceClub && !sourceClub.id.startsWith('c-new-') && !sourceClub.id.startsWith('club-')) {
      fetch(`/api/clubs/${sourceClub.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      }).catch(() => {});
    } else if (sourceClub) {
      fetch(`/api/clubs/${sourceClub.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      }).catch(() => {});
    }
  }

  function handleDeleteClub(slug: string) {
    if (isFixtureSlug(slug)) {
      showToast("Built-in clubs can't be deleted.");
      return;
    }
    const club = userClubs.find((c) => c.slug === slug);
    if (!club) return;
    const userNext = userClubs.filter((c) => c.slug !== slug);
    setUserClubs(userNext);
    window.localStorage.setItem(USER_CLUBS_KEY, JSON.stringify(userNext));
    setEditingClubSlug(null);
    showToast(`Deleted ${club.name}.`);

    if (clubSlug === slug) selectClub(ALL_CLUBS_SLUG);
    else
      setBundle((prev) => ({
        ...prev,
        clubs: prev.clubs.filter((c) => c.slug !== slug),
      }));

    fetch(`/api/clubs/${club.id}`, { method: 'DELETE' })
      .then((r) => {
        if (r?.ok && dataSource === 'live') void refreshFromApi();
      })
      .catch(() => {});
  }

  // -------- derived --------

  const focusedRow = expandedId
    ? weekRows.find((r) => r.session.id === expandedId) ?? null
    : null;
  const pickerRow = pickerCtx
    ? weekRows.find((r) => r.session.id === pickerCtx.sessionId) ?? null
    : null;
  const editingRow = editingSessionId
    ? bundle.sessions.find((r) => r.session.id === editingSessionId) ?? null
    : null;
  const editingTrainer = editingTrainerId
    ? bundle.trainers.find((t) => t.id === editingTrainerId) ?? null
    : null;

  const showRail = bundle.cascades.length > 0 || bundle.inbox.length > 0;

  return (
    <div
      className="min-h-screen bg-bg text-ink"
      style={{ ['--club-accent' as never]: activeClub.color }}
    >
      <ApprovalBanner
        count={pendingApprovals}
        onApproveAll={() => {
          setPendingApprovals(0);
          showToast('All pending messages approved.');
        }}
        onReview={() => showToast('Opening review queue...')}
      />

      <PageHeader
        clubs={bundle.clubs}
        activeSlug={clubSlug}
        activeName={isAll ? 'All clubs' : activeClub.name}
        activeColor={activeClub.color}
        isAll={isAll}
        agentEnabled={settings.agent_enabled}
        isLive={dataSource === 'live'}
        onSelectClub={selectClub}
        onAddClub={() => setShowAddClub(true)}
        onEditClub={(slug) => setEditingClubSlug(slug)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="max-w-[1440px] mx-auto px-6">
        <WeekNavigator
          weekStart={weekStart}
          onPrev={() => {
            setWeekStart((d) => addDays(d, -7));
            showToast('Previous week');
          }}
          onNext={() => {
            setWeekStart((d) => addDays(d, 7));
            showToast('Next week');
          }}
          onJumpToday={() => {
            setWeekStart(startOfWeek(new Date()));
            showToast('Jumped to current week');
          }}
        />
      </div>

      <Toolbar
        view={view}
        onView={setView}
        onSendWeek={() => setShowSendWeek(true)}
        onSendReminders={() => showToast("Reminders queued for tomorrow's sessions.")}
        onAddSession={() => setShowAddSession(true)}
        isAll={isAll}
      />

      <div className="max-w-[1440px] mx-auto px-6 pt-2.5">
        <SummaryStrip rows={weekRows} />
      </div>

      <main
        className="max-w-[1440px] mx-auto px-6 pt-2.5 pb-6 grid items-start"
        style={{
          gridTemplateColumns: showRail ? 'minmax(0,1fr) 320px' : '1fr',
          gap: 16,
        }}
      >
        <div className="flex flex-col gap-3 min-w-0">
          {weekRows.length === 0 ? (
            <EmptyState onAdd={() => setShowAddSession(true)} />
          ) : view === 'grid' ? (
            <GridCalendar
              weekStart={weekStart}
              rows={weekRows}
              clubsById={clubsById}
              focusedId={expandedId}
              onSessionClick={(id) => setExpandedId(expandedId === id ? null : id)}
            />
          ) : (
            <ListView
              rows={weekRows}
              clubsById={clubsById}
              expandedId={expandedId}
              onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
              onReassign={(id) => setPickerCtx({ sessionId: id, mode: 'add' })}
              onMarkCallout={handleMarkSessionCallout}
              onEdit={(id) => setEditingSessionId(id)}
              confirmedAtBySession={bundle.confirmedAtBySession}
            />
          )}

          {view === 'grid' && focusedRow && (
            <SessionDetail
              row={focusedRow}
              club={clubsById.get(focusedRow.session.club_id) ?? activeClub}
              confirmedAtHuman={bundle.confirmedAtBySession.get(focusedRow.session.id)}
              onClose={() => setExpandedId(null)}
              onAddTrainer={(id) => setPickerCtx({ sessionId: id, mode: 'add' })}
              onReassignSlot={(id, idx) =>
                setPickerCtx({ sessionId: id, mode: 'replace', slotIndex: idx })
              }
              onRemoveSlot={handleRemoveSlot}
              onMarkSlotCallout={handleMarkSlotCallout}
              onEdit={(id) => setEditingSessionId(id)}
            />
          )}
        </div>

        {showRail && (
          <aside
            className="flex flex-col gap-3 sticky overflow-y-auto pr-0.5"
            style={{ top: 56, maxHeight: 'calc(100vh - 70px)' }}
          >
            {bundle.cascades.length > 0 && (
              <Section
                label="Coverage in progress"
                count={bundle.cascades.length}
                accent="#EA580C"
              >
                <div className="flex flex-col gap-3">
                  {bundle.cascades.map((c) => (
                    <CascadeCard
                      key={c.cascade.id}
                      cascade={c}
                      trainers={bundle.trainers}
                      onOverride={() => showToast('Override picker opening...')}
                    />
                  ))}
                </div>
              </Section>
            )}
            {bundle.inbox.length > 0 && (
              <Section label="Needs you" count={bundle.inbox.length}>
                <div className="flex flex-col gap-2">
                  {bundle.inbox.map((item) => (
                    <InboxCard
                      key={item.id}
                      item={item}
                      onReply={(id) => {
                        setBundle((prev) => ({
                          ...prev,
                          inbox: prev.inbox.filter((i) => i.id !== id),
                        }));
                        showToast(
                          `Reply sent to ${
                            item.trainer?.first_name ??
                            item.trainer?.full_name.split(' ')[0] ??
                            'sender'
                          }.`,
                        );
                      }}
                      onDismiss={(id) =>
                        setBundle((prev) => ({
                          ...prev,
                          inbox: prev.inbox.filter((i) => i.id !== id),
                        }))
                      }
                    />
                  ))}
                </div>
              </Section>
            )}
          </aside>
        )}
      </main>

      {showSettings && (
        <SettingsModal
          open={showSettings}
          onOpenChange={setShowSettings}
          settings={settings}
          onChange={(next) => setSettings((s) => ({ ...s, ...next }))}
          club={activeClub}
          trainers={bundle.trainers}
          onAddTrainer={() => {
            setShowSettings(false);
            setShowAddTrainer(true);
          }}
          onEditTrainer={(id) => {
            setShowSettings(false);
            setEditingTrainerId(id);
          }}
        />
      )}

      {showSendWeek && (
        <SendWeekModal
          club={activeClub}
          rows={weekRows}
          onClose={() => setShowSendWeek(false)}
          onSend={() => {
            setShowSendWeek(false);
            showToast(`Sent week to ${weekRows.length} sessions at ${activeClub.name}.`);
          }}
        />
      )}

      {pickerRow && pickerCtx && (
        <TrainerPicker
          row={pickerRow}
          trainers={bundle.trainers}
          mode={pickerCtx.mode}
          excludeTrainerIds={
            new Set(
              pickerRow.assignments
                .map((s, i) =>
                  pickerCtx.mode === 'replace' && i === pickerCtx.slotIndex
                    ? null
                    : s.trainer?.id ?? null,
                )
                .filter(Boolean) as string[],
            )
          }
          onSelect={(t) => {
            if (pickerCtx.mode === 'add') handleAddTrainer(pickerRow.session.id, t);
            else handleReplaceSlotTrainer(pickerRow.session.id, pickerCtx.slotIndex, t);
          }}
          onClose={() => setPickerCtx(null)}
          onAddTrainer={() => {
            setPickerCtx(null);
            setShowAddTrainer(true);
          }}
        />
      )}

      {showAddSession && (
        <AddSessionModal
          mode="add"
          defaultDate={toISODate(weekStart)}
          club={activeClub}
          onClose={() => setShowAddSession(false)}
          onSubmit={handleCreateSession}
        />
      )}

      {editingRow && (
        <AddSessionModal
          mode="edit"
          defaultDate={editingRow.session.date}
          initial={{
            date: editingRow.session.date,
            start_time: editingRow.session.start_time,
            end_time: editingRow.session.end_time,
            location: editingRow.session.location,
            age_groups: editingRow.session.age_groups,
            program_name: editingRow.session.program_name,
            session_type: editingRow.session.session_type,
            required_cert_level: editingRow.session.required_cert_level ?? null,
            notes: editingRow.session.notes ?? null,
          }}
          club={activeClub}
          onClose={() => setEditingSessionId(null)}
          onSubmit={(v) => handleEditSession(editingRow.session.id, v)}
          onDelete={() => handleDeleteSession(editingRow.session.id)}
        />
      )}

      {showAddTrainer && (
        <AddTrainerModal
          mode="add"
          club={activeClub}
          onClose={() => setShowAddTrainer(false)}
          onSubmit={handleCreateTrainer}
        />
      )}

      {editingTrainer && (
        <AddTrainerModal
          mode="edit"
          club={activeClub}
          initial={{
            full_name: editingTrainer.full_name,
            phone: editingTrainer.phone,
            email: editingTrainer.email ?? '',
            cert_level: editingTrainer.cert_level ?? '',
            age_groups: editingTrainer.age_groups ?? [],
            priority_tier: editingTrainer.priority_tier,
            max_hours_week: editingTrainer.max_hours_week,
          }}
          onClose={() => setEditingTrainerId(null)}
          onSubmit={(v) => handleEditTrainer(editingTrainer.id, v)}
          onDelete={() => handleDeactivateTrainer(editingTrainer.id)}
        />
      )}

      {showAddClub && (
        <AddClubModal
          mode="add"
          takenSlugs={bundle.clubs.map((c) => c.slug)}
          onClose={() => setShowAddClub(false)}
          onSubmit={handleCreateClub}
        />
      )}

      {editingClubSlug && (() => {
        const club = bundle.clubs.find((c) => c.slug === editingClubSlug);
        if (!club) return null;
        return (
          <AddClubModal
            mode="edit"
            isFixture={isFixtureSlug(editingClubSlug)}
            initial={{
              name: club.name,
              slug: club.slug,
              short: club.short ?? '',
              color: club.color,
            }}
            takenSlugs={bundle.clubs.map((c) => c.slug)}
            onClose={() => setEditingClubSlug(null)}
            onSubmit={(v) => handleEditClub(editingClubSlug, v)}
            onDelete={() => handleDeleteClub(editingClubSlug)}
          />
        );
      })()}

      <Toast message={toast} />
    </div>
  );
}

function sessionSort(a: SessionWithAssignment, b: SessionWithAssignment) {
  if (a.session.date !== b.session.date) return a.session.date.localeCompare(b.session.date);
  return a.session.start_time.localeCompare(b.session.start_time);
}
