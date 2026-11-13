import * as React from 'react';
import { SubagentTree, type SubagentTreeNode } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'subagent-tree',
  name: 'SubagentTree',
  category: 'ai',
  summary:
    'A tree of agents and the helpers they hand work to, with a status and a one line note on every row.',
  description:
    'Use SubagentTree when one agent splits a job between several. Each row shows who is working, what on, and how it is going, so people can follow the run and open the part they care about. For a single agent with ordered steps, use StepTimeline.',
  imports: ['SubagentTree'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A lead agent and its helpers',
      description: 'Every agent with helpers starts expanded.',
      layout: 'fill',
    },
    {
      name: 'Selection',
      title: 'Select an agent',
      description: 'Select a row to show its detail beside the tree.',
      layout: 'fill',
    },
    {
      name: 'Controlled',
      title: 'Controlled expansion',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SubagentTree',
      name: 'nodes',
      type: 'SubagentTreeNode[]',
      required: true,
      description:
        'The root agents. Each node has an id, name, status, and optional summary and children.',
    },
    {
      component: 'SubagentTree',
      name: 'expandedIds',
      type: 'string[]',
      description: 'Controlled ids of expanded agents.',
    },
    {
      component: 'SubagentTree',
      name: 'defaultExpandedIds',
      type: 'string[]',
      default: 'every agent with children',
      description: 'Expanded agents on first render when uncontrolled.',
    },
    {
      component: 'SubagentTree',
      name: 'onExpandedChange',
      type: '(ids: string[]) => void',
      description: 'Called when an agent expands or collapses.',
    },
    {
      component: 'SubagentTree',
      name: 'selectedId',
      type: 'string | null',
      description: 'Controlled id of the selected agent. Pass null for none.',
    },
    {
      component: 'SubagentTree',
      name: 'defaultSelectedId',
      type: 'string | null',
      description: 'Selected agent on first render when uncontrolled.',
    },
    {
      component: 'SubagentTree',
      name: 'onSelect',
      type: '(id: string, node: SubagentTreeNode) => void',
      description: 'Called when the reader selects an agent.',
    },
    {
      component: 'SubagentTree',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Row height.',
    },
    {
      component: 'SubagentTree',
      name: 'labels',
      type: '{ label?: string; status?: Partial<StepStatusLabels> }',
      description:
        'Translations: label names the tree, status holds the words for pending, running, complete, error, skipped and waiting.',
    },
  ],
  accessibility: [
    'It is a tree with tree items, levels, positions and expanded state.',
    'The name of each item reads as name, summary, status, for example Researcher, Found 4 clauses, Complete.',
    'Status is always written in words beside an icon whose shape differs per status.',
    'One item is in the tab order. Arrow keys move inside the tree.',
    'With reduced motion the running icon does not spin.',
  ],
  keyboard: [
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Moves to the next or previous visible agent.' },
    {
      keys: ['ArrowRight'],
      description: 'Expands an agent, or moves to its first helper when it is open.',
    },
    { keys: ['ArrowLeft'], description: 'Collapses an agent, or moves to its parent.' },
    { keys: ['Home', 'End'], description: 'Moves to the first or last visible agent.' },
    { keys: ['Enter', 'Space'], description: 'Selects the agent.' },
    {
      keys: ['A to Z'],
      description: 'Moves to the next agent whose name starts with the letters.',
    },
  ],
  guidelines: {
    do: [
      'Keep each summary to one short line about the current work or the result.',
      'Give agents plain names that say what they do.',
    ],
    dont: [
      'Nest deeper than three levels; group the work instead.',
      'Use it for the steps of one agent. That is a StepTimeline.',
    ],
  },
  related: ['step-timeline', 'task-queue', 'agent-status-pill', 'tree-view'],
};

const nodes: SubagentTreeNode[] = [
  {
    id: 'lead',
    name: 'Contract review',
    status: 'running',
    summary: 'Coordinating three helpers',
    children: [
      { id: 'clauses', name: 'Clause finder', status: 'complete', summary: 'Found 14 clauses' },
      {
        id: 'risk',
        name: 'Risk checker',
        status: 'running',
        summary: 'Comparing liability terms',
        children: [
          { id: 'law', name: 'Case law search', status: 'waiting', summary: 'Needs access' },
        ],
      },
      { id: 'summary', name: 'Summary writer', status: 'pending' },
    ],
  },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <SubagentTree nodes={nodes} />
    </div>
  );
}

export function Selection() {
  const [selected, setSelected] = React.useState<SubagentTreeNode | null>(null);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <SubagentTree
        nodes={nodes}
        selectedId={selected?.id ?? null}
        onSelect={(_id, node) => setSelected(node)}
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        {selected
          ? `${selected.name}: ${selected.summary ?? 'No update yet'}`
          : 'Select an agent to see its latest update.'}
      </p>
    </div>
  );
}

export function Controlled() {
  const [expanded, setExpanded] = React.useState<string[]>(['lead']);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <SubagentTree nodes={nodes} expandedIds={expanded} onExpandedChange={setExpanded} size="sm" />
      <p style={{ margin: 0, fontSize: 14 }}>Open: {expanded.join(', ') || 'none'}</p>
    </div>
  );
}
