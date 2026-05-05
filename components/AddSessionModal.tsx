'use client';

import { useState } from 'react';
import type { Club, Session } from '@/lib/types';
import { ModalShell } from './ModalShell';
import {
  ChipPicker,
  Field,
  FormFooter,
  Select,
  Textarea,
  TextInput,
} from './form-fields';

const AGE_GROUPS = [
  'U5', 'U6', 'U7', 'U8', 'U9', 'U10',
  'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18',
];
const TYPES: { value: Session['session_type']; label: string }[] = [
  { value: 'practice', label: 'Practice' },
  { value: 'intramural', label: 'Intramural' },
  { value: 'tryout', label: 'Tryout' },
  { value: 'game', label: 'Game' },
  { value: 'camp', label: 'Camp' },
  { value: 'clinic', label: 'Clinic' },
];

export interface SessionFormValues {
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_groups: string[];
  program_name: string;
  session_type: Session['session_type'];
  required_cert_level: string | null;
  notes: string | null;
}

export function AddSessionModal({
  mode,
  initial,
  defaultDate,
  club,
  onClose,
  onSubmit,
  onDelete,
}: {
  mode: 'add' | 'edit';
  initial?: Partial<SessionFormValues>;
  defaultDate: string;
  club: Club;
  onClose: () => void;
  onSubmit: (values: SessionFormValues) => void;
  onDelete?: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [startT, setStartT] = useState(initial?.start_time ?? '17:00');
  const [endT, setEndT] = useState(initial?.end_time ?? '18:30');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [ages, setAges] = useState<string[]>(initial?.age_groups ?? ['U10']);
  const [program, setProgram] = useState(initial?.program_name ?? '');
  const [type, setType] = useState<Session['session_type']>(
    initial?.session_type ?? 'practice',
  );
  const [cert, setCert] = useState(initial?.required_cert_level ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const valid =
    date.length > 0 &&
    startT.length > 0 &&
    endT.length > 0 &&
    startT < endT &&
    location.trim().length > 0 &&
    program.trim().length > 0 &&
    ages.length > 0;

  function submit() {
    if (!valid) return;
    onSubmit({
      date,
      start_time: startT,
      end_time: endT,
      location: location.trim(),
      age_groups: ages,
      program_name: program.trim(),
      session_type: type,
      required_cert_level: cert.trim() || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <ModalShell
      onClose={onClose}
      width={560}
      title={mode === 'add' ? 'New session' : 'Edit session'}
      subtitle={club.name}
    >
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Program">
            <TextInput
              value={program}
              onChange={setProgram}
              placeholder="U10 Intramural"
              autoFocus
            />
          </Field>
          <Field label="Location">
            <TextInput value={location} onChange={setLocation} placeholder="Memorial Field" />
          </Field>
          <Field label="Date">
            <TextInput type="date" value={date} onChange={setDate} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <TextInput type="time" value={startT} onChange={setStartT} />
            </Field>
            <Field label="End">
              <TextInput type="time" value={endT} onChange={setEndT} />
            </Field>
          </div>
          <Field label="Type">
            <Select value={type} onChange={setType} options={TYPES} />
          </Field>
          <div className="col-span-2">
            <Field
              label="Age groups"
              hint="Pick one or more. A camp can cover U5–U12, for example."
            >
              <ChipPicker value={ages} onChange={setAges} options={AGE_GROUPS} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Required cert (optional)" hint="Trainers below this cert will be flagged ineligible.">
              <TextInput value={cert} onChange={setCert} placeholder="USSF E" />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Notes">
              <Textarea value={notes} onChange={setNotes} placeholder="Anything the trainer should know" />
            </Field>
          </div>
        </div>

        <FormFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel={mode === 'add' ? 'Create session' : 'Save changes'}
          disabled={!valid}
          onDelete={mode === 'edit' ? onDelete : undefined}
        />
      </div>
    </ModalShell>
  );
}

export { AGE_GROUPS };
