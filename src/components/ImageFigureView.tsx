import { useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Trash2, ZoomIn, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { usePreview } from '../context/PreviewContext';
import { WIDTH_PRESETS, ALIGN_PRESETS, type ImageAlign } from '../extensions/NoteImage';
import { scheduleStoredFileCleanup } from '../utils/scheduleStoredFileCleanup';
import './ImageFigureView.css';

export function ImageFigureView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const { openImagePreview } = usePreview();
  const captionRef = useRef<HTMLElement>(null);
  const { src, width, caption, align, storedSrc, fileId } = node.attrs as {
    src: string;
    width: string;
    caption: string;
    align: ImageAlign;
    storedSrc?: string | null;
    fileId?: string | null;
  };
  const imageAlign: ImageAlign =
    ALIGN_PRESETS.includes(align) ? align : 'left';

  useEffect(() => {
    if (selected && captionRef.current && !caption) {
      captionRef.current.focus();
    }
  }, [selected, caption]);

  const onCaptionBlur = useCallback(() => {
    const text = captionRef.current?.textContent?.trim() || '';
    if (text !== caption) {
      updateAttributes({ caption: text });
    }
  }, [caption, updateAttributes]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getPos();
      if (typeof pos === 'number') {
        editor.chain().setNodeSelection(pos).run();
      }
      editor.emit('imageContextMenu', {
        x: e.clientX,
        y: e.clientY,
        node,
        deleteNode,
        updateAttributes,
      });
    },
    [editor, node, deleteNode, updateAttributes, getPos]
  );

  return (
    <NodeViewWrapper
      className={`note-image-wrapper align-${imageAlign} ${selected ? 'is-selected' : ''}`}
      data-align={imageAlign}
      data-drag-handle
      onContextMenu={onContextMenu}
    >
      <div className="note-image-block" data-note-image-block>
        <div className="note-image-inner">
          <img
            src={src}
            alt=""
            style={{ width: width || '100%' }}
            draggable={false}
            contentEditable={false}
            className="note-image-clickable"
            onClick={(e) => {
              e.stopPropagation();
              openImagePreview(src, caption || 'Gambar');
            }}
          />
          <button
            type="button"
            className="note-image-zoom-btn"
            title="Perbesar"
            onClick={(e) => {
              e.stopPropagation();
              openImagePreview(src, caption || 'Gambar');
            }}
          >
            <ZoomIn size={18} />
          </button>
          {selected && (
            <div className="note-image-size-bar">
              <div className="note-image-align-group">
                <button
                  type="button"
                  className={imageAlign === 'left' ? 'active' : ''}
                  title="Rata kiri"
                  onClick={() => updateAttributes({ align: 'left' })}
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  className={imageAlign === 'center' ? 'active' : ''}
                  title="Rata tengah"
                  onClick={() => updateAttributes({ align: 'center' })}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  className={imageAlign === 'right' ? 'active' : ''}
                  title="Rata kanan"
                  onClick={() => updateAttributes({ align: 'right' })}
                >
                  <AlignRight size={14} />
                </button>
              </div>
              <span className="note-image-size-divider" />
              {WIDTH_PRESETS.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={width === w ? 'active' : ''}
                  onClick={() => updateAttributes({ width: w })}
                >
                  {w}
                </button>
              ))}
              <button
                type="button"
                className="note-image-delete"
                title="Hapus gambar"
                onClick={() => {
                  const url =
                    storedSrc ||
                    (fileId ? `notes-image://${fileId}` : null) ||
                    src;
                  deleteNode();
                  scheduleStoredFileCleanup(url);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <figcaption
          ref={captionRef}
          className="note-image-caption"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Keterangan gambar (mis. Gambar 1.1)"
          onBlur={onCaptionBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              captionRef.current?.blur();
            }
          }}
        >
          {caption}
        </figcaption>
      </div>
    </NodeViewWrapper>
  );
}
