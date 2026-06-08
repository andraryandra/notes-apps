import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Folder, FolderOpen, FolderTree, Search, X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import type { Folder as FolderType } from '../types';
import { buildFolderSelectItems, getFolderPathLabel } from '../utils/folderOptions';
import './FolderPicker.css';

interface Props {
  folders: FolderType[];
  value: string | null;
  onChange: (folderId: string | null) => void;
  className?: string;
  disabled?: boolean;
  /** Lebar minimum popover (berguna di dialog pindah folder) */
  popoverMinWidth?: number;
}

const POPOVER_Z = 10000;
const LIST_MAX = 260;

function computePopoverStyle(
  trigger: HTMLButtonElement,
  minWidth: number
): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const width = Math.max(rect.width, minWidth);
  const left = Math.min(rect.left, window.innerWidth - width - 8);
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
  const listMax = Math.min(LIST_MAX, Math.max(140, openUp ? spaceAbove - 58 : spaceBelow - 58));

  const base: CSSProperties = {
    position: 'fixed',
    left: Math.max(8, left),
    width,
    zIndex: POPOVER_Z,
    maxHeight: listMax + 58,
  };

  if (openUp) {
    return { ...base, bottom: window.innerHeight - rect.top + gap };
  }
  return { ...base, top: rect.bottom + gap };
}

export function FolderPicker({
  folders,
  value,
  onChange,
  className = '',
  disabled = false,
  popoverMinWidth = 300,
}: Props) {
  const { t } = useI18n();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const items = useMemo(() => buildFolderSelectItems(folders), [folders]);
  const selectedPath = value ? getFolderPathLabel(folders, value) : '';
  const selectedItem = value ? items.find((f) => f.id === value) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
    );
  }, [items, query]);

  const updatePopoverPosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopoverStyle(computePopoverStyle(triggerRef.current, popoverMinWidth));
  }, [popoverMinWidth]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
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
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const pick = (folderId: string | null) => {
    onChange(folderId);
    setOpen(false);
    setQuery('');
  };

  const popover = open ? (
    <div
      ref={popoverRef}
      className="folder-picker-popover"
      style={popoverStyle}
      role="presentation"
    >
      <div className="folder-picker-search">
        <Search size={15} className="folder-picker-search-icon" aria-hidden />
        <input
          ref={searchRef}
          type="search"
          className="folder-picker-search-input"
          placeholder={t('folderPicker.search')}
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
            className="folder-picker-clear-search"
            onClick={() => setQuery('')}
            aria-label={t('folderPicker.clearSearch')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <ul id={listId} className="folder-picker-list" role="listbox">
        <li role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={`folder-picker-option folder-picker-option--root ${!value ? 'is-selected' : ''}`}
            onClick={() => pick(null)}
          >
            <FolderTree size={15} className="folder-picker-option-icon" aria-hidden />
            <span className="folder-picker-option-text">
              <span className="folder-picker-option-name">{t('folderPicker.noFolder')}</span>
              <span className="folder-picker-option-path">{t('folderPicker.noFolderHint')}</span>
            </span>
            {!value && <Check size={16} className="folder-picker-check" aria-hidden />}
          </button>
        </li>

        {filtered.length === 0 ? (
          <li className="folder-picker-empty">{t('folderPicker.noResults')}</li>
        ) : (
          filtered.map((item) => {
            const active = item.id === value;
            const searching = query.trim().length > 0;
            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`folder-picker-option ${active ? 'is-selected' : ''}`}
                  style={{ paddingLeft: searching ? 12 : 10 + item.depth * 18 }}
                  onClick={() => pick(item.id)}
                  title={item.path}
                >
                  {!searching && item.depth > 0 && (
                    <span className="folder-picker-tree-guide" aria-hidden />
                  )}
                  {active ? (
                    <FolderOpen size={15} className="folder-picker-option-icon" aria-hidden />
                  ) : (
                    <Folder size={15} className="folder-picker-option-icon" aria-hidden />
                  )}
                  <span className="folder-picker-option-text">
                    <span className="folder-picker-option-name">{item.name}</span>
                    {(searching || item.depth > 0) && (
                      <span className="folder-picker-option-path">{item.path}</span>
                    )}
                  </span>
                  {active && <Check size={16} className="folder-picker-check" aria-hidden />}
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
      className={`folder-picker ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="folder-picker-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        title={selectedPath || t('folderPicker.placeholder')}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => {
            const next = !o;
            if (next) requestAnimationFrame(() => updatePopoverPosition());
            return next;
          });
        }}
      >
        <FolderOpen size={14} className="folder-picker-trigger-icon" aria-hidden />
        <span className="folder-picker-trigger-text">
          {selectedItem ? (
            <>
              <span className="folder-picker-trigger-name">{selectedItem.name}</span>
              {selectedItem.depth > 0 && (
                <span className="folder-picker-trigger-path">{selectedPath}</span>
              )}
            </>
          ) : (
            <span className="folder-picker-trigger-placeholder">{t('folderPicker.placeholder')}</span>
          )}
        </span>
        <ChevronDown size={16} className="folder-picker-chevron" aria-hidden />
      </button>

      {popover && createPortal(popover, document.body)}
    </div>
  );
}
