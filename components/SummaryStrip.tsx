'use client';

import { STATUS_META, rollupStatus } from '@/lib/status';
import type { AssignmentStatus, SessionWithAssignment } from '@/lib/types';

export function SummaryStrip({ rows }: { rows: SessionWithAssignment[] }) {
  const counts: Record<AssignmentStatus, number> = {
    confirmed: 0,
    initial_yes: 0,
    notified: 0,
    unassigned: 0,
    callout: 0,
    covered: 0,
    unfilled: 0,
  };
  rows.forEach((r) => {
    const s = rollupStatus(r.assignments);
    counts[s] = (counts[s] ?? 0) + 1;
  });
  const items: { key: AssignmentStatus; label: string; count: number }[] = [
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { key: 'initial_yes', label: 'Initial yes', count: counts.initial_yes },
    { key: 'notified', label: 'Notified', count: counts.notified },
    { key: 'unassigned', label: 'Unassigned', count: counts.unassigned },
    { key: 'callout', label: 'In cascade', count: counts.callout },
    { key: 'unfilled', label: 'Unfilled', count: counts.unfilled },
  ];

  return (
    <div className="grid border border-border-subtle rounded-[10px] bg-surface overflow-hidden" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr) auto` }}>
      {items.map((it) => {
        const meta = STATUS_META[it.key];
        const live = it.count > 0;
        const isCalloutLive = it.key === 'callout' && live;
        return (
          <div
            key={it.key}
            className="px-3.5 py-2 border-r border-border-hairline relative"
            style={{ background: isCalloutLive ? '#FFF8F1' : 'transparent' }}
          >
            <div
              className="flex items-center gap-1.5 text-micro-label uppercase"
              style={{ color: live ? meta.text : '#A1A1AA' }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isCalloutLive ? 'animate-sl-pulse' : ''}`}
                style={{ background: live ? meta.dot : '#D4D4D8' }}
              />
              {it.label}
            </div>
            <div
              className="font-mono-num leading-[1.1] mt-0.5"
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: live ? '#18181B' : '#D4D4D8',
              }}
            >
              {it.count.toString().padStart(2, '0')}
            </div>
          </div>
        );
      })}
      <div className="px-[18px] py-2 bg-ink text-bg flex flex-col justify-center min-w-[120px]">
        <div className="text-[10px] font-semibold tracking-[0.06em] uppercase text-text-quaternary">
          This week
        </div>
        <div className="font-mono-num leading-[1.1] mt-0.5" style={{ fontSize: 20, fontWeight: 600 }}>
          {rows.length}{' '}
          <span className="text-text-tertiary text-[12px] font-normal">sessions</span>
        </div>
      </div>
    </div>
  );
}
