import type { Node } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface EditorEvents {
    imageContextMenu: {
      x: number;
      y: number;
      node: Node;
      deleteNode: () => void;
      updateAttributes: (attrs: Record<string, unknown>) => void;
    };
    codeBlockContextMenu: {
      x: number;
      y: number;
    };
  }
}

export {};
