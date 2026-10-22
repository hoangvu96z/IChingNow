import { Node, mergeAttributes } from '@tiptap/core';

export default Node.create({
  name: 'noteInlineImagePlaceholder',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      imageIndex: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-note-inline-image')) || 0,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-note-inline-image]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const imageIndex = Number(node.attrs.imageIndex) || 0;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-note-inline-image': String(imageIndex),
        contenteditable: 'false',
        class: 'nn-inline-image-placeholder',
      }),
      `Ảnh nội tuyến ${imageIndex + 1}`,
    ];
  },
});
