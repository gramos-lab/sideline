'use client';

export function ApprovalBanner({
  count,
  onApproveAll,
  onReview,
}: {
  count: number;
  onApproveAll: () => void;
  onReview: () => void;
}) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-3.5 px-8 py-2.5 bg-ink text-bg text-[13px]">
      <div className="inline-flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#FDE68A]"
          style={{ boxShadow: '0 0 0 3px rgba(253,230,138,0.2)' }}
        />
        <span className="font-medium">
          {count} message{count === 1 ? '' : 's'} pending approval
        </span>
      </div>
      <span className="text-text-tertiary">·</span>
      <span className="text-text-quaternary">
        Approval mode is on. Nothing sends without your tap.
      </span>
      <div className="ml-auto flex gap-4">
        <button
          onClick={onReview}
          className="bg-transparent text-bg border-0 text-[13px] font-medium cursor-pointer"
        >
          Review
        </button>
        <button
          onClick={onApproveAll}
          className="bg-bg text-ink border-0 px-3 py-1 rounded-md text-[13px] font-semibold cursor-pointer"
        >
          Approve all
        </button>
      </div>
    </div>
  );
}
