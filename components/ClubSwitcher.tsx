'use client';

import { useEffect, useRef, useState } from 'react';
import type { Club } from '@/lib/types';

export const ALL_SLUG = '__all';

export function ClubSwitcher({
  clubs,
  activeSlug,
  activeName,
  activeColor,
  isAll,
  onSelect,
  onAddClub,
  onEditClub,
}: {
  clubs: Club[];
  activeSlug: string;
  activeName: string;
  activeColor: string;
  isAll: boolean;
  onSelect: (slug: string) => void;
  onAddClub: () => void;
  onEditClub: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-[7px] pl-2.5 pr-2 py-[5px] rounded-full border border-border-emphasis bg-surface text-[12px] font-medium text-ink hover:bg-bg transition-colors"
      >
        {isAll ? <StackedDots clubs={clubs} /> : (
          <span className="w-[9px] h-[9px] rounded-full" style={{ background: activeColor }} />
        )}
        {activeName}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[240px] bg-surface border border-border-subtle rounded-[10px] p-1.5 shadow-dropdown animate-sl-fade">
          <button
            onClick={() => {
              onSelect(ALL_SLUG);
              setOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-ink text-left ${
              isAll ? 'bg-border-hairline' : 'hover:bg-border-hairline'
            }`}
          >
            <StackedDots clubs={clubs} />
            <span className="flex-1">All clubs</span>
            <span className="text-[11px] text-text-quaternary tabular">{clubs.length}</span>
            {isAll && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6.5L5 9L9.5 3.5"
                  stroke="#16A34A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <div className="h-px bg-border-subtle mx-1 my-1.5" />
          {clubs.map((c) => {
            const isActive = !isAll && c.slug === activeSlug;
            return (
              <div
                key={c.id}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-ink ${
                  isActive ? 'bg-border-hairline' : 'hover:bg-border-hairline'
                }`}
              >
                <button
                  onClick={() => {
                    onSelect(c.slug);
                    setOpen(false);
                  }}
                  className="flex-1 flex items-center gap-2.5 bg-transparent border-0 cursor-pointer text-left p-0 text-[13px] text-ink"
                >
                  <span
                    className="w-[9px] h-[9px] rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.5L5 9L9.5 3.5"
                        stroke="#16A34A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <button
                  aria-label={`Edit ${c.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClub(c.slug);
                    setOpen(false);
                  }}
                  className="w-6 h-6 grid place-items-center rounded-md bg-transparent border-0 text-text-quaternary cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-border-subtle hover:text-text-secondary transition-opacity"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M11.5 2.5l2 2L6 12l-2.5.5.5-2.5 7.5-7.5z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
          <div className="h-px bg-border-subtle mx-1 my-1.5" />
          <button
            onClick={() => {
              setOpen(false);
              onAddClub();
            }}
            className="w-full text-left px-2.5 py-2 rounded-md text-[13px] text-ink hover:bg-border-hairline cursor-pointer"
          >
            + Add club
          </button>
        </div>
      )}
    </div>
  );
}

function StackedDots({ clubs }: { clubs: Club[] }) {
  const swatch = clubs.slice(0, 3);
  while (swatch.length < 3) {
    swatch.push({ id: 'pad', name: '', slug: 'pad', color: '#D4D2CC', active: true });
  }
  return (
    <span className="inline-flex items-center" style={{ width: 18, height: 9 }}>
      {swatch.map((c, i) => (
        <span
          key={i}
          className="w-[9px] h-[9px] rounded-full inline-block"
          style={{
            background: c.color,
            marginLeft: i === 0 ? 0 : -4,
            border: '1.5px solid #fff',
            zIndex: 3 - i,
          }}
        />
      ))}
    </span>
  );
}
