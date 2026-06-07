import Image from '@tiptap/extension-image';
import { mergeAttributes, type CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageFigureView } from '../components/ImageFigureView';

export const WIDTH_PRESETS = ['25%', '50%', '75%', '100%'] as const;
export const ALIGN_PRESETS = ['left', 'center', 'right'] as const;
export type ImageAlign = (typeof ALIGN_PRESETS)[number];

/** Gambar dengan ukuran, caption, dan node view interaktif */
export const NoteImage = Image.extend({
  name: 'image',

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: { class: 'note-image' },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: '100%',
        parseHTML: (element) => {
          const img = element.tagName === 'IMG' ? element : element.querySelector('img');
          if (!img) return '100%';
          return (
            img.getAttribute('data-width') ||
            img.style.width ||
            img.getAttribute('width') ||
            '100%'
          );
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            'data-width': attributes.width,
            style: `width: ${attributes.width}; height: auto;`,
          };
        },
      },
      caption: {
        default: '',
        parseHTML: (element) => {
          const fig = element.closest?.('figure') ?? (element.tagName === 'FIGURE' ? element : null);
          if (fig) {
            const cap = fig.querySelector('figcaption');
            if (cap) return cap.textContent?.trim() || '';
          }
          const img = element.tagName === 'IMG' ? element : element.querySelector?.('img');
          return img?.getAttribute('data-caption') || '';
        },
      },
      align: {
        default: 'left',
        parseHTML: (element) => {
          const wrapper = element.closest?.('[data-align]') as HTMLElement | null;
          const fig =
            element.closest?.('figure') ??
            (element.tagName === 'FIGURE' ? element : null);
          const el = (wrapper ?? fig) as HTMLElement | null;
          const raw = el?.getAttribute('data-align') || 'left';
          return ALIGN_PRESETS.includes(raw as ImageAlign) ? raw : 'left';
        },
        renderHTML: (attributes) => ({
          'data-align': attributes.align || 'left',
        }),
      },
      storedSrc: {
        default: null,
        parseHTML: (element) => {
          const img = element.tagName === 'IMG' ? element : element.querySelector('img');
          return img?.getAttribute('data-stored-src') || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.storedSrc) return {};
          return { 'data-stored-src': attributes.storedSrc };
        },
      },
      fileId: {
        default: null,
        parseHTML: (element) => {
          const img = element.tagName === 'IMG' ? element : element.querySelector('img');
          return img?.getAttribute('data-file-id') || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.fileId) return {};
          return { 'data-file-id': attributes.fileId };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.note-image-figure',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          const img = el.querySelector('img');
          if (!img) return false;
          const align = el.getAttribute('data-align') || 'left';
          return {
            src: img.getAttribute('src'),
            width: img.getAttribute('data-width') || img.style.width || '100%',
            caption: el.querySelector('figcaption')?.textContent?.trim() || '',
            storedSrc: img.getAttribute('data-stored-src'),
            fileId: img.getAttribute('data-file-id'),
            align: ALIGN_PRESETS.includes(align as ImageAlign) ? align : 'left',
          };
        },
      },
      {
        tag: this.options.allowBase64 ? 'img[src]' : 'img[src]:not([src^="data:"])',
        getAttrs: (node) => {
          const img = node as HTMLImageElement;
          return {
            src: img.getAttribute('src'),
            width: img.getAttribute('data-width') || img.style.width || '100%',
            caption: img.getAttribute('data-caption') || '',
            storedSrc: img.getAttribute('data-stored-src'),
            fileId: img.getAttribute('data-file-id'),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { caption, width, storedSrc, fileId, align } = node.attrs;
    const imageAlign = (align as ImageAlign) || 'left';
    const imgAttrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-width': width,
      'data-caption': caption || undefined,
      'data-stored-src': storedSrc || undefined,
      'data-file-id': fileId || undefined,
      style: `width: ${width || '100%'}; height: auto;`,
    });

    const img: ['img', Record<string, unknown>] = ['img', imgAttrs];

    const figureAttrs = {
      class: 'note-image-figure',
      'data-align': imageAlign,
      'data-note-image-block': '',
    };

    const capAttrs = {
      class: 'note-image-caption',
      style: `text-align: ${imageAlign}`,
    };

    if (caption) {
      return ['figure', figureAttrs, img, ['figcaption', capAttrs, caption]];
    }

    return ['figure', figureAttrs, img, ['figcaption', capAttrs, '']];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage:
        (options: {
          src: string;
          alt?: string;
          title?: string;
          width?: string;
          caption?: string;
          storedSrc?: string;
          fileId?: string;
          align?: ImageAlign;
        }) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt,
              title: options.title,
              width: options.width ?? '100%',
              caption: options.caption ?? '',
              storedSrc: options.storedSrc ?? null,
              fileId: options.fileId ?? null,
              align: options.align ?? 'left',
            },
          }),
      setImageWidth:
        (width: string) =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes(this.name, { width }),
      setImageCaption:
        (caption: string) =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes(this.name, { caption }),
      setImageAlign:
        (align: ImageAlign) =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes(this.name, { align }),
      deleteImage:
        () =>
        ({ commands, state }: CommandProps) => {
          const { selection } = state;
          if (selection.empty) return false;
          return commands.deleteSelection();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageFigureView);
  },
});
