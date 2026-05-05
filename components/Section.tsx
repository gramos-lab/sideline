export function Section({
  label,
  count,
  accent,
  children,
}: {
  label: string;
  count?: number;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2.5 mb-2 pl-1">
        <div
          className="text-section-label uppercase"
          style={{ color: accent || '#18181B' }}
        >
          {label}
        </div>
        {typeof count === 'number' && (
          <div className="text-[11px] text-text-quaternary">{count}</div>
        )}
      </div>
      {children}
    </section>
  );
}
