'use client';

import type { Club, SessionWithAssignment } from '@/lib/types';
import { ModalShell } from './ModalShell';

export function SendWeekModal({
  club,
  rows,
  onClose,
  onSend,
}: {
  club: Club;
  rows: SessionWithAssignment[];
  onClose: () => void;
  onSend: () => void;
}) {
  const toNotify = rows.filter((r) =>
    r.assignments.some((slot) =>
      ['unassigned', 'notified', 'initial_yes'].includes(slot.assignment.status),
    ),
  );
  return (
    <ModalShell onClose={onClose} width={520} title="Send week" subtitle={club.name}>
      <div className="px-6 pb-6">
        <div className="text-[14px] text-text-secondary leading-[1.5] mb-4">
          Send assignment texts to{' '}
          <strong className="text-ink">{toNotify.length} trainers</strong> covering{' '}
          <strong className="text-ink">{rows.length} sessions</strong> this week.
        </div>
        <div
          className="border border-border-subtle rounded-[8px] p-4 text-[13px] leading-[1.6] text-ink"
          style={{ background: '#FAFAF9', fontFamily: 'ui-monospace, "SF Mono", monospace' }}
        >
          Hey Maria — you’re scheduled this week:
          <br />
          Mon 4:00p U10 Intramural at Memorial
          <br />
          Tue 4:30p U10 Intramural at Memorial
          <br />
          Sat 9:00a U10 Game at Memorial
          <br />
          Reply YES to confirm. — {club.name}
        </div>
        <div className="flex gap-2.5 mt-5 justify-end">
          <button
            onClick={onClose}
            className="bg-transparent text-text-secondary border border-border-subtle px-3.5 py-2 rounded-md text-[13px] font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="bg-ink text-bg border-0 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer"
          >
            Send to {toNotify.length} trainers
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
