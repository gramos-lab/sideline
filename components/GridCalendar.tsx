'use client';

import { useMemo } from 'react';
import { STATUS_META, rollupStatus } from '@/lib/status';
import type { Club, SessionWithAssignment } from '@/lib/types';
import { addDays, fmtRangeNoSuffix, timeToMinutes, toISODate } from '@/lib/utils';

const DAY_NAMES_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOUR_PX = 40;

export function GridCalendar({
  weekStart,
  rows,
  clubsById,
  focusedId,
  onSessionClick,
}: {
  weekStart: Date;
  rows: SessionWithAssignment[];
  clubsById: Map<string, Club>;
  focusedId: string | null;
  onSessionClick: (id: string) => void;
}) {
  const today = toISODate(new Date());

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        const iso = toISODate(d);
        return {
          iso,
          dow: DAY_NAMES_SHORT[i],
          dateLabel: `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`.replace(
            /^[A-Za-z]+\s/,
            '',
          ).length
            ? `${d.getDate()}`
            : `${d.getDate()}`,
          monthDay: `${d.getDate()}`,
          isToday: iso === today,
          rows: rows.filter((r) => r.session.date === iso),
        };
      }),
    [weekStart, rows, today],
  );

  // auto-fit time window to the actual sessions, with 1h padding above
  const range = useMemo(() => {
    let minHr = 24;
    let maxHr = 0;
    rows.forEach((r) => {
      const [sh] = r.session.start_time.split(':').map(Number);
      const [eh, em] = r.session.end_time.split(':').map(Number);
      minHr = Math.min(minHr, sh);
      maxHr = Math.max(maxHr, eh + (em > 0 ? 1 : 0));
    });
    if (rows.length === 0) {
      minHr = 9;
      maxHr = 21;
    }
    const startHr = Math.max(7, minHr);
    const endHr = Math.min(23, maxHr + 1);
    return { startHr, endHr, height: (endHr - startHr) * HOUR_PX };
  }, [rows]);

  const cols = days.length;

  return (
    <div
      className="border border-border-subtle rounded-[12px] bg-surface overflow-hidden shadow-card"
    >
      {/* Header row */}
      <div
        className="grid bg-bg border-b border-border-subtle"
        style={{ gridTemplateColumns: `48px repeat(${cols}, 1fr)` }}
      >
        <div />
        {days.map((d) => (
          <div
            key={d.iso}
            className="px-2.5 py-2 border-l border-border-subtle flex items-baseline gap-1.5"
          >
            <div
              className="text-[10px] font-semibold tracking-[0.08em]"
              style={{ color: d.isToday ? '#18181B' : '#71717A' }}
            >
              {d.dow}
            </div>
            <div className="text-[10px] text-text-quaternary font-mono-num">{d.monthDay}</div>
            {d.isToday && (
              <div
                className="ml-auto text-[8px] font-bold tracking-[0.1em] text-ink px-[4px] py-[1px] rounded-[3px]"
                style={{ background: '#FDE68A' }}
              >
                TODAY
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <div
        className="grid relative"
        style={{ gridTemplateColumns: `48px repeat(${cols}, 1fr)` }}
      >
        {/* Time column */}
        <div className="relative bg-bg" style={{ height: range.height }}>
          {Array.from({ length: range.endHr - range.startHr + 1 }, (_, i) => {
            const hr = range.startHr + i;
            const ampm = hr >= 12 ? 'p' : 'a';
            const hh = ((hr + 11) % 12) + 1;
            return (
              <div
                key={hr}
                className="absolute right-2 text-[10px] text-text-quaternary font-mono-num"
                style={{ top: i * HOUR_PX - 7 }}
              >
                {hh}
                {ampm}
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        {days.map((d) => (
          <div
            key={d.iso}
            className="relative border-l border-border-subtle"
            style={{
              height: range.height,
              background: d.isToday ? 'rgba(253,230,138,0.05)' : '#fff',
            }}
          >
            {Array.from({ length: range.endHr - range.startHr }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0"
                style={{
                  top: i * HOUR_PX,
                  borderTop: i === 0 ? 'none' : '1px dashed #F4F4F1',
                }}
              />
            ))}

            {d.rows.map((r) => {
              const top =
                ((timeToMinutes(r.session.start_time) - range.startHr * 60) / 60) * HOUR_PX;
              const height =
                ((timeToMinutes(r.session.end_time) - timeToMinutes(r.session.start_time)) / 60) *
                HOUR_PX;
              const status = rollupStatus(r.assignments);
              const meta = STATUS_META[status];
              const isFocused = focusedId === r.session.id;
              const isCallout = status === 'callout';
              const club = clubsById.get(r.session.club_id);
              const trainerNames = r.assignments.map((slot) => {
                if (slot.trainer)
                  return slot.trainer.first_name ?? slot.trainer.full_name.split(' ')[0];
                if (slot.prior_trainer)
                  return slot.prior_trainer.first_name ??
                    slot.prior_trainer.full_name.split(' ')[0];
                return '?';
              });
              const calloutSlot = r.assignments.find(
                (s) => s.assignment.status === 'callout' && s.prior_trainer,
              );

              return (
                <button
                  key={r.session.id}
                  onClick={() => onSessionClick(r.session.id)}
                  className={`absolute text-left flex flex-col gap-[2px] overflow-hidden cursor-pointer ${
                    isCallout ? 'animate-sl-pulse-bg' : ''
                  }`}
                  style={{
                    top: top + 1,
                    left: 4,
                    right: 4,
                    height: height - 2,
                    padding: '5px 7px 5px 8px',
                    background: meta.fill,
                    border: `1px solid ${meta.border}`,
                    borderLeft: `3px solid ${meta.dot}`,
                    borderRadius: 5,
                    outline: isFocused ? `2px solid ${meta.dot}` : 'none',
                    outlineOffset: 1,
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div
                    className="flex items-baseline gap-1.5 font-mono-num whitespace-nowrap min-w-0"
                    style={{ fontSize: 10, fontWeight: 600, color: meta.text, letterSpacing: '-0.01em' }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        isCallout ? 'animate-sl-pulse' : ''
                      }`}
                      style={{ background: meta.dot }}
                    />
                    <span>{fmtRangeNoSuffix(r.session.start_time, r.session.end_time)}</span>
                    {club?.short && (
                      <span
                        className="ml-auto shrink-0 font-sans"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          color: club.color,
                        }}
                      >
                        {club.short}
                      </span>
                    )}
                  </div>
                  <div
                    className="text-ink leading-[1.2] break-words"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      display: '-webkit-box',
                      WebkitLineClamp: height > 56 ? 1 : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {r.session.program_name}
                  </div>
                  {height > 56 && (
                    <div
                      className="text-text-tertiary leading-[1.3] truncate mt-auto flex items-center gap-1"
                      style={{ fontSize: 10 }}
                    >
                      <span className="truncate">{r.session.location}</span>
                      <span className="text-border-emphasis">·</span>
                      <span
                        className="truncate flex items-center gap-1"
                        style={{ color: meta.text, fontWeight: 500 }}
                      >
                        {calloutSlot && calloutSlot.prior_trainer ? (
                          <>
                            <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                              {calloutSlot.prior_trainer.first_name ??
                                calloutSlot.prior_trainer.full_name.split(' ')[0]}
                            </span>
                            <span className="mx-[3px]">→</span>?
                          </>
                        ) : trainerNames.length === 0 ? (
                          '—'
                        ) : trainerNames.length === 1 ? (
                          trainerNames[0]
                        ) : (
                          <>
                            <span className="truncate">{trainerNames.slice(0, 2).join(', ')}</span>
                            {trainerNames.length > 2 && (
                              <span
                                className="px-1 rounded text-[9px] font-bold tabular shrink-0"
                                style={{
                                  background: meta.dot,
                                  color: '#fff',
                                  lineHeight: '12px',
                                }}
                              >
                                +{trainerNames.length - 2}
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}

            {d.rows.length === 0 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] text-border-emphasis">
                —
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
