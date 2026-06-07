import type { Editor } from '@tiptap/react';
import type { ParsedNoteAsset } from './parseNoteAssets';

const FLASH_CLASS = 'note-asset-flash';

function collectByType(root: Element, type: ParsedNoteAsset['type']): Element[] {
  const found: Element[] = [];

  const walk = (parent: Element) => {
    for (const el of Array.from(parent.children)) {
      if (type === 'image') {
        if (el.matches('figure.note-image-figure')) {
          found.push(el);
          continue;
        }
        if (el.tagName === 'IMG' && !el.closest('figure.note-image-figure')) {
          found.push(el);
          continue;
        }
      }

      if (type === 'file' && el.hasAttribute('data-note-attachment')) {
        found.push(el);
        continue;
      }

      if (type === 'link' && el.tagName === 'A' && el.getAttribute('href')) {
        found.push(el);
        walk(el);
        continue;
      }

      walk(el);
    }
  };

  walk(root);
  return found;
}

export function scrollToNoteAsset(editor: Editor | null, asset: ParsedNoteAsset): boolean {
  if (!editor) return false;
  const nodes = collectByType(editor.view.dom, asset.type);
  const el = nodes[asset.index];
  if (!el) return false;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add(FLASH_CLASS);
  window.setTimeout(() => el.classList.remove(FLASH_CLASS), 1600);
  return true;
}
