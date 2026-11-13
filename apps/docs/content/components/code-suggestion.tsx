import * as React from 'react';
import { CodeSuggestion } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'code-suggestion',
  name: 'CodeSuggestion',
  category: 'ai',
  summary:
    'Generated code with its file name and language, plus copy, apply and run, and the outcome of the run.',
  description:
    'Use CodeSuggestion when the assistant proposes code that people may want to use. It shows where the code belongs, lets them copy it, apply it to the file or run it, and reports what the run returned. For code that is only shown, use CodeBlock. For a change to existing code, use DiffReview.',
  imports: ['CodeSuggestion'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Copy, run and apply',
      description: 'Run shows a result under the code. Apply confirms and then stays applied.',
      layout: 'fill',
    },
    {
      name: 'Streaming',
      title: 'While the code arrives',
      description: 'Apply and run wait until the code is complete.',
      layout: 'fill',
    },
    {
      name: 'FailedRun',
      title: 'A run that failed',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'CodeSuggestion',
      name: 'code',
      type: 'string',
      required: true,
      description: 'The generated code. Rendered as text, never as HTML.',
    },
    {
      component: 'CodeSuggestion',
      name: 'language',
      type: 'string',
      description: 'Language for highlighting, shown beside the file name.',
    },
    {
      component: 'CodeSuggestion',
      name: 'filename',
      type: 'string',
      description: 'The file the code belongs to. It names the block.',
    },
    {
      component: 'CodeSuggestion',
      name: 'onCopy',
      type: '(success: boolean) => void',
      description: 'Called after the reader copies the code, with whether it worked.',
    },
    {
      component: 'CodeSuggestion',
      name: 'onApply',
      type: '() => void',
      description: 'Called when the reader applies the code. Shows the apply action.',
    },
    {
      component: 'CodeSuggestion',
      name: 'onRun',
      type: '() => void',
      description: 'Called when the reader runs the code. Shows the run action.',
    },
    {
      component: 'CodeSuggestion',
      name: 'runStatus',
      type: "'pending' | 'running' | 'complete' | 'error' | 'skipped' | 'waiting'",
      description: 'The state of the last run. Omit before the first run.',
    },
    {
      component: 'CodeSuggestion',
      name: 'runOutput',
      type: 'React.ReactNode',
      description: 'What the run printed or returned. A string renders as monospaced text.',
    },
    {
      component: 'CodeSuggestion',
      name: 'applied',
      type: 'boolean',
      default: 'false',
      description: 'Whether the code is already in place.',
    },
    {
      component: 'CodeSuggestion',
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      description: 'Wrap long lines instead of scrolling.',
    },
    {
      component: 'CodeSuggestion',
      name: 'showLineNumbers',
      type: 'boolean',
      default: 'false',
      description: 'Show line numbers.',
    },
    {
      component: 'CodeSuggestion',
      name: 'streaming',
      type: 'boolean',
      default: 'false',
      description: 'True while the code is still arriving. Apply and run wait until it ends.',
    },
    {
      component: 'CodeSuggestion',
      name: 'maxHeight',
      type: 'string',
      description: 'Max height of the code before it scrolls, as a CSS length.',
    },
    {
      component: 'CodeSuggestion',
      name: 'labels',
      type: 'Partial<CodeSuggestionLabels>',
      description:
        'Translations: label, copy, copied, apply, applied, appliedAnnouncement(filename), run, rerun, output, streaming and runStatus.',
    },
  ],
  accessibility: [
    'The block is a group named by the file name, or Suggested code without one.',
    'The code is a focusable region so keyboard users can scroll it.',
    'The run result is a polite status: the outcome is read once when it changes.',
    'Applying is confirmed with a polite announcement, for example Applied to src/total.ts.',
    'The run outcome is written in words beside its icon, never colour alone.',
    'While streaming the group is busy and nothing is announced token by token.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through copy, run, apply, then the code region.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused action.' },
    { keys: ['Arrow keys'], description: 'Scroll the code when the code region has focus.' },
  ],
  guidelines: {
    do: [
      'Pass the file name so people know where the code goes.',
      'Set applied once the change has landed so the action cannot repeat.',
    ],
    dont: [
      'Apply code without a way to undo it in your product.',
      'Run code that changes data without asking first. Use ApprovalPrompt.',
    ],
  },
  related: ['code-block', 'diff-review', 'approval-prompt', 'tool-call-card', 'markdown-renderer'],
};

const code = `export function total(net: number, rate = 0.25) {
  return Math.round(net * (1 + rate) * 100) / 100;
}`;

export function Basic() {
  const [applied, setApplied] = React.useState(false);
  const [run, setRun] = React.useState<'running' | 'complete' | undefined>(undefined);
  const start = () => {
    setRun('running');
    window.setTimeout(() => setRun('complete'), 900);
  };
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <CodeSuggestion
        code={code}
        language="ts"
        filename="src/total.ts"
        onApply={() => setApplied(true)}
        applied={applied}
        onRun={start}
        runStatus={run}
        runOutput={run === 'complete' ? 'total(80) returned 100' : undefined}
      />
    </div>
  );
}

export function Streaming() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <CodeSuggestion
        code={code.slice(0, 74)}
        language="ts"
        filename="src/total.ts"
        streaming
        onApply={() => {}}
        onRun={() => {}}
      />
    </div>
  );
}

export function FailedRun() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <CodeSuggestion
        code={'const rows = await db.query("select * from invoices");\nconsole.log(rows.length);'}
        language="ts"
        showLineNumbers
        onRun={() => {}}
        runStatus="error"
        runOutput="ConnectionError: the database did not answer within 5 seconds"
      />
    </div>
  );
}
