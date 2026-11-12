import * as React from 'react';
import { SourceList } from '@bindshq/stance-react';
import type { SourceListItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'source-list',
  name: 'SourceList',
  category: 'ai',
  summary:
    'The sources behind an answer, shown as a compact row of sites that expands to a full numbered list.',
  description:
    'Put a SourceList under an answer so readers can see what it is based on. The inline variant takes one line and expands on request. The list variant shows every source with its snippet, for a side panel or a detail view.',
  imports: ['SourceList'],
  status: 'beta',
  examples: [
    { name: 'Inline', title: 'Compact row', layout: 'fill' },
    {
      name: 'List',
      title: 'Full list',
      description: 'The list variant shows each source with its number, site and snippet.',
      layout: 'fill',
    },
    {
      name: 'Folded',
      title: 'A long list, folded',
      description: 'max folds the rest away behind one control in either variant.',
      layout: 'fill',
    },
    {
      name: 'Controlled',
      title: 'Controlled, with onSourceOpen',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SourceList',
      name: 'sources',
      type: 'SourceListItem[]',
      required: true,
      description:
        'The sources in citation order: { id, title, url?, domain?, favicon?, snippet? }.',
    },
    {
      component: 'SourceList',
      name: 'variant',
      type: "'inline' | 'list'",
      default: "'inline'",
      description: 'A compact row that expands, or full rows.',
    },
    {
      component: 'SourceList',
      name: 'max',
      type: 'number',
      default: '3 inline, all in a list',
      description: 'How many sources show before the rest are folded away.',
    },
    {
      component: 'SourceList',
      name: 'onSourceOpen',
      type: '(source: SourceListItem) => void',
      description: 'Called when the reader opens a source.',
    },
    {
      component: 'SourceList',
      name: 'expanded',
      type: 'boolean',
      description: 'Controlled expanded state.',
    },
    {
      component: 'SourceList',
      name: 'defaultExpanded',
      type: 'boolean',
      default: 'false',
      description: 'Start expanded when uncontrolled.',
    },
    {
      component: 'SourceList',
      name: 'onExpandedChange',
      type: '(expanded: boolean) => void',
      description: 'Called when the list expands or collapses.',
    },
    {
      component: 'SourceList',
      name: 'target',
      type: 'HTMLAttributeAnchorTarget',
      default: "'_blank'",
      description: 'Link target for sources.',
    },
    {
      component: 'SourceList',
      name: 'labels',
      type: 'Partial<SourceListLabels>',
      description:
        'Translations for the heading, the expand and collapse controls and the new tab text.',
    },
  ],
  accessibility: [
    'The list is a group named by its visible heading.',
    'The expand control is a button with aria-expanded and aria-controls, and focus stays on it when the list opens or closes.',
    'Each compact chip is named by its site and the full title, so sources from the same site can be told apart.',
    'The expanded view is an ordered list, so screen readers announce how many sources there are.',
    'Chips and controls grow to 44px on touch screens.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through the sources and the expand control.' },
    { keys: ['Enter'], description: 'Opens the focused source.' },
    { keys: ['Enter', 'Space'], description: 'On the control: expands or collapses the list.' },
  ],
  guidelines: {
    do: [
      'Keep the same order and numbers as the citation markers in the answer.',
      'Use the inline variant under a message and the list variant where there is room to read.',
    ],
    dont: [
      'List sources that were retrieved and not used.',
      'Hide the list when there is only one source.',
    ],
  },
  related: ['citation-chip', 'source-preview'],
};

const sources: SourceListItem[] = [
  {
    id: 'retention',
    title: 'Retention policy for signed documents',
    url: 'https://www.example.com/policies/retention',
    snippet: 'Signed documents are kept for seven years from the date of the last signature.',
  },
  {
    id: 'regions',
    title: 'Where your data is stored',
    url: 'https://trust.example.com/regions',
    snippet: 'Documents stay in the region chosen when the workspace was created.',
  },
  {
    id: 'export',
    title: 'Export a workspace',
    url: 'https://help.example.com/export',
    snippet: 'Owners can export every document and its audit trail at any time.',
  },
  {
    id: 'msa',
    title: 'Master services agreement.pdf',
    domain: 'Uploaded file',
    snippet: 'Either party may end this agreement with 30 days written notice.',
  },
  {
    id: 'audit',
    title: 'Audit trail reference',
    url: 'https://developers.example.com/audit-trail',
    snippet: 'Every view, signature and download is recorded with a timestamp.',
  },
];

export function Inline() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <SourceList sources={sources} />
    </div>
  );
}

export function List() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <SourceList sources={sources.slice(0, 3)} variant="list" />
    </div>
  );
}

export function Folded() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <SourceList
        sources={sources}
        variant="list"
        max={2}
        labels={{ more: (hidden, total) => `Show all ${total}` }}
      />
    </div>
  );
}

export function Controlled() {
  const [expanded, setExpanded] = React.useState(false);
  const [opened, setOpened] = React.useState('Nothing opened yet');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 480 }}>
      <SourceList
        sources={sources}
        max={2}
        target="_self"
        expanded={expanded}
        onExpandedChange={setExpanded}
        onSourceOpen={(source) => setOpened(`Opened: ${source.title}`)}
      />
      <span style={{ fontSize: 13 }}>{opened}</span>
    </div>
  );
}
