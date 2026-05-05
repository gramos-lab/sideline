'use client';

import { useMemo, useState } from 'react';
import type { SessionWithAssignment, Trainer } from '@/lib/types';
import { fmtTimeShort } from '@/lib/utils';
import { ModalShell } from './ModalShell';

export function TrainerPicker({
  row,
  trainers,
  mode,
  excludeTrainerIds,
  onSelect,
  onClose,
  onAddTrainer,
}: {
  row: SessionWithAssignment;
  trainers: Trainer[];
  mode: 'add' | 'replace';
  excludeTrainerIds: Set<string>;
  onSelect: (t: Trainer) => void;
  onClose: () => void;
  onAddTrainer: () => void;
}) {
  const [query, setQuery] = useState('');
  const [showInel, setShowInel] = useState(false);

  const enriched = useMemo(
    () =>
      trainers
        .filter((t) => !excludeTrainerIds.has(t.id))
        .map((t) => ({
          ...t,
          eligible: (row.session.age_groups ?? []).some((a) =>
            (t.age_groups ?? []).includes(a),
          ),
        })),
    [trainers, row, excludeTrainerIds],
  );

  const filtered = enriched.filter((t) =>
    t.full_name.toLowerCase().includes(query.toLowerCase()),
  );
  const eligible = filtered.filter((t) => t.eligible);
  const ineligible = filtered.filter((t) => !t.eligible);

  return (
    <ModalShell
      onClose={onClose}
      width={480}
      title={mode === 'add' ? 'Add a trainer' : 'Replace trainer'}
      subtitle={`${row.session.program_name} · ${fmtTimeShort(row.session.start_time)}`}
    >
      <div className="px-6 pb-3">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trainers..."
          className="w-full px-3.5 py-2.5 border border-border-subtle rounded-[8px] text-[14px] outline-none"
        />
      </div>
      <div className="max-h-[400px] overflow-y-auto px-3 pb-4">
        {eligible.map((t) => (
          <Row key={t.id} t={t} onClick={() => onSelect(t)} />
        ))}
        {ineligible.length > 0 && (
          <>
            <button
              onClick={() => setShowInel((s) => !s)}
              className="bg-transparent border-0 cursor-pointer px-3 py-2 mt-1 text-[12px] text-text-tertiary font-medium"
            >
              {showInel ? 'Hide' : 'Show'} ineligible ({ineligible.length})
            </button>
            {showInel &&
              ineligible.map((t) => <Row key={t.id} t={t} onClick={() => onSelect(t)} dim />)}
          </>
        )}
      </div>
      <div className="border-t border-border-hairline px-4 py-2.5 flex items-center justify-between">
        <span className="text-[12px] text-text-quaternary">
          {eligible.length} eligible · {ineligible.length} ineligible
        </span>
        <button
          onClick={onAddTrainer}
          className="bg-transparent border-0 cursor-pointer text-[13px] font-medium text-ink hover:underline"
        >
          + Add trainer
        </button>
      </div>
    </ModalShell>
  );
}

function Row({
  t,
  onClick,
  dim,
}: {
  t: Trainer & { eligible?: boolean };
  onClick: () => void;
  dim?: boolean;
}) {
  const reliability = Math.round((t.reliability ?? 0.9) * 100);
  return (
    <button
      onClick={onClick}
      className="grid items-center w-full text-left bg-transparent border-0 rounded-md cursor-pointer hover:bg-border-hairline"
      style={{
        gridTemplateColumns: 'auto 1fr auto auto',
        gap: 12,
        padding: '10px 12px',
        opacity: dim ? 0.55 : 1,
      }}
    >
      <div className="flex gap-px">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="text-[11px] leading-none"
            style={{
              color: i <= 4 - t.priority_tier ? '#CA8A04' : '#E8E6E1',
            }}
          >
            ★
          </span>
        ))}
      </div>
      <div>
        <div className="text-[14px] font-medium text-ink">{t.full_name}</div>
        <div className="text-[11px] text-text-quaternary">
          {t.cert_level ?? '—'} · {(t.age_groups ?? []).join(', ')}
        </div>
      </div>
      <div className="text-[11px] text-text-tertiary font-mono-num">{t.hours_this_week ?? 0}h</div>
      <div
        className="w-2 h-2 rounded-full"
        style={{
          background:
            reliability >= 95 ? '#16A34A' : reliability >= 88 ? '#CA8A04' : '#A1A1AA',
        }}
      />
    </button>
  );
}
