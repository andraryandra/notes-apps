import { useCallback, useEffect, useMemo, useState } from 'react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { Trash2, Copy, TextCursorInput } from 'lucide-react';
import { highlightJsonToHtml } from '../utils/jsonHighlight';
import { useToast } from '../hooks/useToast';
import { exitBelowCodeBlock } from '../utils/exitCodeBlock';
import './CodeBlockView.css';

export function CodeBlockView({ node, deleteNode, selected, editor, getPos }: NodeViewProps) {
  const { showSuccess } = useToast();
  const language = (node.attrs.language as string) || 'code';
  const isJson = language === 'json';
  const label = isJson ? 'JSON' : language.toUpperCase();
  const text = node.textContent;

  const [cursorInside, setCursorInside] = useState(false);

  const blockPos = typeof getPos === 'function' ? getPos() : null;

  const syncCursorInside = useCallback(() => {
    if (typeof blockPos !== 'number') return;
    const { from, to } = editor.state.selection;
    const inside = from >= blockPos && to <= blockPos + node.nodeSize;
    setCursorInside(inside);
  }, [editor, blockPos, node.nodeSize]);

  useEffect(() => {
    syncCursorInside();
    editor.on('selectionUpdate', syncCursorInside);
    editor.on('focus', syncCursorInside);
    editor.on('blur', syncCursorInside);
    return () => {
      editor.off('selectionUpdate', syncCursorInside);
      editor.off('focus', syncCursorInside);
      editor.off('blur', syncCursorInside);
    };
  }, [editor, syncCursorInside]);

  const highlightedHtml = useMemo(
    () => (isJson ? highlightJsonToHtml(text) : ''),
    [isJson, text]
  );

  const showHighlightLayer = isJson && highlightedHtml && cursorInside;

  const focusInside = useCallback(() => {
    if (typeof blockPos !== 'number') return;
    const from = blockPos + 1;
    const to = blockPos + node.nodeSize - 1;
    editor.chain().focus().setTextSelection({ from, to }).run();
  }, [editor, blockPos, node.nodeSize]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(isJson ? 'JSON disalin' : 'Kode disalin');
    } catch {
      showSuccess('Gagal menyalin');
    }
  }, [text, isJson, showSuccess]);

  const insertTextBelow = useCallback(() => {
    if (typeof blockPos === 'number') {
      editor.chain().focus().setNodeSelection(blockPos).run();
    }
    exitBelowCodeBlock(editor);
  }, [editor, blockPos]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof blockPos === 'number') {
        editor.chain().focus().setTextSelection(blockPos + 1).run();
      }
      editor.emit('codeBlockContextMenu', {
        x: e.clientX,
        y: e.clientY,
      });
    },
    [editor, blockPos]
  );

  return (
    <NodeViewWrapper
      className={`note-code-block-wrapper ${selected ? 'is-selected' : ''} ${isJson ? 'json-theme' : ''}`}
      onContextMenu={onContextMenu}
    >
      <div className="note-code-block-header">
        <span className="note-code-block-label">{label}</span>
        <div className="note-code-block-actions">
          <button
            type="button"
            className="note-code-block-below"
            title="Tambah baris teks di bawah (Shift+Enter)"
            onClick={insertTextBelow}
          >
            <TextCursorInput size={14} />
            Teks di bawah
          </button>
          <button
            type="button"
            className="note-code-block-copy"
            title={isJson ? 'Salin JSON' : 'Salin kode'}
            onClick={() => void handleCopy()}
          >
            <Copy size={14} />
            Salin
          </button>
          <button
            type="button"
            className="note-code-block-delete"
            title="Hapus blok kode"
            onClick={() => deleteNode()}
          >
            <Trash2 size={14} />
            Hapus
          </button>
        </div>
      </div>
      <pre
        spellCheck={false}
        className={`note-code-pre ${isJson ? 'json-pre' : ''} ${showHighlightLayer ? 'json-with-highlight' : ''}`}
        onMouseDown={(e) => {
          if (isJson && !cursorInside && e.target === e.currentTarget) {
            e.preventDefault();
            focusInside();
          }
        }}
      >
        {showHighlightLayer && (
          <code
            className="language-json json-highlight-layer"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}
        <NodeViewContent
          as="code"
          className={isJson ? 'language-json json-editable' : ''}
        />
      </pre>
    </NodeViewWrapper>
  );
}
