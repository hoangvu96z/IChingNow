import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/react';

const TASK_INPUT_REGEX = /^\s*(?:[-+*]\s+)?\[([ xX])\]\s$/;

export const NoteTaskList = Node.create({
  name: 'taskList',
  group: 'block list',
  content: 'taskItem+',

  parseHTML() {
    return [
      {
        tag: 'ul[data-type="taskList"]',
        priority: 51,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'ul',
      mergeAttributes(HTMLAttributes, { 'data-type': 'taskList' }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ commands }) =>
          commands.toggleList(this.name, 'taskItem'),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-9': () => this.editor.commands.toggleTaskList(),
    };
  },
});

export const NoteTaskItem = Node.create({
  name: 'taskItem',
  content: 'paragraph block*',
  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => {
          const dataChecked = element.getAttribute('data-checked');
          if (dataChecked === 'true' || dataChecked === '') return true;
          if (dataChecked === 'false') return false;
          const checkbox = element.querySelector('input[type="checkbox"]');
          return Boolean(checkbox?.hasAttribute('checked') || checkbox?.checked);
        },
        renderHTML: (attributes) => ({
          'data-checked': attributes.checked ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'li[data-type="taskItem"]',
        priority: 51,
        contentElement: (element) => element.querySelector('div') || element,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'taskItem',
        'data-checked': node.attrs.checked ? 'true' : 'false',
      }),
      [
        'label',
        [
          'input',
          {
            type: 'checkbox',
            ...(node.attrs.checked ? { checked: 'checked' } : {}),
          },
        ],
      ],
      ['div', 0],
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li');
      const checkboxLabel = document.createElement('label');
      const checkbox = document.createElement('input');
      const content = document.createElement('div');

      checkboxLabel.contentEditable = 'false';
      checkboxLabel.className = 'nn-task-checkbox-label';
      checkbox.type = 'checkbox';
      checkbox.className = 'nn-task-checkbox';

      const syncAccessibility = (currentNode) => {
        const text = (currentNode.textContent || '').trim();
        checkbox.setAttribute(
          'aria-label',
          text ? `Mục công việc: ${text.slice(0, 80)}` : 'Mục công việc',
        );
        checkbox.disabled = !editor.isEditable;
      };

      Object.entries(HTMLAttributes || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          listItem.setAttribute(key, String(value));
        }
      });
      listItem.setAttribute('data-type', 'taskItem');
      listItem.dataset.checked = node.attrs.checked ? 'true' : 'false';
      checkbox.checked = Boolean(node.attrs.checked);
      syncAccessibility(node);

      checkbox.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });

      checkbox.addEventListener('change', (event) => {
        if (!editor.isEditable) {
          checkbox.checked = !checkbox.checked;
          return;
        }
        const nextChecked = Boolean(event.target.checked);
        if (typeof getPos === 'function') {
          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const pos = getPos();
              if (typeof pos !== 'number') return false;
              const currentNode = tr.doc.nodeAt(pos);
              if (!currentNode) return false;
              tr.setNodeMarkup(pos, undefined, {
                ...currentNode.attrs,
                checked: nextChecked,
              });
              return true;
            })
            .run();
        }
      });

      checkboxLabel.appendChild(checkbox);
      listItem.append(checkboxLabel, content);

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false;
          listItem.dataset.checked = updatedNode.attrs.checked ? 'true' : 'false';
          checkbox.checked = Boolean(updatedNode.attrs.checked);
          syncAccessibility(updatedNode);
          return true;
        },
      };
    };
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: TASK_INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => ({
          checked: (match[1] || '').toLowerCase() === 'x',
        }),
      }),
    ];
  },
});
