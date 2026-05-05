'use client';

import { useEffect } from 'react';

export function ModalShell({
  children,
  onClose,
  width = 480,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
  title: string;
  subtitle?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center animate-sl-fade"
      style={{ background: 'rgba(24,24,27,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-[14px] max-h-[90vh] overflow-auto shadow-modal animate-sl-pop"
        style={{ width }}
      >
        <div className="px-6 pt-5 pb-4 border-b border-border-hairline">
          <div className="text-[17px] font-semibold text-ink">{title}</div>
          {subtitle && <div className="text-[13px] text-text-tertiary mt-0.5">{subtitle}</div>}
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
