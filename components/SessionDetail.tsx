'use client';

import { STATUS_META, rollupStatus } from '@/lib/status';
import type { Club, SessionWithAssignment, Trainer } from '@/lib/types';
import { fmtTimeShort, formatAgeGroups } from '@/lib/utils';
import { StatusPill } from './StatusPill';

export function SessionDetail({
  row,
  club,
  confirmedAtHuman,
  onClose,
  onReassignSlot,
  onRemoveSlot,
  onAddTrainer,
  onMarkSlotCallout,
  onEdit,
}: {
  row: SessionWithAssignment;
  club: Club;
  confirmedAtHuman?: string;
  onClose: () => void;
  onReassignSlot: (sessionId: string, slotIndex: number) => void;
  onRemoveSlot: (sessionId: string, slotIndex: number) => void;
  onAddTrainer: (sessionId: string) => void;
  onMarkSlotCallout: (sessionId: string, slotIndex: number) => void;
  onEdit: (id: string) => void;
}) {
  const status = rollupStatus(row.assignments);
  const meta = STATUS_META[status];

  return (
    <div
      className="bg-surface rounded-[12px] p-6 animate-sl-expand"
      style={{
        border: '1px solid #E8E6E1',
        borderLeft: `4px solid ${meta.dot}`,
      }}
    >
      <div className="flex items-start gap-[18px]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.02em]"
              style={{
                padding: '3px 9px 3px 8px',
                border: `1px solid ${club.color}33`,
                background: `${club.color}0F`,
                color: club.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: club.color }} />
              {club.name}
            </span>
            <div className="text-[18px] font-semibold text-ink">{row.session.program_name}</div>
            <StatusPill status={status} />
            <span className="text-[12px] text-text-tertiary tabular ml-1">
              {row.assignments.length} trainer{row.assignments.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="text-[13px] text-text-tertiary">
            {fmtTimeShort(row.session.start_time)} – {fmtTimeShort(row.session.end_time)} ·{' '}
            {row.session.location} · {formatAgeGroups(row.session.age_groups)} · {row.session.session_type}
          </div>

          <div className="mt-5">
            <div className="text-section-label text-text-quaternary uppercase mb-2">
              Trainers
            </div>
            {row.assignments.length === 0 ? (
              <div className="text-[14px] text-text-tertiary">
                No one assigned yet — add one or more trainers below.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border-hairline border border-border-subtle rounded-md overflow-hidden">
                {row.assignments.map((slot, i) => (
                  <SlotRow
                    key={slot.assignment.id}
                    slot={slot}
                    confirmedAtHuman={confirmedAtHuman}
                    onReassign={() => onReassignSlot(row.session.id, i)}
                    onRemove={() => onRemoveSlot(row.session.id, i)}
                    onMarkCallout={() => onMarkSlotCallout(row.session.id, i)}
                  />
                ))}
              </div>
            )}
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={() => onAddTrainer(row.session.id)}
                className="bg-ink text-bg border-0 px-3 py-1.5 rounded-md text-[12px] font-medium cursor-pointer"
              >
                + Add trainer
              </button>
            </div>
          </div>

          <div className="flex gap-3.5 mt-5 text-[13px] items-center">
            <TextBtn onClick={() => onEdit(row.session.id)}>Edit session</TextBtn>
            <Sep />
            <TextBtn>Send custom text</TextBtn>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="bg-transparent border-0 cursor-pointer text-text-quaternary p-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SlotRow({
  slot,
  confirmedAtHuman,
  onReassign,
  onRemove,
  onMarkCallout,
}: {
  slot: { assignment: { status: import('@/lib/types').AssignmentStatus }; trainer: Trainer | null; prior_trainer: Trainer | null };
  confirmedAtHuman?: string;
  onReassign: () => void;
  onRemove: () => void;
  onMarkCallout: () => void;
}) {
  const status = slot.assignment.status;
  const meta = STATUS_META[status];
  const t = slot.trainer;
  const prior = slot.prior_trainer;

  return (
    <div
      className="grid items-center gap-3 px-3 py-2.5"
      style={{
        gridTemplateColumns: '24px minmax(0,1fr) auto auto',
        background: status === 'callout' ? '#FFF8F1' : 'transparent',
      }}
    >
      <span
        className={`w-2 h-2 rounded-full ${status === 'callout' ? 'animate-sl-pulse' : ''}`}
        style={{ background: meta.dot }}
      />
      <div className="min-w-0">
        {prior && status === 'callout' ? (
          <div className="text-[14px]">
            <span className="line-through text-text-quaternary">{prior.full_name}</span>
            <span className="mx-2 text-text-quaternary">→</span>
            <span className="font-medium" style={{ color: '#EA580C' }}>
              finding cover…
            </span>
          </div>
        ) : t ? (
          <>
            <div className="text-[14px] font-medium text-ink truncate">{t.full_name}</div>
            <div className="text-[12px] text-text-tertiary truncate">
              Tier {t.priority_tier} · {t.cert_level ?? '—'} ·{' '}
              {Math.round((t.reliability ?? 0.9) * 100)}% reliability ·{' '}
              {t.hours_this_week ?? 0}h this week
            </div>
          </>
        ) : (
          <div className="text-[14px] text-text-quaternary">Unfilled slot</div>
        )}
      </div>
      <StatusPill status={status} />
      <div className="flex items-center gap-3 text-[12px]">
        <button
          onClick={onReassign}
          className="bg-transparent border-0 cursor-pointer p-0 text-ink font-medium hover:underline"
        >
          Reassign
        </button>
        {status !== 'callout' && (
          <button
            onClick={onMarkCallout}
            className="bg-transparent border-0 cursor-pointer p-0 font-medium hover:underline"
            style={{ color: '#9A3412' }}
          >
            Callout
          </button>
        )}
        <button
          onClick={onRemove}
          aria-label="Remove trainer"
          className="bg-transparent border-0 cursor-pointer p-0 text-text-quaternary hover:text-[#DC2626]"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function TextBtn({
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
      onClick={onClick}
      className="bg-transparent border-0 cursor-pointer p-0 text-[13px] font-medium hover:underline"
      style={{ color: danger ? '#DC2626' : '#18181B' }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="text-border-emphasis">·</span>;
}
