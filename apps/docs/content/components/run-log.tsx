import * as React from 'react';
import { Button, RunLog, type RunLogEntry, type RunLogLevel } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'run-log',
  name: 'RunLog',
  category: 'ai',
  summary:
    'A live monospaced log for an agent run. It stays on the newest line until you scroll up, and filters by level.',
  description:
    'Use RunLog to show the raw output of a run for people who want the detail: commands, responses and errors as they happen. It follows the tail while you are at the bottom and lets go when you scroll up to read. For a summary of what the agent did, use StepTimeline.',
  imports: ['RunLog'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A finished run',
      layout: 'fill',
    },
    {
      name: 'Live',
      title: 'Following a live run',
      description: 'New lines keep the log at the bottom. Scroll up and it stops following.',
      layout: 'fill',
    },
    {
      name: 'Filtered',
      title: 'Controlled levels',
      description: 'The app owns the filter, here starting with warnings and errors only.',
      layout: 'fill',
    },
    {
      name: 'Wrapped',
      title: 'Wrapped lines without a toolbar',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'RunLog',
      name: 'entries',
      type: 'RunLogEntry[]',
      required: true,
      description: 'The lines, oldest first. Each has an id, level, text and optional time.',
    },
    {
      component: 'RunLog',
      name: 'follow',
      type: 'boolean',
      default: 'true',
      description:
        'Follow the newest line while the reader is at the bottom. Scrolling up releases the log.',
    },
    {
      component: 'RunLog',
      name: 'levels',
      type: "('info' | 'warn' | 'error' | 'debug')[]",
      description: 'Controlled list of levels to show.',
    },
    {
      component: 'RunLog',
      name: 'defaultLevels',
      type: "('info' | 'warn' | 'error' | 'debug')[]",
      default: 'all four',
      description: 'Levels shown on first render when uncontrolled.',
    },
    {
      component: 'RunLog',
      name: 'onLevelsChange',
      type: '(levels: RunLogLevel[]) => void',
      description: 'Called when the reader changes the level filter.',
    },
    {
      component: 'RunLog',
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      description: 'Wrap long lines instead of scrolling sideways.',
    },
    {
      component: 'RunLog',
      name: 'maxHeight',
      type: 'number | string',
      default: '320',
      description: 'Height of the log before it scrolls, in px or as a CSS length.',
    },
    {
      component: 'RunLog',
      name: 'onCopy',
      type: '(text: string) => void',
      description: 'Called with the copied text. The shown lines go to the clipboard either way.',
    },
    {
      component: 'RunLog',
      name: 'showToolbar',
      type: 'boolean',
      default: 'true',
      description: 'Show the level filter and the copy button.',
    },
    {
      component: 'RunLog',
      name: 'labels',
      type: 'Partial<RunLogLabels>',
      description:
        'Translations: label, levels, level, copy, copied, latest, empty, errorAnnouncement(text) and count(shown, total).',
    },
  ],
  accessibility: [
    'The lines sit in a labelled log region that keyboard users can focus and scroll.',
    'The log itself is silent. Only new errors are announced, politely, one at a time.',
    'Every line states its level in words, so severity never depends on colour.',
    'Level filters are toggle buttons that expose their pressed state and a count.',
    'Copy confirms with a polite announcement.',
    'Only the lines near the viewport are rendered, so long logs stay responsive.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through the level filters, copy, then the log.' },
    { keys: ['Enter', 'Space'], description: 'Toggles a level or copies the shown lines.' },
    {
      keys: ['Arrow keys', 'Page Up', 'Page Down'],
      description: 'Scroll the log when it has focus.',
    },
  ],
  guidelines: {
    do: [
      'Give every line a stable id so the log can tell new lines from old.',
      'Keep it beside a summary such as StepTimeline, for people who want less detail.',
    ],
    dont: [
      'Use it as the only place an error appears. Say what failed in the conversation too.',
      'Print secrets. Redact tokens and keys before they reach the log.',
    ],
  },
  related: ['step-timeline', 'tool-call-card', 'task-queue', 'code-block', 'thread'],
};

const entries: RunLogEntry[] = [
  { id: '1', time: '14:02:10', level: 'info', text: 'Run started: review renewal terms' },
  { id: '2', time: '14:02:10', level: 'debug', text: 'Loaded 3 documents from the workspace' },
  { id: '3', time: '14:02:12', level: 'info', text: 'search_documents query="renewal notice"' },
  { id: '4', time: '14:02:13', level: 'warn', text: 'Search took 1.8 s, slower than usual' },
  { id: '5', time: '14:02:14', level: 'info', text: 'Found clauses 4.2 and 4.3 in agreement.pdf' },
  { id: '6', time: '14:02:15', level: 'error', text: 'fetch_case_law failed: 503 from provider' },
  { id: '7', time: '14:02:16', level: 'info', text: 'Retrying fetch_case_law, attempt 2 of 3' },
  { id: '8', time: '14:02:18', level: 'info', text: 'Run finished in 8.1 s' },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <RunLog entries={entries} maxHeight={220} />
    </div>
  );
}

const steps = ['Reading file', 'Calling tool', 'Parsing result', 'Writing summary'];

export function Live() {
  const [lines, setLines] = React.useState<RunLogEntry[]>(entries.slice(0, 3));
  const [running, setRunning] = React.useState(false);
  React.useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setLines((current) => {
        const n = current.length + 1;
        const level: RunLogLevel = n % 9 === 0 ? 'error' : n % 5 === 0 ? 'warn' : 'info';
        return [...current, { id: String(n), level, text: `${steps[n % steps.length]} ${n}` }];
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [running]);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 640 }}>
      <RunLog entries={lines} maxHeight={200} />
      <div>
        <Button size="sm" variant="outline" onClick={() => setRunning((value) => !value)}>
          {running ? 'Pause the run' : 'Start the run'}
        </Button>
      </div>
    </div>
  );
}

export function Filtered() {
  const [levels, setLevels] = React.useState<RunLogLevel[]>(['error', 'warn']);
  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <RunLog entries={entries} levels={levels} onLevelsChange={setLevels} maxHeight={200} />
    </div>
  );
}

export function Wrapped() {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <RunLog entries={entries} wrap showToolbar={false} maxHeight={220} />
    </div>
  );
}
