'use client';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center text-text-tertiary max-w-[480px] mx-auto py-20 px-8">
      <div className="text-[16px] text-ink mb-2">No sessions this week.</div>
      <div className="text-[14px] leading-[1.5] mb-6">
        Add sessions one at a time, or paste a block from your spreadsheet.
      </div>
      <button
        onClick={onAdd}
        className="bg-ink text-bg border-0 px-[18px] py-[9px] rounded-md text-[13px] font-medium cursor-pointer"
      >
        + Add session
      </button>
      <div className="mt-3.5 text-[13px] text-text-quaternary">
        or paste a week from a spreadsheet
      </div>
    </div>
  );
}
