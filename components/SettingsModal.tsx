'use client';

import { useEffect, useRef, useState } from 'react';
import type { Club, SystemSettings, Trainer } from '@/lib/types';
import { ModalShell } from './ModalShell';

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onChange,
  club,
  trainers,
  onAddTrainer,
  onEditTrainer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: SystemSettings;
  onChange: (next: Partial<SystemSettings>) => void;
  club: Club;
  trainers: Trainer[];
  onAddTrainer: () => void;
  onEditTrainer: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <ModalShell onClose={() => onOpenChange(false)} width={560} title="Settings" subtitle={club.name}>
      <div className="px-6 pb-6 flex flex-col gap-7">
        <Section title="Roster">
          <div className="rounded-md border border-border-subtle overflow-hidden">
            <div className="max-h-[180px] overflow-y-auto">
              {trainers.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-text-quaternary">
                  No trainers yet. Add one to start scheduling.
                </div>
              ) : (
                trainers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onEditTrainer(t.id)}
                    className="w-full grid items-center gap-2 px-3 py-2 hover:bg-border-hairline text-left bg-transparent border-0 cursor-pointer border-b border-border-hairline last:border-b-0"
                    style={{ gridTemplateColumns: '1fr auto auto' }}
                  >
                    <div>
                      <div className="text-[13px] font-medium text-ink">{t.full_name}</div>
                      <div className="text-[11px] text-text-quaternary font-mono-num">
                        {t.phone} · {t.cert_level ?? 'no cert'} · {(t.age_groups ?? []).join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-px">
                      {[1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="text-[10px] leading-none"
                          style={{
                            color: i <= 4 - t.priority_tier ? '#CA8A04' : '#E8E6E1',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-text-tertiary font-mono-num">
                      {t.hours_this_week ?? 0}h
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={onAddTrainer}
              className="bg-ink text-bg border-0 px-3 py-1.5 rounded-md text-[12px] font-medium cursor-pointer"
            >
              + Add trainer
            </button>
          </div>
        </Section>

        <Section title="System">
          <Row label="Agent enabled" sub="Master switch for outbound texts.">
            <Switch on={settings.agent_enabled} onChange={(v) => onChange({ agent_enabled: v })} />
          </Row>
          <Row label="Approval mode" sub="Every outbound text waits for your tap.">
            <Switch on={settings.approval_mode} onChange={(v) => onChange({ approval_mode: v })} />
          </Row>
        </Section>
        <Section title="Cascade">
          <Row label="Wave size">
            <NumInput value={settings.wave_size} onCommit={(v) => onChange({ wave_size: v })} />
          </Row>
          <Row label="Wait minutes between waves">
            <NumInput
              value={settings.wave_wait_minutes}
              onCommit={(v) => onChange({ wave_wait_minutes: v })}
            />
          </Row>
          <Row label="Max waves">
            <NumInput value={settings.max_waves} onCommit={(v) => onChange({ max_waves: v })} />
          </Row>
        </Section>
        <Section title="Reminders">
          <Row label="Hours before session">
            <NumInput
              value={settings.reminder_hours_before}
              onCommit={(v) => onChange({ reminder_hours_before: v })}
            />
          </Row>
        </Section>
        <Section title="Limits">
          <Row label="Max texts / hour">
            <NumInput
              value={settings.max_outbound_per_hour}
              onCommit={(v) => onChange({ max_outbound_per_hour: v })}
            />
          </Row>
          <Row label="Loop threshold">
            <NumInput
              value={settings.loop_threshold}
              onCommit={(v) => onChange({ loop_threshold: v })}
            />
          </Row>
        </Section>
        <Section title="Escalation">
          <Row label="Phone">
            <PhoneInput
              value={settings.escalation_phone ?? ''}
              onCommit={(v) => onChange({ escalation_phone: v })}
            />
          </Row>
        </Section>
        <div className="flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="bg-ink text-bg border-0 px-[18px] py-2 rounded-md text-[13px] font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-section-label text-text-quaternary uppercase mb-3">{title}</div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[14px] text-ink">{label}</div>
        {sub && <div className="text-[12px] text-text-quaternary mt-0.5">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative w-9 h-5 rounded-full border-0 cursor-pointer"
      style={{ background: on ? '#16A34A' : '#D4D2CC', transition: 'background 200ms' }}
    >
      <span
        className="absolute w-4 h-4 rounded-full bg-white"
        style={{
          top: 2,
          left: on ? 18 : 2,
          transition: 'left 160ms cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

function NumInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(String(value));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <input
      type="number"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(Number(e.target.value) || 0), 500);
      }}
      className="px-2.5 py-1.5 border border-border-subtle rounded-md text-[13px] outline-none w-[70px] text-right font-mono-num"
    />
  );
}

function PhoneInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setLocal(value), [value]);
  return (
    <input
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(e.target.value), 500);
      }}
      placeholder="+1 555 010 9999"
      className="px-2.5 py-1.5 border border-border-subtle rounded-md text-[13px] outline-none w-[160px] font-mono-num"
    />
  );
}
