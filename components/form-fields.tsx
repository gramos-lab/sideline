'use client';

import { useEffect, useState } from 'react';

const inputCls =
  'w-full px-3 py-2 border border-border-subtle rounded-md text-[14px] outline-none focus:border-border-emphasis bg-surface';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-section-label text-text-quaternary uppercase mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-text-quaternary mt-1">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'time' | 'tel' | 'email' | 'number';
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} ${className ?? ''} ${
        type === 'date' || type === 'time' || type === 'number' ? 'font-mono-num' : ''
      }`}
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} min-h-[64px] resize-y`}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={inputCls}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ChipPicker({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  function toggle(opt: string) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt].sort());
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className="px-2.5 py-1 rounded-full text-[12px] font-medium border cursor-pointer transition-colors"
            style={{
              borderColor: on ? '#18181B' : '#E8E6E1',
              background: on ? '#18181B' : '#fff',
              color: on ? '#FAFAF9' : '#52525B',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ColorSwatch({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c}
          className="w-7 h-7 rounded-full cursor-pointer"
          style={{
            background: c,
            outline: value === c ? '2px solid #18181B' : 'none',
            outlineOffset: 2,
          }}
        />
      ))}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ml-2 px-2 py-1 border border-border-subtle rounded-md text-[12px] font-mono-num w-[88px] outline-none"
      />
    </div>
  );
}

export function FormFooter({
  onCancel,
  onSubmit,
  submitLabel,
  disabled,
  danger,
  onDelete,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
  danger?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 mt-5">
      {onDelete && (
        <button
          onClick={onDelete}
          className="bg-transparent text-[#DC2626] border-0 px-1 py-2 text-[13px] font-medium cursor-pointer"
        >
          Delete
        </button>
      )}
      <div className="flex-1" />
      <button
        onClick={onCancel}
        className="bg-transparent text-text-secondary border border-border-subtle px-3.5 py-2 rounded-md text-[13px] font-medium cursor-pointer"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="bg-ink text-bg border-0 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer disabled:opacity-50"
        style={danger ? { background: '#DC2626' } : undefined}
      >
        {submitLabel}
      </button>
    </div>
  );
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
