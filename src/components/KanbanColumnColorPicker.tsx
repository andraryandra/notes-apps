import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/useI18n';
import { isValidHexColor, KANBAN_COLUMN_COLORS } from '../utils/kanbanColumnColors';
import './KanbanColumnColorPicker.css';

interface Props {
  value: string;
  onChange: (color: string) => void;
}

function computePopoverStyle(trigger: HTMLButtonElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(240, window.innerWidth - 24);
  let left = rect.left;
  if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
  left = Math.max(12, left);
  const top = rect.bottom + 8;
  return { position: 'fixed', left, top, width, zIndex: 10060 };
}

export function KanbanColumnColorPicker({ value, onChange }: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const [custom, setCustom] = useState(value);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopoverStyle(computePopoverStyle(triggerRef.current));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onMove = () => updatePosition();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) setCustom(value);
  }, [open, value]);

  const applyCustom = () => {
    const next = custom.startsWith('#') ? custom : `#${custom}`;
    if (isValidHexColor(next)) {
      onChange(next);
      setOpen(false);
    }
  };

  const popover = open ? (
    <div
      ref={popoverRef}
      className="kanban-col-color-popover"
      style={popoverStyle}
      role="dialog"
      aria-label={t('kanban.columnColor')}
    >
      <p className="kanban-col-color-label">{t('kanban.columnColorPresets')}</p>
      <div className="kanban-col-color-swatches">
        {KANBAN_COLUMN_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`kanban-col-color-swatch ${value === c ? 'is-active' : ''}`}
            style={{ background: c }}
            onClick={() => {
              onChange(c);
              setOpen(false);
            }}
            title={c}
            aria-label={c}
          />
        ))}
      </div>
      <p className="kanban-col-color-label">{t('kanban.columnColorCustom')}</p>
      <div className="kanban-col-color-custom">
        <input
          type="color"
          className="kanban-col-color-native"
          value={isValidHexColor(custom) ? custom : value}
          onChange={(e) => {
            setCustom(e.target.value);
            onChange(e.target.value);
            setOpen(false);
          }}
          aria-label={t('kanban.columnColorCustom')}
        />
        <input
          type="text"
          className="kanban-col-color-hex"
          value={custom}
          onChange={(e) => setCustom(e.target.value.trim())}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          placeholder="#8b5cf6"
          spellCheck={false}
        />
        <button type="button" className="kanban-col-color-apply" onClick={applyCustom}>
          {t('kanban.save')}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`kanban-col-color-picker ${open ? 'is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="kanban-col-color-trigger"
        style={{ background: value }}
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (next) requestAnimationFrame(() => updatePosition());
            return next;
          });
        }}
        title={t('kanban.columnColor')}
        aria-label={t('kanban.columnColor')}
        aria-expanded={open}
      />
      {popover && createPortal(popover, document.body)}
    </div>
  );
}
