import { FileTree, type TreeItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const files: TreeItem[] = [
  {
    id: 'brand',
    label: 'brand-assets',
    children: [
      {
        id: 'logos',
        label: 'logos',
        children: [
          { id: 'logo-dark', label: 'binds-wordmark-dark.svg' },
          { id: 'logo-light', label: 'binds-wordmark-light.svg' },
        ],
      },
      { id: 'guide', label: 'brand-guidelines.pdf' },
    ],
  },
  {
    id: 'signatures',
    label: 'signatures',
    children: [
      { id: 'sales-html', label: 'sales.html' },
      { id: 'support-html', label: 'support.html' },
      { id: 'users-csv', label: 'org-users.csv' },
    ],
  },
  { id: 'readme', label: 'README.md' },
];

export const doc: ComponentDoc = {
  slug: 'file-tree',
  name: 'FileTree',
  category: 'navigation',
  summary: 'A TreeView preset for folders and files, with open and closed folder icons.',
  description:
    'Use FileTree to browse uploaded assets, exported templates or any folder structure. It is a TreeView with folder and file icons chosen by extension, so it shares the same keyboard model, selection and props. Pass getFileIcon to customise file icons.',
  imports: ['FileTree'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    {
      name: 'OpenOnAction',
      title: 'Opening files',
      description: 'onAction fires on Enter or click.',
      layout: 'start',
    },
    { name: 'CustomIcons', title: 'Custom file icons', layout: 'start' },
  ],
  props: [
    {
      component: 'FileTree',
      name: 'items',
      type: 'TreeItem[]',
      required: true,
      description: 'Folders are items with children.',
    },
    {
      component: 'FileTree',
      name: 'aria-label',
      type: 'string',
      default: "'Files'",
      description: 'Name of the tree.',
    },
    {
      component: 'FileTree',
      name: 'getFileIcon',
      type: '(item: TreeItem) => IconName',
      description: 'Icon for each file; defaults to an extension-based icon.',
    },
    {
      component: 'FileTree',
      name: '...TreeViewProps',
      type: 'TreeViewProps',
      description:
        'selectionMode, selected, expanded, onAction, size and every other TreeView prop.',
    },
  ],
  accessibility: [
    'Inherits TreeView semantics: tree, treeitem and group roles with levels, positions, expansion and selection state.',
    'Folder state is conveyed by aria-expanded, not only by the open-folder icon.',
    'Icons are decorative and hidden from assistive technology.',
  ],
  keyboard: [
    { keys: ['↑', '↓'], description: 'Move between visible items.' },
    { keys: ['→', '←'], description: 'Open / close folders and move between parent and child.' },
    { keys: ['Enter'], description: 'Open the file (onAction).' },
    { keys: ['a–z'], description: 'Jump to an item by name.' },
  ],
  guidelines: {
    do: ['Sort folders before files.', 'Show full file names, including extensions.'],
    dont: ['Use FileTree for non-file hierarchies; use TreeView.'],
  },
  related: ['tree-view', 'file-upload'],
};

export function Basic() {
  return <FileTree items={files} defaultExpanded={['brand', 'logos']} style={{ width: 300 }} />;
}

export function OpenOnAction() {
  return (
    <FileTree
      items={files}
      defaultExpanded={['signatures']}
      onAction={(item) => {
        if (!item.children) window.alert(`Opening ${item.label}`);
      }}
      style={{ width: 300 }}
    />
  );
}

export function CustomIcons() {
  return (
    <FileTree
      items={files}
      defaultExpanded={['signatures']}
      getFileIcon={(item) =>
        item.label.endsWith('.csv') ? 'users' : item.label.endsWith('.html') ? 'mail' : 'file'
      }
      style={{ width: 300 }}
    />
  );
}
