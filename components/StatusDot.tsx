import { cn } from '@/lib/utils';
import { STATUS_META } from '@/lib/status';
import type { AssignmentStatus } from '@/lib/types';

export function StatusDot({
  status,
  size = 10,
  pulse,
  className,
}: {
  status: AssignmentStatus;
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const shouldPulse = pulse ?? status === 'callout';
  return (
    <span
      className={cn('inline-block rounded-full shrink-0', shouldPulse && 'animate-sl-pulse', className)}
      style={{ width: size, height: size, background: meta.dot }}
      aria-hidden
    />
  );
}
