import type { AssignmentSlot, AssignmentStatus } from './types';

export interface StatusMeta {
  label: string;
  dot: string;
  fill: string;
  text: string;
  border: string;
}

export const STATUS_META: Record<AssignmentStatus, StatusMeta> = {
  unassigned:  { label: 'Unassigned',  dot: '#A1A1AA', fill: '#F4F4F1', text: '#71717A', border: '#E8E6E1' },
  notified:    { label: 'Notified',    dot: '#CA8A04', fill: '#FEF9E7', text: '#854D0E', border: '#FDE68A' },
  initial_yes: { label: 'Initial yes', dot: '#2563EB', fill: '#EFF4FF', text: '#1E3A8A', border: '#BFDBFE' },
  confirmed:   { label: 'Confirmed',   dot: '#16A34A', fill: '#ECFDF5', text: '#14532D', border: '#A7F3D0' },
  callout:     { label: 'Cascade',     dot: '#EA580C', fill: '#FFF1E6', text: '#9A3412', border: '#FED7AA' },
  covered:     { label: 'Covered',     dot: '#16A34A', fill: '#ECFDF5', text: '#14532D', border: '#A7F3D0' },
  unfilled:    { label: 'Unfilled',    dot: '#DC2626', fill: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
};

// Higher-attention statuses come first; rollup picks the first that any slot has.
const ROLLUP_PRIORITY: AssignmentStatus[] = [
  'callout',
  'unfilled',
  'unassigned',
  'notified',
  'initial_yes',
  'covered',
  'confirmed',
];

export function rollupStatus(slots: AssignmentSlot[]): AssignmentStatus {
  if (slots.length === 0) return 'unassigned';
  for (const s of ROLLUP_PRIORITY) {
    if (slots.some((slot) => slot.assignment.status === s)) return s;
  }
  return 'unassigned';
}

export const INTENT_META: Record<string, { fill: string; text: string; border: string }> = {
  question:     { fill: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  availability: { fill: '#FEF9E7', text: '#854D0E', border: '#FDE68A' },
  callout:      { fill: '#FFF1E6', text: '#9A3412', border: '#FED7AA' },
  confirmation: { fill: '#ECFDF5', text: '#14532D', border: '#A7F3D0' },
  unclear:      { fill: '#F4F4F1', text: '#52525B', border: '#E8E6E1' },
};
