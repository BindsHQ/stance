import * as React from 'react';
import { Button, ToolCallCard } from '@bindshq/stance-react';
import type { AgentStepStatus } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'tool-call-card',
  name: 'ToolCallCard',
  category: 'ai',
  summary:
    'A card for a single tool call: the tool, its status and duration, and the input and output behind a disclosure.',
  description:
    'Use ToolCallCard wherever an assistant runs a tool, so people can see what was run and what came back. The header states the tool and its status in words. Input, output and errors stay folded until someone wants the detail.',
  imports: ['ToolCallCard'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A finished call',
      description: 'Open it to read the input and the output.',
      layout: 'fill',
    },
    {
      name: 'Statuses',
      title: 'Statuses',
      description: 'Each status has its own icon shape and is written out in words.',
      layout: 'fill',
    },
    {
      name: 'Failed',
      title: 'A failed call with an action',
      description: 'Actions sit beside the disclosure, never inside it.',
      layout: 'fill',
    },
    {
      name: 'Live',
      title: 'From running to complete',
      description: 'The status change is announced once.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ToolCallCard',
      name: 'name',
      type: 'string',
      required: true,
      description: 'The tool identifier, for example web_search. Shown in monospace.',
    },
    {
      component: 'ToolCallCard',
      name: 'title',
      type: 'string',
      description: 'A readable title, for example Search the web. Defaults to the name.',
    },
    {
      component: 'ToolCallCard',
      name: 'icon',
      type: 'React.ReactNode',
      description: 'Icon before the title. Defaults to the status icon.',
    },
    {
      component: 'ToolCallCard',
      name: 'status',
      type: "'pending' | 'running' | 'complete' | 'error' | 'skipped' | 'waiting'",
      default: "'complete'",
      description: 'Where the call is.',
    },
    {
      component: 'ToolCallCard',
      name: 'input',
      type: 'React.ReactNode',
      description: 'What the tool was called with. A string renders as a code block.',
    },
    {
      component: 'ToolCallCard',
      name: 'output',
      type: 'React.ReactNode',
      description: 'What came back. A string renders as a code block.',
    },
    {
      component: 'ToolCallCard',
      name: 'error',
      type: 'React.ReactNode',
      description: 'What went wrong, shown when the call failed.',
    },
    {
      component: 'ToolCallCard',
      name: 'duration',
      type: 'number',
      description: 'How long the call took, in seconds.',
    },
    {
      component: 'ToolCallCard',
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      component: 'ToolCallCard',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Open on first render.',
    },
    {
      component: 'ToolCallCard',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the reader opens or closes the card.',
    },
    {
      component: 'ToolCallCard',
      name: 'actions',
      type: 'React.ReactNode',
      description: 'Actions at the end of the header, such as retry.',
    },
    {
      component: 'ToolCallCard',
      name: 'inputLanguage',
      type: 'string',
      default: "'json'",
      description: 'Language used to highlight a string input.',
    },
    {
      component: 'ToolCallCard',
      name: 'outputLanguage',
      type: 'string',
      default: "'json'",
      description: 'Language used to highlight a string output.',
    },
    {
      component: 'ToolCallCard',
      name: 'labels',
      type: 'ToolCallCardLabelOverrides',
      description:
        'Translations: status words, name(title, status), input, output, error and duration(seconds).',
    },
  ],
  accessibility: [
    'The header is a real button with aria-expanded and aria-controls.',
    'The status is part of the accessible name, for example Search the web, complete.',
    'A status change is announced politely, once. Nothing is announced on first render.',
    'Status is written in words and each status has its own icon shape, so it never relies on colour.',
    'Without input, output or error the header is a plain labelled group, not a button.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'Opens or closes the card.' },
    { keys: ['Tab'], description: 'Moves to the header, then to the actions and the content.' },
  ],
  guidelines: {
    do: [
      'Give each call a title a person would use, and keep the tool name as supporting text.',
      'Pass the duration so slow calls are easy to spot.',
    ],
    dont: [
      'Hide a failed call. Show the error and offer a way forward.',
      'Put secrets in the input or output. Redact them before rendering.',
    ],
  },
  related: ['step-timeline', 'approval-prompt', 'run-log', 'reasoning-disclosure', 'code-block'],
};

const input = `{
  "query": "notice period commercial lease",
  "limit": 5
}`;

const output = `{
  "results": 5,
  "top": "Clause 4.3: 90 days before the term ends"
}`;

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <ToolCallCard
        name="search_documents"
        title="Search the documents"
        duration={1.4}
        input={input}
        output={output}
      />
    </div>
  );
}

const statuses: AgentStepStatus[] = ['pending', 'running', 'waiting', 'complete', 'skipped'];

export function Statuses() {
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 520 }}>
      {statuses.map((status) => (
        <ToolCallCard key={status} name="read_file" title="Read the lease" status={status} />
      ))}
    </div>
  );
}

export function Failed() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <ToolCallCard
        name="send_email"
        title="Send the summary"
        status="error"
        duration={8}
        defaultOpen
        input={`{ "to": "legal@example.com" }`}
        error="The mail server did not respond. Nothing was sent."
        actions={
          <Button size="xs" variant="outline">
            Retry
          </Button>
        }
      />
    </div>
  );
}

export function Live() {
  const [status, setStatus] = React.useState<AgentStepStatus>('running');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <ToolCallCard
        name="run_tests"
        title="Run the tests"
        status={status}
        {...(status === 'complete' ? { duration: 12, output: <p>48 passed, 0 failed.</p> } : {})}
      />
      <div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus((s) => (s === 'running' ? 'complete' : 'running'))}
        >
          {status === 'running' ? 'Finish' : 'Run again'}
        </Button>
      </div>
    </div>
  );
}
