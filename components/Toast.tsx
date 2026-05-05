'use client';

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 px-[18px] py-2.5 bg-ink text-bg text-[13px] rounded-lg shadow-toast z-[100] animate-sl-toast"
      style={{ transform: 'translateX(-50%)' }}
    >
      {message}
    </div>
  );
}
