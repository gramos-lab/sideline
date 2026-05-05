'use client';

import { formatWeekLabel } from '@/lib/utils';

export function WeekNavigator({
  weekStart,
  onPrev,
  onNext,
  onJumpToday,
}: {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onJumpToday: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2.5 pt-2.5 pb-1.5">
      <button onClick={onPrev} aria-label="Previous week" className="sl-nav-btn">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L5 7L9 11" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={onJumpToday}
        className="bg-transparent border-0 cursor-pointer text-[14px] font-medium text-ink tracking-[-0.01em] px-1.5 py-0.5"
      >
        {formatWeekLabel(weekStart)}
      </button>
      <button onClick={onNext} aria-label="Next week" className="sl-nav-btn">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M5 3L9 7L5 11" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
