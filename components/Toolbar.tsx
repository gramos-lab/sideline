'use client';

export type ViewMode = 'grid' | 'list';

export function Toolbar({
  view,
  onView,
  onSendWeek,
  onSendReminders,
  onAddSession,
  isAll,
}: {
  view: ViewMode;
  onView: (v: ViewMode) => void;
  onSendWeek: () => void;
  onSendReminders: () => void;
  onAddSession: () => void;
  isAll?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-2 border-y border-border-subtle bg-surface">
      <div className="flex items-center text-[13px] font-medium text-ink">
        <button
          onClick={onSendWeek}
          disabled={isAll}
          title={isAll ? 'Switch to a single club to send week' : undefined}
          className="sl-sep bg-transparent border-0 cursor-pointer py-1 disabled:cursor-not-allowed"
          style={{ color: isAll ? '#A1A1AA' : '#18181B' }}
        >
          Send week
        </button>
        <button
          onClick={onSendReminders}
          disabled={isAll}
          title={isAll ? 'Switch to a single club to send reminders' : undefined}
          className="sl-sep bg-transparent border-0 cursor-pointer py-1 disabled:cursor-not-allowed"
          style={{ color: isAll ? '#A1A1AA' : '#18181B' }}
        >
          Send reminders
        </button>
        <button
          onClick={onAddSession}
          disabled={isAll}
          title={isAll ? 'Switch to a single club to add a session' : undefined}
          className="sl-sep bg-transparent border-0 cursor-pointer py-1 disabled:cursor-not-allowed"
          style={{ color: isAll ? '#A1A1AA' : '#18181B' }}
        >
          + Add session
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {(['grid', 'list'] as const).map((k) => {
          const on = view === k;
          return (
            <button
              key={k}
              onClick={() => onView(k)}
              className="px-3 py-1.5 text-[12px] font-medium rounded-md cursor-pointer border transition-colors"
              style={{
                borderColor: on ? '#18181B' : '#E8E6E1',
                background: on ? '#18181B' : '#fff',
                color: on ? '#FAFAF9' : '#52525B',
              }}
            >
              {k === 'grid' ? 'Grid' : 'List'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
