'use client';

import type { Club } from '@/lib/types';
import { ClubSwitcher } from './ClubSwitcher';

export function PageHeader({
  clubs,
  activeSlug,
  activeName,
  activeColor,
  isAll,
  agentEnabled,
  isLive,
  onSelectClub,
  onAddClub,
  onEditClub,
  onOpenSettings,
}: {
  clubs: Club[];
  activeSlug: string;
  activeName: string;
  activeColor: string;
  isAll: boolean;
  agentEnabled: boolean;
  isLive: boolean;
  onSelectClub: (slug: string) => void;
  onAddClub: () => void;
  onEditClub: (slug: string) => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-6 py-2.5 border-b border-border-subtle bg-bg sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-[22px] h-[22px] rounded-[5px] bg-ink grid place-items-center text-bg font-mono text-[11px] font-bold tracking-[-0.04em]">
          S
        </div>
        <div className="text-page-title">Sideline</div>
        <div className="text-[11px] text-text-quaternary pt-0.5">
          {isAll ? 'Master schedule · all clubs' : 'Coverage & scheduling'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px]"
          style={{
            borderColor: isLive ? '#A7F3D0' : '#E8E6E1',
            background: isLive ? '#ECFDF5' : '#F4F4F1',
            color: isLive ? '#14532D' : '#52525B',
          }}
          title={isLive ? 'Connected to Supabase — real data' : 'Demo mode — fixture data only'}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: isLive ? '#16A34A' : '#A1A1AA',
              boxShadow: isLive ? '0 0 0 2px rgba(22,163,74,0.15)' : 'none',
            }}
          />
          {isLive ? 'Live' : 'Demo'}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-subtle bg-surface text-[11px] text-text-secondary">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: agentEnabled ? '#16A34A' : '#A1A1AA',
              boxShadow: agentEnabled ? '0 0 0 2px rgba(22,163,74,0.15)' : 'none',
            }}
          />
          {agentEnabled ? 'Agent on' : 'Agent paused'}
        </span>

        <ClubSwitcher
          clubs={clubs}
          activeSlug={activeSlug}
          activeName={activeName}
          activeColor={activeColor}
          isAll={isAll}
          onSelect={onSelectClub}
          onAddClub={onAddClub}
          onEditClub={onEditClub}
        />

        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="w-7 h-7 rounded-full border border-border-subtle bg-surface grid place-items-center hover:bg-border-hairline transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="#52525B" strokeWidth="1.4" />
            <path
              d="M13 8a5.4 5.4 0 00-.07-.85l1.18-.92-1.5-2.6-1.4.56a5 5 0 00-1.46-.85L9.5 1.8h-3l-.25 1.54a5 5 0 00-1.46.85l-1.4-.56-1.5 2.6 1.18.92A5.4 5.4 0 003 8c0 .29.02.57.07.85L1.89 9.77l1.5 2.6 1.4-.56a5 5 0 001.46.85L6.5 14.2h3l.25-1.54a5 5 0 001.46-.85l1.4.56 1.5-2.6-1.18-.92c.05-.28.07-.56.07-.85z"
              stroke="#52525B"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
