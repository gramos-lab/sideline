'use client';

import { useEffect, useState } from 'react';
import type { ActiveCascade, Trainer } from '@/lib/types';
import { fmtTimeShort } from '@/lib/utils';

const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function CascadeCard({
  cascade,
  trainers,
  onOverride,
}: {
  cascade: ActiveCascade;
  trainers: Trainer[];
  onOverride: (callout_id: string) => void;
}) {
  const dow = new Date(cascade.session.date + 'T00:00:00').getDay();
  const tick = useCountdown(cascade.next_wave_at);
  const mins = Math.floor(tick / 60);
  const secs = tick % 60;

  return (
    <div
      className="bg-surface rounded-[12px] p-6 shadow-cardOrange"
      style={{
        border: '1px solid #FED7AA',
        borderLeft: '4px solid #EA580C',
      }}
    >
      <div className="flex items-start gap-3.5">
        <span
          className="w-2.5 h-2.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0 animate-sl-pulse"
        />
        <div className="flex-1">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <div className="text-[15px] font-semibold text-ink">
              {DAY_NAMES_SHORT[dow]} · {fmtTimeShort(cascade.session.start_time)} ·{' '}
              {cascade.session.program_name}
            </div>
            <div className="text-[12px] font-medium" style={{ color: '#9A3412' }}>
              Wave {cascade.cascade.current_wave} of {cascade.max_waves}
            </div>
          </div>
          <div className="text-[14px] text-text-secondary mt-1.5">
            {cascade.original_trainer
              ? cascade.original_trainer.first_name ?? cascade.original_trainer.full_name.split(' ')[0]
              : 'Trainer'}{' '}
            called out
            {cascade.reason ? ` — “${cascade.reason}”` : ''} · {cascade.reported_at_human ?? 'just now'}
          </div>

          <div className="flex flex-wrap gap-2 mt-3.5">
            {cascade.attempts.map((a, i) => {
              const tr = trainers.find((t) => t.id === a.trainer_id);
              const cur = a.wave === cascade.cascade.current_wave;
              const color =
                a.response === 'yes'
                  ? '#16A34A'
                  : a.response === 'no'
                  ? '#DC2626'
                  : a.response === 'timeout'
                  ? '#A1A1AA'
                  : cur
                  ? '#EA580C'
                  : '#A1A1AA';
              const bg =
                a.response === 'yes'
                  ? '#ECFDF5'
                  : a.response === 'no'
                  ? '#FEF2F2'
                  : a.response === 'timeout'
                  ? '#F4F4F1'
                  : cur
                  ? '#FFF1E6'
                  : '#F4F4F1';
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-md text-[12px] font-medium text-ink"
                  style={{
                    padding: '5px 9px',
                    background: bg,
                    border: `1px solid ${color}33`,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full grid place-items-center text-white font-bold"
                    style={{ background: color, fontSize: 8 }}
                  >
                    {a.wave}
                  </span>
                  <span>{tr?.first_name ?? tr?.full_name.split(' ')[0] ?? '—'}</span>
                  {a.response === 'yes' && <span style={{ color }}>✓</span>}
                  {a.response === 'no' && <span style={{ color }}>✕</span>}
                  {a.response === 'timeout' && (
                    <span style={{ color, fontSize: 11 }}>⌛</span>
                  )}
                  {!a.response && cur && (
                    <span
                      className="w-[5px] h-[5px] rounded-full animate-sl-pulse"
                      style={{ background: color }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="flex items-center gap-4 mt-4 pt-3.5"
            style={{ borderTop: '1px dashed #FED7AA' }}
          >
            <div className="text-[13px] text-text-secondary">
              Next wave in{' '}
              <span
                className="font-mono-num font-semibold"
                style={{ color: '#9A3412' }}
              >
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => onOverride(cascade.callout.id)}
              className="bg-transparent border-0 cursor-pointer text-[13px] font-semibold inline-flex items-center gap-1.5"
              style={{ color: '#EA580C' }}
            >
              Override
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 6h6m0 0L6.5 3.5M9 6L6.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useCountdown(targetISO: string | null): number {
  const [tick, setTick] = useState(() => {
    if (!targetISO) return 0;
    return Math.max(0, Math.floor((new Date(targetISO).getTime() - Date.now()) / 1000));
  });
  useEffect(() => {
    const id = setInterval(() => {
      setTick((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return tick;
}
