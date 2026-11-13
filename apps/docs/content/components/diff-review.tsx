import * as React from 'react';
import {
  DiffReview,
  diffLines,
  type DiffReviewDecisions,
  type DiffReviewFile,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'diff-review',
  name: 'DiffReview',
  category: 'ai',
  summary:
    'Review a proposed change line by line. Accept or reject each hunk, each file or everything at once.',
  description:
    'Use DiffReview before an AI change lands, so people see exactly what will be added and removed and decide part by part. It takes hunks as data and records a decision for each. Pair it with ApprovalPrompt when the change also needs permission to run.',
  imports: ['DiffReview', 'diffLines'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Review by hunk',
      description: 'Each change has its own accept and reject. The summary counts what is decided.',
      layout: 'fill',
    },
    {
      name: 'Split',
      title: 'Side by side',
      description: 'The split view pairs removed lines with the lines that replace them.',
      layout: 'fill',
    },
    {
      name: 'Controlled',
      title: 'Controlled decisions',
      description: 'The app owns the decisions and applies the accepted hunks.',
      layout: 'fill',
    },
    {
      name: 'ReadOnly',
      title: 'Read only',
      description: 'Shows what changed without decisions, for a change that already landed.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'DiffReview',
      name: 'files',
      type: 'DiffReviewFile[]',
      required: true,
      description:
        'The files that change. Each has an id, path, status and hunks; each hunk has an id, optional header and lines of kind add, remove or context.',
    },
    {
      component: 'DiffReview',
      name: 'decisions',
      type: "Record<string, 'accepted' | 'rejected'>",
      description: 'Controlled decisions, keyed by hunk id. A hunk without one is pending.',
    },
    {
      component: 'DiffReview',
      name: 'defaultDecisions',
      type: "Record<string, 'accepted' | 'rejected'>",
      description: 'Decisions on first render when uncontrolled.',
    },
    {
      component: 'DiffReview',
      name: 'onDecisionsChange',
      type: '(decisions: DiffReviewDecisions) => void',
      description: 'Called with the full record whenever a decision changes.',
    },
    {
      component: 'DiffReview',
      name: 'view',
      type: "'unified' | 'split'",
      description: 'Controlled layout: one column, or old and new side by side.',
    },
    {
      component: 'DiffReview',
      name: 'defaultView',
      type: "'unified' | 'split'",
      default: "'unified'",
      description: 'Layout on first render when uncontrolled.',
    },
    {
      component: 'DiffReview',
      name: 'onViewChange',
      type: "(view: 'unified' | 'split') => void",
      description: 'Called when the reader switches layout.',
    },
    {
      component: 'DiffReview',
      name: 'onAcceptAll',
      type: '() => void',
      description: 'Called after accept all, once every hunk is marked accepted.',
    },
    {
      component: 'DiffReview',
      name: 'onRejectAll',
      type: '() => void',
      description: 'Called after reject all, once every hunk is marked rejected.',
    },
    {
      component: 'DiffReview',
      name: 'collapsedIds',
      type: 'string[]',
      description: 'Controlled ids of collapsed files.',
    },
    {
      component: 'DiffReview',
      name: 'defaultCollapsedIds',
      type: 'string[]',
      description: 'Collapsed files on first render when uncontrolled.',
    },
    {
      component: 'DiffReview',
      name: 'onCollapsedChange',
      type: '(ids: string[]) => void',
      description: 'Called when a file collapses or expands.',
    },
    {
      component: 'DiffReview',
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      description: 'Hide accept and reject, for a diff that is only shown.',
    },
    {
      component: 'DiffReview',
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      description: 'Wrap long lines instead of scrolling sideways.',
    },
    {
      component: 'DiffReview',
      name: 'labels',
      type: 'Partial<DiffReviewLabels>',
      description:
        'Translations for every string, including summary, the file status and decision words, hunk(index, count, path) and the hidden words for added, removed and unchanged lines.',
    },
    {
      component: 'diffLines',
      name: 'oldText, newText',
      type: 'string',
      required: true,
      description: 'The text before and after. Returns hunks in the shape DiffReview takes.',
    },
    {
      component: 'diffLines',
      name: 'options',
      type: '{ context?: number; idPrefix?: string }',
      default: '{ context: 3, idPrefix: "hunk" }',
      description:
        'Lines of context around each change, and a prefix that keeps hunk ids unique across files.',
    },
  ],
  accessibility: [
    'Added lines start with a plus and removed lines with a minus, and each carries a hidden word: Added, Removed or Unchanged.',
    'Each hunk is a named group, for example Change 1 of 2 in src/price.ts, Accepted.',
    'Accept and reject are toggle buttons that name their change and expose their pressed state.',
    'Each decision is announced politely, once.',
    'File headers are disclosure buttons with the file status and line counts in words.',
    'In high contrast and forced colours, added and removed lines keep an edge marker, and removed lines are struck through.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves through the toolbar, file headers, hunks and their actions.',
    },
    {
      keys: ['ArrowDown', 'J'],
      description: 'With a hunk focused, moves to the next hunk.',
    },
    { keys: ['ArrowUp', 'K'], description: 'With a hunk focused, moves to the previous hunk.' },
    { keys: ['A'], description: 'Accepts the focused hunk. Press again to clear the decision.' },
    { keys: ['R'], description: 'Rejects the focused hunk. Press again to clear the decision.' },
    { keys: ['U'], description: 'Clears the decision on the focused hunk.' },
  ],
  guidelines: {
    do: [
      'Apply only the accepted hunks, and keep a way to undo after they land.',
      'Keep hunks small so each decision is about one idea.',
    ],
    dont: [
      'Apply changes before the review is finished.',
      'Hide rejected hunks. People may want to change their mind.',
    ],
  },
  related: ['approval-prompt', 'code-suggestion', 'plan-checklist', 'code-block'],
};

const before = `export function price(net: number) {
  const rate = 0.25;
  return net * rate;
}

export function label(net: number) {
  return "Total: " + price(net);
}`;

const after = `export function price(net: number, rate = 0.25) {
  return round(net * (1 + rate));
}

export function label(net: number) {
  return \`Total: \${price(net)}\`;
}`;

const files: DiffReviewFile[] = [
  {
    id: 'price',
    path: 'src/price.ts',
    status: 'modified',
    hunks: diffLines(before, after, { context: 1, idPrefix: 'price' }),
  },
  {
    id: 'round',
    path: 'src/round.ts',
    status: 'added',
    hunks: diffLines('', 'export const round = (n: number) => Math.round(n * 100) / 100;', {
      idPrefix: 'round',
    }),
  },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 680 }}>
      <DiffReview files={files} />
    </div>
  );
}

export function Split() {
  return (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <DiffReview files={files.slice(0, 1)} defaultView="split" wrap />
    </div>
  );
}

export function Controlled() {
  const [decisions, setDecisions] = React.useState<DiffReviewDecisions>({ 'price-1': 'accepted' });
  const accepted = Object.values(decisions).filter((value) => value === 'accepted').length;
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 680 }}>
      <DiffReview
        files={files}
        decisions={decisions}
        onDecisionsChange={setDecisions}
        defaultCollapsedIds={['round']}
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        {accepted} of {files.flatMap((file) => file.hunks).length} changes will be applied when you
        continue.
      </p>
    </div>
  );
}

export function ReadOnly() {
  return (
    <div style={{ width: '100%', maxWidth: 680 }}>
      <DiffReview files={files.slice(1)} readOnly labels={{ label: 'Applied changes' }} />
    </div>
  );
}
