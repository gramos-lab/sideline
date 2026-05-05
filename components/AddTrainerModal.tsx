'use client';

import { useState } from 'react';
import type { Club, Trainer } from '@/lib/types';
import { ModalShell } from './ModalShell';
import {
  ChipPicker,
  Field,
  FormFooter,
  Select,
  TextInput,
} from './form-fields';
import { AGE_GROUPS } from './AddSessionModal';

const CERTS = ['', 'USSF E', 'USSF D', 'USSF C', 'USSF B', 'USSF A'];

export interface TrainerFormValues {
  full_name: string;
  phone: string;
  email: string | null;
  cert_level: string | null;
  age_groups: string[];
  priority_tier: number;
  max_hours_week: number;
}

export function AddTrainerModal({
  mode,
  initial,
  club,
  onClose,
  onSubmit,
  onDelete,
}: {
  mode: 'add' | 'edit';
  initial?: Partial<TrainerFormValues>;
  club: Club;
  onClose: () => void;
  onSubmit: (values: TrainerFormValues) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.full_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [cert, setCert] = useState(initial?.cert_level ?? 'USSF D');
  const [ages, setAges] = useState<string[]>(initial?.age_groups ?? []);
  const [tier, setTier] = useState<number>(initial?.priority_tier ?? 2);
  const [maxHours, setMaxHours] = useState<string>(String(initial?.max_hours_week ?? 20));

  const phoneClean = phone.replace(/[^\d+]/g, '');
  const valid =
    name.trim().length > 0 &&
    phoneClean.length >= 10 &&
    ages.length > 0 &&
    Number(maxHours) > 0;

  function submit() {
    if (!valid) return;
    onSubmit({
      full_name: name.trim(),
      phone: phoneClean.startsWith('+') ? phoneClean : `+1${phoneClean}`,
      email: email.trim() || null,
      cert_level: cert || null,
      age_groups: ages,
      priority_tier: tier,
      max_hours_week: Number(maxHours) || 20,
    });
  }

  return (
    <ModalShell
      onClose={onClose}
      width={520}
      title={mode === 'add' ? 'New trainer' : 'Edit trainer'}
      subtitle={club.name}
    >
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name">
            <TextInput value={name} onChange={setName} placeholder="Maria Alvarez" autoFocus />
          </Field>
          <Field label="Phone" hint="US numbers can be entered as 5550101234.">
            <TextInput value={phone} onChange={setPhone} placeholder="+15550101234" type="tel" />
          </Field>
          <Field label="Email (optional)">
            <TextInput value={email ?? ''} onChange={setEmail} placeholder="maria@example.com" type="email" />
          </Field>
          <Field label="Cert level">
            <Select
              value={cert ?? ''}
              onChange={setCert}
              options={CERTS.map((c) => ({ value: c, label: c || 'Uncertified' }))}
            />
          </Field>
          <Field label="Tier" hint="1 = preferred, 3 = backup.">
            <Select
              value={String(tier)}
              onChange={(v) => setTier(Number(v))}
              options={[
                { value: '1', label: 'Tier 1 — preferred' },
                { value: '2', label: 'Tier 2 — regular' },
                { value: '3', label: 'Tier 3 — backup' },
              ]}
            />
          </Field>
          <Field label="Max hours / week">
            <TextInput type="number" value={maxHours} onChange={setMaxHours} />
          </Field>
          <div className="col-span-2">
            <Field label="Age groups" hint="Used for cascade eligibility.">
              <ChipPicker value={ages} onChange={setAges} options={AGE_GROUPS} />
            </Field>
          </div>
        </div>

        <FormFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel={mode === 'add' ? 'Add trainer' : 'Save trainer'}
          disabled={!valid}
          onDelete={mode === 'edit' ? onDelete : undefined}
        />
      </div>
    </ModalShell>
  );
}
