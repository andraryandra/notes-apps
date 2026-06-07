import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import './SearchableSelect.css';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyOption?: SearchableSelectOption;
  /** Default true. Set false untuk daftar pendek tanpa kotak cari. */
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

const POPOVER_Z = 10000;
const LIST_MAX_HEIGHT = 220;

function computePopoverStyle(trigger: HTMLButtonElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
  const listMax = Math.min(LIST_MAX_HEIGHT, Math.max(120, openUp ? spaceAbove - 52 : spaceBelow - 52));

  const base: CSSProperties = {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    zIndex: POPOVER_Z,
    maxHeight: listMax + 52,
  };

  if (openUp) {
    return { ...base, bottom: window.innerHeight - rect.top + gap };
  }
  return { ...base, top: rect.bottom + gap };
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih…',
  searchPlaceholder = 'Cari…',
  emptyOption,
  searchable = true,
  disabled = false,
  className = '',
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const allOptions = useMemo(() => {
    const list = emptyOption ? [emptyOption, ...options] : options;
    return list;
  }, [emptyOption, options]);

  const selected = allOptions.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false)
    );
  }, [allOptions, query]);

  const updatePopoverPosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopoverStyle(computePopoverStyle(triggerRef.current));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
      setQuery('');
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updatePopoverPosition();
    const onScrollOrResize = () => updatePopoverPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updatePopoverPosition]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    setQuery('');
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const popover = open ? (
    <div
      ref={popoverRef}
      className="searchable-select-popover searchable-select-popover--portal"
      style={popoverStyle}
      role="presentation"
    >
      {searchable && (
        <div className="searchable-select-search">
          <Search size={15} className="searchable-select-search-icon" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            className="searchable-select-search-input"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                setQuery('');
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="searchable-select-clear-search"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      <ul id={listId} className="searchable-select-list" role="listbox">
        {filtered.length === 0 ? (
          <li className="searchable-select-empty">Tidak ada hasil</li>
        ) : (
          filtered.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || '__empty'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`searchable-select-option ${active ? 'is-selected' : ''}`}
                  onClick={() => pick(opt.value)}
                >
                  <span className="searchable-select-option-text">
                    <span className="searchable-select-option-label">{opt.label}</span>
                    {opt.description && (
                      <span className="searchable-select-option-desc">{opt.description}</span>
                    )}
                  </span>
                  {active && <Check size={16} className="searchable-select-check" aria-hidden />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={`searchable-select ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="searchable-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => {
            const next = !o;
            if (next) requestAnimationFrame(() => updatePopoverPosition());
            return next;
          });
        }}
      >
        <span className={`searchable-select-value ${!selected ? 'is-placeholder' : ''}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className="searchable-select-chevron" aria-hidden />
      </button>

      {popover && createPortal(popover, document.body)}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function SegmentedSelect<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div className={`segmented-select ${className}`.trim()} role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`segmented-select-btn segmented-select-btn--${opt.value} ${value === opt.value ? 'is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
