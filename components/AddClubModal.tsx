'use client';

import { useState } from 'react';
import { ModalShell } from './ModalShell';
import { ColorSwatch, Field, FormFooter, TextInput } from './form-fields';

const COLORS = ['#1E40AF', '#0F766E', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0EA5E9', '#DC2626'];

export interface ClubFormValues {
  name: string;
  slug: string;
  short: string;
  color: string;
}

export function AddClubModal({
  mode,
  initial,
  onClose,
  onSubmit,
  onDelete,
  takenSlugs,
  isFixture,
}: {
  mode: 'add' | 'edit';
  initial?: Partial<ClubFormValues>;
  onClose: () => void;
  onSubmit: (v: ClubFormValues) => void;
  onDelete?: () => void;
  takenSlugs: string[];
  isFixture?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [short, setShort] = useState(initial?.short ?? '');
  const [color, setColor] = useState(initial?.color ?? COLORS[2]);
  const [touched, setTouched] = useState(mode === 'edit');

  const autoSlug = slugify(name);
  const finalSlug = (slug.trim() || autoSlug).toLowerCase();
  const slugCollides = finalSlug !== initial?.slug && takenSlugs.includes(finalSlug);
  const slugOk = finalSlug.length >= 2 && !slugCollides;
  const valid = name.trim().length >= 2 && short.trim().length > 0 && slugOk;

  return (
    <ModalShell
      onClose={onClose}
      width={520}
      title={mode === 'add' ? 'New club' : 'Edit club'}
      subtitle={isFixture ? 'Built-in club — appearance only is editable.' : undefined}
    >
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Name">
              <TextInput
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (!touched) setSlug(slugify(v));
                }}
                placeholder="Sands Point United"
                autoFocus
              />
            </Field>
          </div>
          <Field label="Short code" hint="Shown on calendar chips.">
            <TextInput
              value={short}
              onChange={(v) => setShort(v.toUpperCase().slice(0, 4))}
              placeholder="SPU"
            />
          </Field>
          <Field
            label="Slug"
            hint={isFixture ? 'Slug is locked for built-in clubs.' : 'URL-safe. Auto-filled from name.'}
          >
            <TextInput
              value={slug || autoSlug}
              onChange={(v) => {
                if (isFixture) return;
                setTouched(true);
                setSlug(slugify(v));
              }}
              placeholder="sands-point-united"
            />
          </Field>
          <div className="col-span-2">
            <Field label="Accent color">
              <ColorSwatch value={color} onChange={setColor} options={COLORS} />
            </Field>
          </div>
        </div>

        {slugCollides && (
          <div className="mt-3 text-[12px] text-[#9A3412]">
            That slug is taken. Pick something else.
          </div>
        )}

        <FormFooter
          onCancel={onClose}
          onSubmit={() =>
            onSubmit({
              name: name.trim(),
              slug: isFixture ? (initial?.slug ?? finalSlug) : finalSlug,
              short: short.trim().toUpperCase().slice(0, 4),
              color,
            })
          }
          submitLabel={mode === 'add' ? 'Create club' : 'Save club'}
          disabled={!valid}
          onDelete={mode === 'edit' && !isFixture ? onDelete : undefined}
        />
      </div>
    </ModalShell>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
