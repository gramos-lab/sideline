import { STATUS_META } from '@/lib/status';
import type { AssignmentStatus } from '@/lib/types';
import { StatusDot } from './StatusDot';

export function StatusPill({ status }: { status: AssignmentStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[11px] font-semibold uppercase tracking-[0.02em] whitespace-nowrap border"
      style={{
        background: meta.fill,
        color: meta.text,
        borderColor: meta.border,
      }}
    >
      <StatusDot status={status} size={6} />
      {meta.label}
    </span>
  );
}
