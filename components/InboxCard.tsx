'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INTENT_META } from '@/lib/status';
import type { InboxItem } from '@/lib/types';

export function InboxCard({
  item,
  onReply,
  onDismiss,
}: {
  item: InboxItem;
  onReply: (id: string, body: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [hidden, setHidden] = useState(false);

  const trainer = item.trainer;
  const initials = trainer
    ? `${trainer.full_name.split(' ')[0][0]}${trainer.full_name.split(' ')[1]?.[0] ?? ''}`
    : '??';
  const intent = item.intent ?? 'unclear';
  const intentMeta = INTENT_META[intent] ?? INTENT_META.unclear;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          layout
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface border border-border-subtle rounded-[12px] p-5 shadow-card"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-full bg-border-hairline grid place-items-center text-[11px] font-semibold text-text-secondary">
              {initials.toUpperCase()}
            </div>
            <div className="text-[14px] font-medium text-ink">
              {trainer?.full_name ?? `Unknown · ${item.from_phone}`}
            </div>
            <span
              className="text-[10px] font-semibold tracking-[0.06em] uppercase px-1.5 py-[2px] rounded"
              style={{
                background: intentMeta.fill,
                color: intentMeta.text,
                border: `1px solid ${intentMeta.border}`,
              }}
            >
              {intent}
            </span>
            <div className="ml-auto text-[12px] text-text-quaternary">{item.received_at}</div>
          </div>
          <div className="text-[15px] text-ink leading-[1.4] pl-[38px]">“{item.body}”</div>
          <div className="pl-[38px] mt-3.5 flex gap-3.5">
            {!composing ? (
              <>
                <ActionLink onClick={() => setComposing(true)}>Reply</ActionLink>
                <Sep />
                <ActionLink
                  onClick={() => {
                    onDismiss(item.id);
                    setHidden(true);
                  }}
                >
                  Mark handled
                </ActionLink>
              </>
            ) : (
              <div className="flex-1">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a reply..."
                  className="w-full min-h-[64px] p-2.5 text-[14px] border border-border-subtle rounded-[8px] resize-y outline-none"
                />
                <div className="flex gap-2.5 mt-2">
                  <button
                    onClick={() => {
                      onReply(item.id, draft.trim());
                      setComposing(false);
                      setHidden(true);
                    }}
                    disabled={!draft.trim()}
                    className="px-3.5 py-1.5 text-[13px] font-medium bg-ink text-bg border-0 rounded-md cursor-pointer disabled:opacity-50"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setComposing(false)}
                    className="px-3.5 py-1.5 text-[13px] font-medium bg-transparent text-text-tertiary border-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent border-0 cursor-pointer p-0 text-[13px] font-medium text-ink border-b border-transparent"
      onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = '#18181B')}
      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="text-border-emphasis">·</span>;
}
