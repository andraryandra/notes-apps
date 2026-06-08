import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Table2,
  Rows3,
  Columns3,
  Trash2,
  Combine,
  SplitSquareHorizontal,
  PanelTop,
} from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import type { TableBorderStyle, TableBorderWidth } from '../extensions/NoteTable';
import './TableToolbarPanel.css';

const TABLE_MIN = 1;
const TABLE_MAX = 12;

interface Props {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}

export function TableToolbarPanel({ editor, open, onClose }: Props) {
  const { t } = useI18n();
  const inTable = editor.isActive('table');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeader, setWithHeader] = useState(true);
  const [, setSelectionTick] = useState(0);

  const tableAttrs = editor.getAttributes('table') as {
    borderWidth?: TableBorderWidth;
    borderStyle?: TableBorderStyle;
  };

  useEffect(() => {
    const refresh = () => setSelectionTick((n) => n + 1);
    editor.on('selectionUpdate', refresh);
    editor.on('transaction', refresh);
    return () => {
      editor.off('selectionUpdate', refresh);
      editor.off('transaction', refresh);
    };
  }, [editor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const clamp = (n: number) => Math.min(TABLE_MAX, Math.max(TABLE_MIN, n));

  const insertTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: clamp(rows), cols: clamp(cols), withHeaderRow: withHeader })
      .run();
    onClose();
  }, [editor, rows, cols, withHeader, onClose]);

  const setBorder = useCallback(
    (patch: Partial<{ borderWidth: TableBorderWidth; borderStyle: TableBorderStyle }>) => {
      editor.chain().focus().updateAttributes('table', patch).run();
    },
    [editor]
  );

  if (!open) return null;

  if (!inTable) {
    return (
      <div className="table-toolbar-panel" role="dialog" aria-label={t('richEditor.insertTable')}>
        <Table2 size={16} className="table-toolbar-panel-icon" aria-hidden />
        <label className="table-toolbar-field">
          <span>{t('richEditor.tableRows')}</span>
          <input
            type="number"
            min={TABLE_MIN}
            max={TABLE_MAX}
            value={rows}
            onChange={(e) => setRows(clamp(Number(e.target.value) || TABLE_MIN))}
          />
        </label>
        <label className="table-toolbar-field">
          <span>{t('richEditor.tableCols')}</span>
          <input
            type="number"
            min={TABLE_MIN}
            max={TABLE_MAX}
            value={cols}
            onChange={(e) => setCols(clamp(Number(e.target.value) || TABLE_MIN))}
          />
        </label>
        <label className="table-toolbar-check">
          <input
            type="checkbox"
            checked={withHeader}
            onChange={(e) => setWithHeader(e.target.checked)}
          />
          <span>{t('richEditor.tableHeaderRow')}</span>
        </label>
        <button type="button" className="table-toolbar-primary" onClick={insertTable}>
          {t('richEditor.tableInsert')}
        </button>
        <button type="button" className="table-toolbar-cancel" onClick={onClose}>
          {t('richEditor.cancel')}
        </button>
      </div>
    );
  }

  return (
    <div className="table-toolbar-panel table-toolbar-panel--edit" role="region" aria-label={t('richEditor.tableSettings')}>
      <div className="table-toolbar-actions">
        <button
          type="button"
          disabled={!editor.can().mergeCells()}
          onClick={() => editor.chain().focus().mergeCells().run()}
          title={t('richEditor.mergeCells')}
        >
          <Combine size={15} />
          <span>{t('richEditor.mergeCellsShort')}</span>
        </button>
        <button
          type="button"
          disabled={!editor.can().splitCell()}
          onClick={() => editor.chain().focus().splitCell().run()}
          title={t('richEditor.splitCell')}
        >
          <SplitSquareHorizontal size={15} />
          <span>{t('richEditor.splitCellShort')}</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          title={t('richEditor.toggleHeaderRow')}
        >
          <PanelTop size={15} />
          <span>{t('richEditor.toggleHeaderRowShort')}</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          title={t('richEditor.addTableRow')}
        >
          <Rows3 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          title={t('richEditor.addTableColumn')}
        >
          <Columns3 size={15} />
        </button>
        <button
          type="button"
          className="table-toolbar-mini"
          disabled={!editor.can().deleteRow()}
          onClick={() => editor.chain().focus().deleteRow().run()}
          title={t('richEditor.deleteTableRow')}
        >
          −R
        </button>
        <button
          type="button"
          className="table-toolbar-mini"
          disabled={!editor.can().deleteColumn()}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          title={t('richEditor.deleteTableColumn')}
        >
          −C
        </button>
        <button
          type="button"
          className="table-toolbar-danger"
          onClick={() => {
            editor.chain().focus().deleteTable().run();
            onClose();
          }}
          title={t('richEditor.deleteTable')}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="table-toolbar-border">
        <label className="table-toolbar-field table-toolbar-field--compact">
          <span>{t('richEditor.tableBorderWidth')}</span>
          <select
            value={tableAttrs.borderWidth ?? '1'}
            onChange={(e) => setBorder({ borderWidth: e.target.value as TableBorderWidth })}
          >
            <option value="0">{t('richEditor.tableBorderNone')}</option>
            <option value="1">1 px</option>
            <option value="2">2 px</option>
            <option value="3">3 px</option>
          </select>
        </label>
        <label className="table-toolbar-field table-toolbar-field--compact">
          <span>{t('richEditor.tableBorderStyle')}</span>
          <select
            value={tableAttrs.borderStyle ?? 'solid'}
            onChange={(e) => setBorder({ borderStyle: e.target.value as TableBorderStyle })}
          >
            <option value="solid">{t('richEditor.tableBorderSolid')}</option>
            <option value="dashed">{t('richEditor.tableBorderDashed')}</option>
            <option value="dotted">{t('richEditor.tableBorderDotted')}</option>
          </select>
        </label>
        <button type="button" className="table-toolbar-cancel" onClick={onClose}>
          {t('richEditor.cancel')}
        </button>
      </div>

      <p className="table-toolbar-hint">{t('richEditor.mergeCellsHint')}</p>
    </div>
  );
}
