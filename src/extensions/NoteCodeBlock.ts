import CodeBlock from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/core';
import { CodeBlockView } from '../components/CodeBlockView';
import { arrowDownFromCodeBlock, exitBelowCodeBlock } from '../utils/exitCodeBlock';

function selectAllInCodeBlock(editor: Editor): boolean {
  const { selection } = editor.state;

  if (selection instanceof NodeSelection && selection.node.type.name === 'codeBlock') {
    const innerFrom = selection.from + 1;
    const innerTo = selection.from + selection.node.nodeSize - 1;
    return editor.chain().focus().setTextSelection({ from: innerFrom, to: innerTo }).run();
  }

  if (editor.isActive('codeBlock')) {
    const { $from } = editor.state.selection;
    return editor
      .chain()
      .focus()
      .setTextSelection({ from: $from.start(), to: $from.end() })
      .run();
  }

  return false;
}

export const NoteCodeBlock = CodeBlock.extend({
  priority: 1000,

  addOptions() {
    return {
      ...this.parent?.(),
      languageClassPrefix: 'language-',
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      HTMLAttributes: {
        class: 'notes-code-block',
        spellcheck: 'false',
      },
    };
  },

  addKeyboardShortcuts() {
    const parent = this.parent?.() ?? {};

    return {
      ...parent,
      'Mod-a': ({ editor }) => selectAllInCodeBlock(editor),
      'Mod-Enter': ({ editor }) => exitBelowCodeBlock(editor),
      'Shift-Enter': ({ editor }) => exitBelowCodeBlock(editor),
      ArrowDown: ({ editor }) => {
        if (arrowDownFromCodeBlock(editor)) return true;
        const fn = parent.ArrowDown;
        return typeof fn === 'function' ? fn({ editor }) : false;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});
