import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { NoteImage } from '../extensions/NoteImage';
import { ImageContextMenu } from './ImageContextMenu';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { NoteTable } from '../extensions/NoteTable';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  ImagePlus,
  Paperclip,
  Copy,
  Download,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Strikethrough,
  Minus,
  Link2,
  Unlink,
  Table2,
} from 'lucide-react';
import { normalizeUrl } from '../utils/normalizeUrl';
import { FontSize } from '../extensions/FontSize';
import { ImagePasteDrop } from '../extensions/ImagePasteDrop';
import { JsonPaste } from '../extensions/JsonPaste';
import { NoteCodeBlock } from '../extensions/NoteCodeBlock';
import { BlockSpacing } from '../extensions/BlockSpacing';
import { SlashCodeCommand } from '../extensions/SlashCodeCommand';
import { NoteAttachment } from '../extensions/NoteAttachment';
import { FilePasteDrop } from '../extensions/FilePasteDrop';
import { CodeBlockContextMenu } from './CodeBlockContextMenu';
import { EditorSelectionBubble } from './EditorSelectionBubble';
import { EditorContextMenu } from './EditorContextMenu';
import { TableToolbarPanel } from './TableToolbarPanel';
import { insertAttachmentFromPick } from '../utils/attachmentInsert';
import { persistAndInsertImage } from '../utils/imageInsert';
import { copyNotePlain, copyNoteHtml, getEditorPlainText } from '../utils/exportNote';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../i18n/useI18n';
import { processEditorFileDrop } from '../utils/fileDrop';
import { resolveDropMarker, focusAtClientCoords } from '../utils/editorDropInsert';
import { sanitizePastedHtml } from '../utils/pasteHtml';
import type { Tag } from '../types';
import './RichEditor.css';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

interface Props {
  noteTitle?: string;
  content: string;
  onChange: (html: string) => void;
  tags?: Tag[];
  noteTagIds?: string[];
  onToggleTag?: (tagId: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
}

async function resolveContentImages(html: string): Promise<string> {
  if (!window.electronAPI) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgs = doc.querySelectorAll('img');
  for (const img of Array.from(imgs)) {
    const stored =
      img.getAttribute('data-stored-src') ||
      (img.getAttribute('src')?.startsWith('notes-image://') ? img.getAttribute('src') : null);
    if (!stored?.startsWith('notes-image://')) continue;
    const resolved = await window.electronAPI.resolveImage(stored);
    if (resolved) {
      img.setAttribute('src', resolved);
      img.setAttribute('data-stored-src', stored);
    }
  }
  return doc.body.innerHTML;
}

export function RichEditor({
  noteTitle = '',
  content,
  onChange,
  tags = [],
  noteTagIds = [],
  onToggleTag = () => {},
  onEditorReady,
}: Props) {
  const { t } = useI18n();
  const editorRef = useRef<Editor | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { showSuccess } = useToast();
  const [draggingFile, setDraggingFile] = useState(false);
  const [dropMarker, setDropMarker] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const [linkBarOpen, setLinkBarOpen] = useState(false);
  const [tablePanelOpen, setTablePanelOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('https://');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const contentRef = useRef(content);
  contentRef.current = content;
  const acceptEditorUpdatesRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      NoteCodeBlock,
      NoteAttachment,
      BlockSpacing,
      SlashCodeCommand,
      Underline,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'note-editor-link',
          target: '_blank',
          rel: 'noopener noreferrer',
          title: t('richEditor.linkTitle'),
          spellcheck: 'false',
        },
      }),
      NoteTable.configure({ resizable: false, HTMLAttributes: { class: 'notes-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      NoteImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder: t('richEditor.placeholder'),
      }),
      ImagePasteDrop.configure({
        getEditor: () => editorRef.current,
      }),
      JsonPaste.configure({
        getEditor: () => editorRef.current,
      }),
      FilePasteDrop,
    ],
    content,
    onUpdate: ({ editor: ed, transaction }) => {
      if (!acceptEditorUpdatesRef.current) return;
      if (!transaction.docChanged) return;
      onChangeRef.current(ed.getHTML());
    },
    editorProps: {
      attributes: { class: 'tiptap-editor' },
      transformPastedHTML: (html) => sanitizePastedHtml(html),
      handleClick: (_view, _pos, event) => {
        const anchor = (event.target as HTMLElement).closest('a.note-editor-link, a[href]');
        if (!anchor || event.button !== 0) return false;
        const href = anchor.getAttribute('href');
        if (!href) return false;
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) return false;
        event.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
        return true;
      },
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    const placeholder = editor.extensionManager.extensions.find((e) => e.name === 'placeholder');
    if (placeholder) {
      placeholder.options.placeholder = t('richEditor.placeholder');
      editor.view.dispatch(editor.state.tr);
    }
    const link = editor.extensionManager.extensions.find((e) => e.name === 'link');
    if (link?.options?.HTMLAttributes) {
      link.options.HTMLAttributes.title = t('richEditor.linkTitle');
    }
  }, [editor, t]);

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => {
      onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);

  /** Flush HTML ke store hanya saat unmount jika benar-benar berubah */
  useEffect(() => {
    return () => {
      const ed = editorRef.current;
      if (!ed) return;
      const html = ed.getHTML();
      if (html !== contentRef.current) {
        onChangeRef.current(html);
      }
    };
  }, []);

  const lastSyncedContent = useRef<string | null>(null);
  useEffect(() => {
    if (!editor) return;
    acceptEditorUpdatesRef.current = false;

    const current = editor.getHTML();
    if (content === current) {
      lastSyncedContent.current = content;
      acceptEditorUpdatesRef.current = true;
      return;
    }

    if (content === lastSyncedContent.current) {
      acceptEditorUpdatesRef.current = true;
      return;
    }
    lastSyncedContent.current = content;

    void resolveContentImages(content).then((resolved) => {
      if (resolved !== editor.getHTML()) {
        editor.commands.setContent(resolved, false);
      }
      acceptEditorUpdatesRef.current = true;
    });
  }, [content, editor]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setDraggingFile(true);

        if (editor && dropZoneRef.current) {
          setDropMarker(resolveDropMarker(editor, e.nativeEvent, dropZoneRef.current));
        }
      }
    },
    [editor]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setDraggingFile(false);
      setDropMarker(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      setDraggingFile(false);
      setDropMarker(null);
      if (!e.dataTransfer?.types?.includes('Files')) return;

      // Wajib sinkron — await dulu bikin Electron/Chromium unduh / buka tab file
      e.preventDefault();
      e.stopPropagation();

      if (!editor) return;

      void processEditorFileDrop(editor, e.dataTransfer, e.nativeEvent).then((handled) => {
        if (handled) showSuccess(t('richEditor.fileAdded'));
      });
    },
    [editor, showSuccess, t]
  );

  const insertImage = useCallback(async () => {
    if (!editor || !window.electronAPI) return;
    const insertRange = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
    const url = await window.electronAPI.uploadImage();
    if (url) await persistAndInsertImage(editor, { storedUrl: url }, undefined, insertRange);
  }, [editor]);

  const insertFile = useCallback(async () => {
    if (!editor) return;
    const ok = await insertAttachmentFromPick(editor);
    if (ok) showSuccess(t('richEditor.fileAdded'));
  }, [editor, showSuccess, t]);

  const handleCopyAll = useCallback(async () => {
    if (!editor) return;
    try {
      const body = getEditorPlainText(editor, {
        image: t('richEditor.plainImage'),
        attachment: t('richEditor.plainAttachment'),
      });
      await copyNotePlain(noteTitle, body);
      showSuccess(t('richEditor.copied'));
    } catch {
      showSuccess(t('richEditor.copyFailed'));
    }
  }, [editor, noteTitle, showSuccess, t]);

  const handleCopyHtml = useCallback(async () => {
    if (!editor) return;
    try {
      await copyNoteHtml(noteTitle, editor.getHTML());
      showSuccess(t('richEditor.htmlCopied'));
    } catch {
      const body = getEditorPlainText(editor, {
        image: t('richEditor.plainImage'),
        attachment: t('richEditor.plainAttachment'),
      });
      await copyNotePlain(noteTitle, body);
      showSuccess(t('richEditor.textCopied'));
    }
  }, [editor, noteTitle, showSuccess, t]);

  const openLinkBar = useCallback(() => {
    setTablePanelOpen(false);
    if (!editor) return;
    const { empty } = editor.state.selection;
    if (empty && !editor.isActive('link')) {
      showSuccess(t('richEditor.selectTextForLink'));
      return;
    }
    const href = editor.getAttributes('link').href as string | undefined;
    setLinkInput(href || 'https://');
    setLinkBarOpen(true);
  }, [editor, showSuccess, t]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const trimmed = linkInput.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkBarOpen(false);
      return;
    }
    const url = normalizeUrl(trimmed);
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkBarOpen(false);
    showSuccess(t('richEditor.linkApplied'));
  }, [editor, linkInput, showSuccess, t]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkBarOpen(false);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openLinkBar();
      }
    };
    editor.view.dom.addEventListener('keydown', onKeyDown);
    return () => editor.view.dom.removeEventListener('keydown', onKeyDown);
  }, [editor, openLinkBar]);

  const handleExport = useCallback(async () => {
    if (!editor || !window.electronAPI) return;
    const res = await window.electronAPI.exportNote({
      title: noteTitle,
      content: editor.getHTML(),
      plainText: `${noteTitle}\n\n${editor.getText()}`,
      format: 'txt',
    });
    if (res.ok) showSuccess(t('richEditor.exported'));
    else if (res.error !== 'Dibatalkan') showSuccess(t('richEditor.exportFailed'));
  }, [editor, noteTitle, showSuccess, t]);

  if (!editor) return null;

  const currentSize = editor.getAttributes('textStyle').fontSize || '16px';
  const inTable = editor.isActive('table');

  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            className={editor.isActive('bold') ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title={t('richEditor.bold')}
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className={editor.isActive('italic') ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title={t('richEditor.italic')}
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            className={editor.isActive('underline') ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title={t('richEditor.underline')}
          >
            <UnderlineIcon size={16} />
          </button>
          <button
            type="button"
            className={editor.isActive('strike') ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title={t('richEditor.strikethrough')}
          >
            <Strikethrough size={16} />
          </button>
          <button
            type="button"
            className={editor.isActive('link') ? 'active' : ''}
            onClick={openLinkBar}
            title={t('richEditor.insertLink')}
          >
            <Link2 size={16} />
          </button>
          <button
            type="button"
            disabled={!editor.isActive('link')}
            onClick={removeLink}
            title={t('richEditor.removeLink')}
          >
            <Unlink size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <select
            className="font-size-select"
            value={currentSize}
            onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
            title={t('richEditor.fontSize')}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {parseInt(size, 10)}px
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            type="button"
            className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title={t('richEditor.heading1')}
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title={t('richEditor.heading2')}
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            className={editor.isActive('bulletList') ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title={t('richEditor.bulletList')}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className={editor.isActive('orderedList') ? 'active' : ''}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title={t('richEditor.numberedList')}
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title={t('richEditor.horizontalRule')}
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            className={inTable || tablePanelOpen ? 'active' : ''}
            onClick={() => {
              setLinkBarOpen(false);
              setTablePanelOpen((v) => !v);
            }}
            title={inTable ? t('richEditor.tableSettings') : t('richEditor.insertTable')}
          >
            <Table2 size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button type="button" onClick={insertImage} title={t('richEditor.uploadImage')}>
            <ImagePlus size={16} />
          </button>
          <button type="button" onClick={insertFile} title={t('richEditor.importFile')}>
            <Paperclip size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button type="button" onClick={handleCopyAll} title={t('richEditor.copyText')}>
            <Copy size={16} />
          </button>
          <button
            type="button"
            onClick={handleCopyHtml}
            title={t('richEditor.copyHtml')}
            className="toolbar-text-btn"
          >
            HTML
          </button>
          <button type="button" onClick={handleExport} title={t('richEditor.exportFile')}>
            <Download size={16} />
          </button>
        </div>

        {tags.length > 0 && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-tags">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`toolbar-tag ${noteTagIds.includes(tag.id) ? 'active' : ''}`}
                  style={
                    noteTagIds.includes(tag.id)
                      ? { background: tag.color, borderColor: tag.color, color: '#fff' }
                      : { borderColor: tag.color, color: tag.color }
                  }
                  onClick={() => onToggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {tablePanelOpen && (
        <TableToolbarPanel
          editor={editor}
          open={tablePanelOpen}
          onClose={() => setTablePanelOpen(false)}
        />
      )}

      {linkBarOpen && (
        <div className="link-edit-bar">
          <Link2 size={16} className="link-edit-bar-icon" aria-hidden />
          <input
            type="url"
            className="link-edit-input"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder={t('richEditor.linkPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') setLinkBarOpen(false);
            }}
            autoFocus
          />
          <button type="button" className="link-edit-apply" onClick={applyLink}>
            {t('richEditor.apply')}
          </button>
          {editor.isActive('link') && (
            <button type="button" className="link-edit-remove" onClick={removeLink}>
              {t('richEditor.remove')}
            </button>
          )}
          <button type="button" className="link-edit-cancel" onClick={() => setLinkBarOpen(false)}>
            {t('richEditor.cancel')}
          </button>
        </div>
      )}

      <div
        ref={dropZoneRef}
        className={`editor-content-wrap editor-drop-zone ${draggingFile ? 'drag-over-files' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDropCapture={handleDrop}
        onMouseDown={(e) => {
          if (!editor) return;
          const t = e.target as HTMLElement;
          if (t.classList.contains('editor-content-wrap')) {
            focusAtClientCoords(editor, e.clientX, e.clientY);
          }
        }}
      >
        {dropMarker && (
          <div
            className="editor-drop-marker"
            style={{
              top: dropMarker.top,
              left: dropMarker.left,
              width: dropMarker.width,
            }}
            aria-hidden
          />
        )}
        <EditorContent editor={editor} />
        <EditorSelectionBubble
          editor={editor}
          onInsertImage={() => void insertImage()}
          onInsertFile={() => void insertFile()}
        />
        <EditorContextMenu
          editor={editor}
          onInsertImage={() => void insertImage()}
          onInsertFile={() => void insertFile()}
        />
        <ImageContextMenu editor={editor} />
        <CodeBlockContextMenu editor={editor} />
      </div>
    </div>
  );
}
