import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} — ${formatTime(end)}`;
}

// Compact "5:00–6:30p" — single am/pm at the end
export function fmtTimeShort(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'p' : 'a';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, '0')}${ampm}`;
}

// "5:00–6:30" no suffix (used in calendar chips, am/pm implied by row position)
export function fmtRangeNoSuffix(start: string, end: string): string {
  const noSuffix = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${m.toString().padStart(2, '0')}`;
  };
  return `${noSuffix(start)}–${noSuffix(end)}`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(t: string): string {
  // accepts HH:mm or HH:mm:ss
  const [hStr, mStr] = t.split(':');
  let h = Number(hStr);
  const m = Number(mStr);
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  if (m === 0) return `${h}:00${ampm}`;
  return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
}

export function formatDayHeader(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00');
  const dow = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${dow} · ${month} ${d.getDate()}`;
}

export function formatWeekLabel(weekStart: Date): string {
  const month = weekStart.toLocaleDateString('en-US', { month: 'long' });
  return `Week of ${month} ${weekStart.getDate()}`;
}

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday-start
  out.setDate(out.getDate() + diff);
  return out;
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function firstName(full: string): string {
  return full.split(' ')[0];
}

// "U10" → 10; "5" → 5; non-numeric → null
function ageGroupNumber(s: string): number | null {
  const m = /^U?(\d+)$/i.exec(s.trim());
  if (!m) return null;
  return Number(m[1]);
}

// Display helper for sessions with one or more age groups.
// "U10"          → "U10"
// ["U10","U11","U12"] → "U10–U12" (contiguous)
// ["5","6","7"]  → "5–7"
// ["U10","U13"]  → "U10, U13"
export function formatAgeGroups(ages: string[] | undefined | null): string {
  if (!ages || ages.length === 0) return '—';
  if (ages.length === 1) return ages[0];
  const numeric = ages.map(ageGroupNumber);
  if (numeric.every((n) => n != null)) {
    const pairs = ages
      .map((label, i) => ({ label, n: numeric[i] as number }))
      .sort((a, b) => a.n - b.n);
    const contiguous = pairs.every((p, i) => i === 0 || p.n === pairs[i - 1].n + 1);
    if (contiguous) return `${pairs[0].label}–${pairs[pairs.length - 1].label}`;
  }
  return ages.join(', ');
}
