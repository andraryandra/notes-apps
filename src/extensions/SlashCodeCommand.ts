import { Extension, InputRule } from '@tiptap/core';

const JSON_PLACEHOLDER = '{\n  \n}';

function insertJsonCodeBlock() {
  return [
    {
      type: 'codeBlock',
      attrs: { language: 'json' },
      content: [{ type: 'text', text: JSON_PLACEHOLDER }],
    },
    { type: 'paragraph' },
  ];
}

/** Ketik `/code` lalu Enter atau Spasi → buat blok JSON */
export const SlashCodeCommand = Extension.create({
  name: 'slashCodeCommand',

  addInputRules() {
    return [
      new InputRule({
        find: /^\/code\s$/,
        handler: ({ chain, range }) => {
          chain()
            .deleteRange(range)
            .insertContent(insertJsonCodeBlock())
            .focus()
            .run();
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        const line = $from.parent.textContent.trim();
        if (line !== '/code') return false;

        const from = $from.start();
        const to = $from.end();

        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(insertJsonCodeBlock())
          .run();

        return true;
      },
    };
  },
});
