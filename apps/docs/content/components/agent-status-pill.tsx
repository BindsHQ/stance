import * as React from 'react';
import { AgentStatusPill, Button } from '@bindshq/stance-react';
import type { AgentStatus } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'agent-status-pill',
  name: 'AgentStatusPill',
  category: 'ai',
  summary:
    'A small pill that says what an agent is doing right now, from idle and working to waiting for you, done or failed.',
  description:
    'Use AgentStatusPill in a header, a list row or beside an avatar to show the state of an agent at a glance. It always says the state in words. Make it a button when pressing it should open the run.',
  imports: ['AgentStatusPill'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'All statuses',
    },
    {
      name: 'Detail',
      title: 'Custom label and detail',
      description: 'Say what the agent is working on and how far it has come.',
    },
    {
      name: 'Pressable',
      title: 'Pressable',
      description: 'With onPress the pill is a button.',
    },
    {
      name: 'Live',
      title: 'Announced changes',
      description: 'Waiting for you is announced assertively, once. Other changes are polite.',
    },
  ],
  props: [
    {
      component: 'AgentStatusPill',
      name: 'status',
      type: "'idle' | 'working' | 'waiting' | 'done' | 'error' | 'paused'",
      required: true,
      description: 'What the agent is doing now.',
    },
    {
      component: 'AgentStatusPill',
      name: 'label',
      type: 'string',
      description: 'Overrides the words for this status, for example Researching.',
    },
    {
      component: 'AgentStatusPill',
      name: 'detail',
      type: 'string',
      description: 'Short supporting text after the label, for example Step 3 of 5.',
    },
    {
      component: 'AgentStatusPill',
      name: 'onPress',
      type: '() => void',
      description: 'Makes the pill a button, for example to open the run.',
    },
    {
      component: 'AgentStatusPill',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'The size of the pill.',
    },
    {
      component: 'AgentStatusPill',
      name: 'labels',
      type: 'Partial<AgentStatusPillLabels>',
      description: 'Translations for the status words.',
    },
  ],
  accessibility: [
    'A status by default, and a real button when onPress is given.',
    'The state is always written in words. Each state also has its own icon shape.',
    'A change to waiting is announced assertively, once. Other status changes are announced politely.',
    'Nothing is announced on first render, or when only the detail changes.',
    'With reduced motion the working dot does not pulse.',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'Activates the pill when it is a button.' }],
  guidelines: {
    do: [
      'Keep the label to one or two words and put the rest in the detail.',
      'Use waiting only when the agent cannot continue without the person.',
    ],
    dont: [
      'Show several pills for one agent.',
      'Use it for the progress of a single message. Use ThinkingIndicator for that.',
    ],
  },
  related: ['task-queue', 'step-timeline', 'subagent-tree', 'thinking-indicator', 'badge'],
};

const all: AgentStatus[] = ['idle', 'working', 'waiting', 'paused', 'done', 'error'];

export function Basic() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {all.map((status) => (
        <AgentStatusPill key={status} status={status} />
      ))}
    </div>
  );
}

export function Detail() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      <AgentStatusPill status="working" label="Researching" detail="Step 3 of 5" />
      <AgentStatusPill status="waiting" label="Needs approval" detail="Send email" />
      <AgentStatusPill status="done" detail="2 min" size="sm" />
    </div>
  );
}

export function Pressable() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <AgentStatusPill status="waiting" detail="1 request" onPress={() => setCount((n) => n + 1)} />
      <span style={{ fontSize: 14 }}>Opened {count} times</span>
    </div>
  );
}

export function Live() {
  const [index, setIndex] = React.useState(1);
  const status = all[index % all.length] ?? 'idle';
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <AgentStatusPill status={status} />
      <Button size="sm" variant="outline" onClick={() => setIndex((n) => n + 1)}>
        Next status
      </Button>
    </div>
  );
}
