'use client';

import { useMemo } from 'react';
import { STATUS_META, rollupStatus } from '@/lib/status';
import type { Club, SessionWithAssignment } from '@/lib/types';
import { fmtTimeShort, formatAgeGroups, formatDayHeader, toISODate } from '@/lib/utils';
import { StatusPill } from './StatusPill';

const ROW_GRID = '38px 92px minmax(0,1fr) 140px 160px 96px 18px';

export function ListView({
  rows,
  clubsById,
  expandedId,
  onToggleExpand,
  onReassign,
  onMarkCallout,
  onEdit,
  confirmedAtBySession,
}: {
  rows: SessionWithAssignment[];
  clubsById: Map<string, Club>;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onReassign: (id: string) => void;
  onMarkCallout: (id: string) => void;
  onEdit: (id: string) => void;
  confirmedAtBySession: Map<string, string>;
}) {
  const today = toISODate(new Date());
  const grouped = useMemo(() => {
    const m = new Map<string, SessionWithAssignment[]>();
    rows.forEach((r) => {
      if (!m.has(r.session.date)) m.set(r.session.date, []);
      m.get(r.session.date)!.push(r);
    });
    return Array.from(m.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ date, items }));
  }, [rows]);

  return (
    <div className="bg-surface border border-border-subtle rounded-[12px] overflow-hidden shadow-card">
      <ColumnHeader />
      <div className="flex flex-col">
        {grouped.map((g) => (
          <DayGroup
            key={g.date}
            date={g.date}
            items={g.items}
            isToday={g.date === today}
            expandedId={expandedId}
            clubsById={clubsById}
            onToggleExpand={onToggleExpand}
            onReassign={onReassign}
            onMarkCallout={onMarkCallout}
            onEdit={onEdit}
            confirmedAtBySession={confirmedAtBySession}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnHeader() {
  return (
    <div
      className="grid items-center px-3 h-7 bg-bg border-b border-border-subtle text-[10px] font-semibold tracking-[0.06em] uppercase text-text-quaternary gap-3"
      style={{ gridTemplateColumns: ROW_GRID }}
    >
      <span>Club</span>
      <span>Time</span>
      <span>Program</span>
      <span>Location</span>
      <span>Trainer</span>
      <span>Status</span>
      <span />
    </div>
  );
}

function DayGroup({
  date,
  items,
  isToday,
  clubsById,
  expandedId,
  onToggleExpand,
  onReassign,
  onMarkCallout,
  onEdit,
  confirmedAtBySession,
}: {
  date: string;
  items: SessionWithAssignment[];
  isToday: boolean;
  clubsById: Map<string, Club>;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onReassign: (id: string) => void;
  onMarkCallout: (id: string) => void;
  onEdit: (id: string) => void;
  confirmedAtBySession: Map<string, string>;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-3 h-7 bg-border-hairline/60 border-b border-border-subtle">
        <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-ink">
          {formatDayHeader(date)}
        </div>
        {isToday && (
          <span
            className="text-[8px] font-bold tracking-[0.1em] text-ink px-[4px] py-[1px] rounded-[3px]"
            style={{ background: '#FDE68A' }}
          >
            TODAY
          </span>
        )}
        <div className="ml-auto text-[10px] text-text-quaternary tabular">
          {items.length} session{items.length === 1 ? '' : 's'}
        </div>
      </div>
      {items.map((r) => (
        <SessionRow
          key={r.session.id}
          row={r}
          club={clubsById.get(r.session.club_id) ?? null}
          expanded={expandedId === r.session.id}
          onClick={() => onToggleExpand(r.session.id)}
          onReassign={onReassign}
          onMarkCallout={onMarkCallout}
          onEdit={onEdit}
          confirmedAtHuman={confirmedAtBySession.get(r.session.id)}
        />
      ))}
    </div>
  );
}

function SessionRow({
  row,
  club,
  expanded,
  onClick,
  onReassign,
  onMarkCallout,
  onEdit,
  confirmedAtHuman,
}: {
  row: SessionWithAssignment;
  club: Club | null;
  expanded: boolean;
  onClick: () => void;
  onReassign: (id: string) => void;
  onMarkCallout: (id: string) => void;
  onEdit: (id: string) => void;
  confirmedAtHuman?: string;
}) {
  const status = rollupStatus(row.assignments);
  const isCallout = status === 'callout';
  const trainerNames = row.assignments
    .map((s) => s.trainer?.first_name ?? s.trainer?.full_name.split(' ')[0])
    .filter(Boolean) as string[];
  const calloutSlot = row.assignments.find(
    (s) => s.assignment.status === 'callout' && s.prior_trainer,
  );
  const firstSlot = row.assignments[0] ?? null;

  return (
    <div
      className="border-b border-border-hairline transition-colors"
      style={{ background: expanded ? '#FAFAF9' : 'transparent' }}
    >
      <div
        onClick={onClick}
        className="grid items-center cursor-pointer gap-3 px-3"
        style={{ gridTemplateColumns: ROW_GRID, height: 38 }}
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.background = '#F4F4F1';
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: club?.color ?? '#A1A1AA' }}
          />
          <span
            className="text-[10px] font-bold tracking-[0.06em]"
            style={{ color: club?.color ?? '#A1A1AA' }}
          >
            {club?.short ?? '—'}
          </span>
        </div>
        <div className="text-[12px] text-text-secondary font-mono-num truncate">
          {fmtTimeShort(row.session.start_time)}–{fmtTimeShort(row.session.end_time)}
        </div>
        <div className="text-[13px] font-medium text-ink truncate">
          {row.session.program_name}
          <span className="text-[11px] text-text-quaternary font-normal ml-2">
            {formatAgeGroups(row.session.age_groups)} · {row.session.session_type}
          </span>
        </div>
        <div className="text-[12px] text-text-tertiary truncate">{row.session.location}</div>
        <div className="text-[12px] font-medium text-ink truncate flex items-center gap-1">
          {calloutSlot && calloutSlot.prior_trainer ? (
            <span className="truncate">
              <span className="line-through text-text-quaternary">
                {calloutSlot.prior_trainer.first_name ??
                  calloutSlot.prior_trainer.full_name.split(' ')[0]}
              </span>
              <span className="mx-1 text-text-quaternary">→</span>
              <span style={{ color: '#EA580C' }}>finding…</span>
            </span>
          ) : trainerNames.length === 0 ? (
            <span className="text-text-quaternary">—</span>
          ) : trainerNames.length === 1 ? (
            <span className="truncate">{trainerNames[0]}</span>
          ) : (
            <>
              <span className="truncate">{trainerNames.slice(0, 2).join(', ')}</span>
              {trainerNames.length > 2 && (
                <span className="px-1 rounded text-[9px] font-bold bg-text-secondary text-bg tabular shrink-0">
                  +{trainerNames.length - 2}
                </span>
              )}
            </>
          )}
        </div>
        <StatusPill status={status} />
        <div
          className="w-[14px] h-[14px] grid place-items-center text-text-quaternary transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path
              d="M3.5 2L6.5 5L3.5 8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 animate-sl-expand" style={{ paddingLeft: 130 }}>
          <div className="grid pt-1" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="text-section-label text-text-quaternary mb-1.5 uppercase">
                TRAINERS ({row.assignments.length})
              </div>
              {row.assignments.length === 0 ? (
                <div className="text-[13px] text-text-tertiary">No trainers assigned.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {row.assignments.map((slot, i) => {
                    const meta = STATUS_META[slot.assignment.status];
                    const t = slot.trainer ?? slot.prior_trainer;
                    return (
                      <div key={i} className="flex items-baseline gap-2 text-[13px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                          style={{ background: meta.dot }}
                        />
                        <span className="font-medium text-ink truncate">
                          {t ? t.full_name : '—'}
                        </span>
                        <span className="text-[11px]" style={{ color: meta.text }}>
                          {meta.label}
                          {slot.assignment.status === 'confirmed' && confirmedAtHuman
                            ? ` · ${confirmedAtHuman}`
                            : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {isCallout && calloutSlot?.prior_trainer && (
                <div className="text-[12px] mt-1.5" style={{ color: '#9A3412' }}>
                  {calloutSlot.prior_trainer.first_name ??
                    calloutSlot.prior_trainer.full_name.split(' ')[0]}{' '}
                  called out — cascade running.
                </div>
              )}
            </div>
            <div>
              <div className="text-section-label text-text-quaternary mb-1.5 uppercase">SESSION</div>
              <div className="text-[13px] text-ink mb-0.5">
                {formatAgeGroups(row.session.age_groups)} · {row.session.session_type}
              </div>
              <div className="text-[12px] text-text-tertiary">
                {row.session.location}
                {firstSlot?.trainer?.cert_level
                  ? ` · cert ${firstSlot.trainer.cert_level}`
                  : ''}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-3 text-[12px] items-center flex-wrap">
            <ActionLink onClick={() => onReassign(row.session.id)}>
              + Add trainer
            </ActionLink>
            <Sep />
            <ActionLink>Send custom text</ActionLink>
            <Sep />
            <ActionLink danger onClick={() => onMarkCallout(row.session.id)}>
              Mark callout
            </ActionLink>
            <Sep />
            <ActionLink onClick={() => onEdit(row.session.id)}>Edit session</ActionLink>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionLink({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="bg-transparent border-0 cursor-pointer p-0 text-[12px] font-medium border-b border-transparent"
      style={{ color: danger ? '#DC2626' : '#18181B' }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderBottomColor = danger ? '#DC2626' : '#18181B')
      }
      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="text-border-emphasis">·</span>;
}
