import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface GlassSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface GlassSelectProps<T extends string = string> {
  value: T | '';
  onChange: (value: T) => void;
  options: GlassSelectOption<T>[];
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  /** Renders a hidden input for native form + FormData. */
  name?: string;
  id?: string;
}

export function GlassSelect<T extends string = string>({
  value,
  onChange,
  options,
  disabled,
  className = '',
  buttonClassName = '',
  placeholder = 'Choose…',
  name,
  id,
}: GlassSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name !== undefined && <input type="hidden" name={name} value={value} readOnly aria-hidden />}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`glass-panel flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="glass-panel absolute z-[80] mt-1 max-h-60 w-full overflow-auto rounded-xl py-1 shadow-2xl"
        >
          {options.map((opt) => (
            <li key={String(opt.value)}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-emerald-500/10 hover:text-emerald-800"
              >
                {opt.label}
                {opt.value === value && <Check size={16} className="text-emerald-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
