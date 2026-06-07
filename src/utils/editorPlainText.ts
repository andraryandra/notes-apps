import { getText, getTextBetween, getTextSerializersFromSchema, type Editor, type TextSerializer } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface EditorPlainTextLabels {
  image: string;
  attachment: string;
}

const DEFAULT_LABELS: EditorPlainTextLabels = {
  image: '[gambar]',
  attachment: '[file]',
};

/** Teks plain dari dokumen TipTap — list, heading, quote, dll. dipertahankan */
export function getEditorPlainText(
  editor: Editor,
  labels: Partial<EditorPlainTextLabels> = {}
): string {
  const L = { ...DEFAULT_LABELS, ...labels };
  const textSerializers = createPlainTextSerializers(editor, L);
  return editor.getText({ blockSeparator: '\n', textSerializers }).trim();
}

/** Teks plain dari seleksi editor saja */
export function getEditorSelectionPlainText(
  editor: Editor,
  labels: Partial<EditorPlainTextLabels> = {}
): string {
  const { from, to } = editor.state.selection;
  if (from === to) return '';
  const L = { ...DEFAULT_LABELS, ...labels };
  const textSerializers = createPlainTextSerializers(editor, L);
  return getTextBetween(editor.state.doc, { from, to }, { blockSeparator: '\n', textSerializers }).trim();
}

function createPlainTextSerializers(
  editor: Editor,
  L: EditorPlainTextLabels
): Record<string, TextSerializer> {
  const textSerializers: Record<string, TextSerializer> = {
    ...getTextSerializersFromSchema(editor.schema),
  };

  const childText = (node: ProseMirrorNode) =>
    getText(node, { blockSeparator: '\n', textSerializers }).trim();

  Object.assign(textSerializers, {
    hardBreak: (() => '\n') as TextSerializer,

    listItem: (({ node, index, parent }) => {
      const body = childText(node);
      if (parent?.type.name === 'orderedList') return `${index + 1}. ${body}`;
      if (parent?.type.name === 'bulletList') return `• ${body}`;
      return body;
    }) as TextSerializer,

    heading: (({ node }) => {
      const level = Math.min(Math.max(Number(node.attrs.level) || 1, 1), 6);
      return `${'#'.repeat(level)} ${node.textContent}`;
    }) as TextSerializer,

    blockquote: (({ node }) =>
      childText(node)
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n')) as TextSerializer,

    codeBlock: (({ node }) => childText(node)) as TextSerializer,

    horizontalRule: (() => '---') as TextSerializer,

    image: (({ node }) => {
      const alt = String(node.attrs.alt ?? '').trim();
      return alt ? `[${alt}]` : `[${L.image}]`;
    }) as TextSerializer,

    noteAttachment: (({ node }) => {
      const name = String(node.attrs.fileName ?? '').trim();
      return name ? `[${name}]` : `[${L.attachment}]`;
    }) as TextSerializer,

    tableRow: (({ node }) => {
      const cells: string[] = [];
      node.forEach((cell: ProseMirrorNode) => {
        cells.push(childText(cell).replace(/\n/g, ' '));
      });
      return cells.join('\t');
    }) as TextSerializer,

    table: (({ node }) => {
      const rows: string[] = [];
      node.forEach((row: ProseMirrorNode) => {
        rows.push(childText(row));
      });
      return rows.join('\n');
    }) as TextSerializer,
  });

  return textSerializers;
}

function liPlainContent(li: Element): string {
  let inner = '';
  for (const child of li.childNodes) {
    inner += serializeHtmlNode(child);
  }
  return inner.trim();
}

function serializeHtmlNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as Element;
  const tag = el.tagName;

  if (tag === 'BR') return '\n';

  if (tag === 'OL') {
    let out = '';
    let i = 0;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'LI') {
        i += 1;
        const body = liPlainContent(child as Element);
        if (body) out += `${i}. ${body}\n`;
      }
    }
    return out;
  }

  if (tag === 'UL') {
    let out = '';
    for (const child of el.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'LI') {
        const body = liPlainContent(child as Element);
        if (body) out += `• ${body}\n`;
      }
    }
    return out;
  }

  if (tag === 'LI') {
    return liPlainContent(el);
  }

  if (tag === 'HR') return '\n---\n';

  if (/^H[1-6]$/.test(tag)) {
    const level = Number(tag.slice(1));
    const text = el.textContent?.trim() ?? '';
    return text ? `${'#'.repeat(level)} ${text}\n` : '';
  }

  if (tag === 'BLOCKQUOTE') {
    const inner = Array.from(el.childNodes).map(serializeHtmlNode).join('').trim();
    return inner
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n');
  }

  if (tag === 'PRE' || el.classList.contains('notes-code-block')) {
    return `${el.textContent ?? ''}\n`;
  }

  if (tag === 'IMG') {
    const alt = el.getAttribute('alt')?.trim();
    return alt ? `[${alt}]` : DEFAULT_LABELS.image;
  }

  if (el.hasAttribute('data-note-attachment')) {
    const name = el.getAttribute('data-file-name')?.trim();
    return name ? `[${name}]` : DEFAULT_LABELS.attachment;
  }

  if (tag === 'TR') {
    const cells = Array.from(el.querySelectorAll('th,td')).map((cell) =>
      (cell.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
    return `${cells.join('\t')}\n`;
  }

  if (tag === 'TABLE') {
    return Array.from(el.querySelectorAll('tr'))
      .map((row) =>
        Array.from(row.querySelectorAll('th,td'))
          .map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim())
          .join('\t')
      )
      .join('\n');
  }

  const BLOCK_TAGS = new Set(['P', 'DIV', 'FIGURE', 'DT', 'DD']);
  let inner = '';
  for (const child of el.childNodes) {
    inner += serializeHtmlNode(child);
  }

  if (BLOCK_TAGS.has(tag)) {
    const line = inner.trim();
    return line ? `${line}\n` : '';
  }
  return inner;
}

function collapsePlainText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Fallback plain text dari HTML tersimpan (ekspor tanpa instance editor) */
export function htmlToPlainText(html: string): string {
  if (!html.trim()) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return collapsePlainText(serializeHtmlNode(div));
}
